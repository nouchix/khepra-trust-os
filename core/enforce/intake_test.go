package enforce

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func intakeFixture(t *testing.T) (*SignalIntake, *Interdictor, []byte) {
	t.Helper()
	_, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(baseGrant()), sink)
	key := []byte("kasa-shared-key-for-test")
	intake := &SignalIntake{
		In: in,
		Keys: func(reporter string) ([]byte, Authority, bool) {
			if reporter == "KASA" {
				return key, Authority{}, true
			}
			return nil, Authority{}, false
		},
	}
	return intake, in, key
}

func post(t *testing.T, h http.Handler, body []byte, signature string) *httptest.ResponseRecorder {
	t.Helper()
	r := httptest.NewRequest(http.MethodPost, "/threat-signal", bytes.NewReader(body))
	if signature != "" {
		r.Header.Set("X-KHEPRA-Signature", signature)
	}
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	return w
}

// ── The wire works end to end: an out-of-process hunter imposes containment ──

func TestIntakeAppliesContainmentFromAuthenticatedHunter(t *testing.T) {
	intake, in, key := intakeFixture(t)
	agent := baseGrant().AgentID

	body, sigHex, err := SignSignal(key, "KASA", ThreatSignal{
		Subject: agent, Level: ThreatHigh, AnomalyScore: 0.95,
		BehaviorFlags: []string{"entropy spike"}, Evidence: "snap-1",
	}, time.Now())
	if err != nil {
		t.Fatal(err)
	}

	w := post(t, intake, body, sigHex)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var c Containment
	if err := json.Unmarshal(w.Body.Bytes(), &c); err != nil {
		t.Fatal(err)
	}
	if c.PostureOut != PostureRestricted {
		t.Fatalf("expected restricted containment, got %s", c.PostureOut)
	}

	// THE POINT: an out-of-process hunter, with zero import coupling, just made a
	// write physically fail.
	w2 := readReq()
	w2.Tool, w2.Capability, w2.StateChanging = "write_report", "write", true
	ran := false
	if _, err := in.Guard(context.Background(), w2, nil, func(context.Context) error { ran = true; return nil }); err == nil {
		t.Fatal("write should be blocked after hunter containment")
	}
	if ran {
		t.Fatal("CRITICAL: action executed despite hunter containment")
	}
}

// ── Authentication: the DoS primitive is closed ──────────────────────────────

func TestIntakeRejectsUnsignedSignal(t *testing.T) {
	intake, in, key := intakeFixture(t)
	body, _, _ := SignSignal(key, "KASA", ThreatSignal{
		Subject: baseGrant().AgentID, Level: ThreatCritical, AnomalyScore: 1.0, Corroborated: true,
	}, time.Now())

	w := post(t, intake, body, "") // no signature
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("unsigned signal must be rejected, got %d", w.Code)
	}
	if in.Sessions.Posture(baseGrant().AgentID) != PostureNormal {
		t.Fatal("CRITICAL: an unsigned signal imposed containment — this is the fleet-lockout DoS")
	}
}

func TestIntakeRejectsBadSignature(t *testing.T) {
	intake, in, key := intakeFixture(t)
	body, _, _ := SignSignal(key, "KASA", ThreatSignal{
		Subject: baseGrant().AgentID, Level: ThreatCritical, AnomalyScore: 1.0, Corroborated: true,
	}, time.Now())

	// Signature computed with the wrong key.
	_, wrongSig, _ := SignSignal([]byte("attacker-key"), "KASA", ThreatSignal{
		Subject: baseGrant().AgentID, Level: ThreatCritical,
	}, time.Now())

	w := post(t, intake, body, wrongSig)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("forged signature must be rejected, got %d", w.Code)
	}
	if in.Sessions.Posture(baseGrant().AgentID) != PostureNormal {
		t.Fatal("CRITICAL: a forged signal imposed containment")
	}
}

func TestIntakeRejectsUnknownReporter(t *testing.T) {
	intake, _, _ := intakeFixture(t)
	key := []byte("some-key")
	body, sigHex, _ := SignSignal(key, "RogueHunter", ThreatSignal{
		Subject: baseGrant().AgentID, Level: ThreatCritical,
	}, time.Now())
	w := post(t, intake, body, sigHex)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("unknown reporter must be rejected, got %d", w.Code)
	}
}

func TestIntakeFailsClosedWithoutKeyring(t *testing.T) {
	_, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(baseGrant()), sink)
	intake := &SignalIntake{In: in} // no Keys configured
	body, sigHex, _ := SignSignal([]byte("k"), "KASA", ThreatSignal{
		Subject: baseGrant().AgentID, Level: ThreatCritical,
	}, time.Now())
	w := post(t, intake, body, sigHex)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("an intake with no keyring must fail closed, got %d", w.Code)
	}
}

// Tampering with the body after signing must invalidate it.
func TestIntakeDetectsBodyTampering(t *testing.T) {
	intake, in, key := intakeFixture(t)
	body, sigHex, _ := SignSignal(key, "KASA", ThreatSignal{
		Subject: baseGrant().AgentID, Level: ThreatLow, AnomalyScore: 0.1,
	}, time.Now())

	tampered := bytes.Replace(body, []byte(`"low"`), []byte(`"critical"`), 1)
	if bytes.Equal(tampered, body) {
		t.Fatal("test setup: body was not modified")
	}
	w := post(t, intake, tampered, sigHex)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("escalation-by-tampering must be rejected, got %d", w.Code)
	}
	if in.Sessions.Posture(baseGrant().AgentID) != PostureNormal {
		t.Fatal("CRITICAL: tampered severity was applied")
	}
}

// ── Replay protection ────────────────────────────────────────────────────────

func TestIntakeRejectsStaleSignal(t *testing.T) {
	intake, in, key := intakeFixture(t)
	body, sigHex, _ := SignSignal(key, "KASA", ThreatSignal{
		Subject: baseGrant().AgentID, Level: ThreatCritical, AnomalyScore: 1.0, Corroborated: true,
	}, time.Now().Add(-30*time.Minute)) // stale

	w := post(t, intake, body, sigHex)
	if w.Code != http.StatusRequestTimeout {
		t.Fatalf("stale signal must be refused, got %d", w.Code)
	}
	if in.Sessions.Posture(baseGrant().AgentID) != PostureNormal {
		t.Fatal("CRITICAL: a replayed signal imposed containment")
	}
}

// ── Attribution cannot be forged ─────────────────────────────────────────────

// A hunter must not be able to attribute its finding to a different reporter to
// borrow that reporter's higher authority.
func TestIntakeUsesAuthenticatedReporterNotBodyClaim(t *testing.T) {
	_, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(baseGrant()), sink)
	lowKey := []byte("low-authority-key")
	intake := &SignalIntake{
		In: in,
		Keys: func(reporter string) ([]byte, Authority, bool) {
			switch reporter {
			case "LowTrustHunter":
				// Capped at elevated only.
				return lowKey, Authority{AutonomousCeiling: PostureElevated, CorroboratedCeiling: PostureElevated}, true
			case "KASA":
				return []byte("kasa-key"), Authority{}, true
			}
			return nil, Authority{}, false
		},
	}

	// LowTrustHunter signs, but claims to BE KASA inside the signal body.
	body, sigHex, _ := SignSignal(lowKey, "LowTrustHunter", ThreatSignal{
		Subject: baseGrant().AgentID, Reporter: "KASA", // forged attribution
		Level: ThreatCritical, AnomalyScore: 1.0, Corroborated: true,
	}, time.Now())

	w := post(t, intake, body, sigHex)
	if w.Code != http.StatusOK {
		t.Fatalf("valid low-trust signal should be accepted, got %d: %s", w.Code, w.Body.String())
	}
	var c Containment
	_ = json.Unmarshal(w.Body.Bytes(), &c)

	if c.Reporter != "LowTrustHunter" {
		t.Fatalf("attribution must come from the authenticated envelope, got %q", c.Reporter)
	}
	// It must get LowTrustHunter's ceiling, not KASA's.
	if c.PostureOut != PostureElevated {
		t.Fatalf("forged attribution must not borrow higher authority; got %s", c.PostureOut)
	}
	if !c.Capped {
		t.Fatal("the cap should be recorded")
	}
}

func TestIntakeRequiresSubject(t *testing.T) {
	intake, _, key := intakeFixture(t)
	body, sigHex, _ := SignSignal(key, "KASA", ThreatSignal{Level: ThreatHigh}, time.Now())
	w := post(t, intake, body, sigHex)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("a signal with no subject must be rejected, got %d", w.Code)
	}
}

func TestIntakeRejectsNonPost(t *testing.T) {
	intake, _, _ := intakeFixture(t)
	r := httptest.NewRequest(http.MethodGet, "/threat-signal", nil)
	w := httptest.NewRecorder()
	intake.ServeHTTP(w, r)
	if w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("GET must be rejected, got %d", w.Code)
	}
}
