package enforce

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func sig(level ThreatLevel, score float64, corroborated bool) ThreatSignal {
	return ThreatSignal{
		Subject: baseGrant().AgentID, Reporter: "KASA", Level: level,
		AnomalyScore: score, BehaviorFlags: []string{"entropy spike", "unexpected tool graph"},
		Corroborated: corroborated, Evidence: "forensic-snapshot-abc123",
	}
}

// ── The trigger actually fires: a hunter finding blocks the next action ───────

func TestHunterFindingBecomesEffectiveContainment(t *testing.T) {
	_, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(baseGrant()), sink)
	ctx := context.Background()
	agent := baseGrant().AgentID

	// Baseline: the agent can write.
	w := readReq()
	w.Tool, w.Capability, w.StateChanging = "write_report", "write", true
	if _, err := in.Guard(ctx, w, nil, func(context.Context) error { return nil }); err != nil {
		t.Fatalf("agent should be able to write before containment: %v", err)
	}

	// KASA reports high-confidence tampering.
	c := in.Ingest(ctx, sig(ThreatHigh, 0.92, false), Authority{})
	if c.PostureOut != PostureRestricted {
		t.Fatalf("high threat at 0.92 should restrict to read-only, got %s", c.PostureOut)
	}
	if !c.Effective {
		t.Fatal("with a PEP in path the containment must be marked effective")
	}

	// THE POINT: the write is now actually blocked. Not logged — blocked.
	ran := false
	_, err := in.Guard(ctx, w, nil, func(context.Context) error { ran = true; return nil })
	if ran {
		t.Fatal("CRITICAL: write executed after hunter containment — the trigger did not fire")
	}
	if err == nil {
		t.Fatal("write must be refused after containment")
	}

	// Reads still flow — containment is graduated, not a blunt kill.
	if _, err := in.Guard(ctx, readReq(), nil, func(context.Context) error { return nil }); err != nil {
		t.Fatalf("restricted posture should still allow reads: %v", err)
	}
	_ = agent
}

// The hunter's finding must also close the network path, not just the tool path.
func TestHunterContainmentBlocksEgressAtTransport(t *testing.T) {
	reached := false
	dest := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		reached = true
	}))
	defer dest.Close()

	g := baseGrant()
	g.EgressAllowlist = []string{"127.0.0.1"} // normally permitted
	g.Capabilities = append(g.Capabilities, "network")
	g.Tools = append(g.Tools, "http")

	_, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(g), sink)
	ctx := context.Background()
	client := &http.Client{Transport: &Transport{In: in, AgentID: g.AgentID, Sensitivity: "internal"}}

	// Allowed before containment.
	if resp, err := client.Get(dest.URL); err != nil {
		t.Fatalf("allowlisted egress should work pre-containment: %v", err)
	} else {
		resp.Body.Close()
	}
	if !reached {
		t.Fatal("expected the first request to arrive")
	}

	// KASA reports critical compromise, corroborated → quarantine permitted.
	c := in.Ingest(ctx, sig(ThreatCritical, 0.99, true), Authority{})
	if c.PostureOut != PostureQuarantined {
		t.Fatalf("corroborated critical should quarantine, got %s", c.PostureOut)
	}

	// Even the previously-allowlisted destination is now unreachable.
	reached = false
	if _, err := client.Get(dest.URL); err == nil {
		t.Fatal("egress must fail after quarantine")
	}
	if reached {
		t.Fatal("CRITICAL: destination contacted after quarantine — egress interdiction failed")
	}
}

// ── Rules of engagement: the hunter's authority is capped ────────────────────

func TestUncorroboratedCriticalIsCappedNotQuarantined(t *testing.T) {
	_, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(baseGrant()), sink)

	// Critical, but uncorroborated ML finding: the hunter WANTS quarantine.
	c := in.Ingest(context.Background(), sig(ThreatCritical, 0.99, false), Authority{})

	if c.PostureOut == PostureQuarantined {
		t.Fatal("an uncorroborated ML finding must NOT autonomously quarantine — that is a DoS primitive")
	}
	if c.PostureOut != PostureRestricted {
		t.Fatalf("should apply up to the autonomous ceiling (restricted), got %s", c.PostureOut)
	}
	if !c.Capped || c.WantedMore != PostureQuarantined {
		t.Fatalf("the cap must be recorded with what the hunter wanted: capped=%v wanted=%s", c.Capped, c.WantedMore)
	}
	if c.EscalatedFor == "" {
		t.Fatal("the remainder must be flagged for a human, not silently dropped")
	}
}

func TestCorroborationRaisesAuthority(t *testing.T) {
	_, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(baseGrant()), sink)
	c := in.Ingest(context.Background(), sig(ThreatCritical, 0.99, true), Authority{})
	if c.PostureOut != PostureQuarantined || c.Capped {
		t.Fatalf("a corroborated critical finding should reach quarantine uncapped, got %s capped=%v", c.PostureOut, c.Capped)
	}
}

func TestHunterCanNeverLockAutonomously(t *testing.T) {
	_, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(baseGrant()), sink)
	// Even corroborated + critical tops out at quarantine; Lock (credential
	// invalidation) is always a human decision.
	c := in.Ingest(context.Background(), sig(ThreatCritical, 1.0, true), Authority{})
	if c.PostureOut == PostureLocked {
		t.Fatal("no autonomous path may reach Locked — credential invalidation requires a human")
	}
}

func TestLowThreatDoesNotContain(t *testing.T) {
	_, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(baseGrant()), sink)
	c := in.Ingest(context.Background(), sig(ThreatLow, 0.1, false), Authority{})
	if c.PostureOut != PostureNormal {
		t.Fatalf("a low finding should not contain, got %s", c.PostureOut)
	}
}

func TestHighThreatBelowScoreThresholdOnlyElevates(t *testing.T) {
	_, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(baseGrant()), sink)
	c := in.Ingest(context.Background(), sig(ThreatHigh, 0.4, false), Authority{})
	if c.PostureOut != PostureElevated {
		t.Fatalf("a weak-score high finding should only elevate, got %s", c.PostureOut)
	}
}

func TestContainmentIsMonotonicAcrossFindings(t *testing.T) {
	_, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(baseGrant()), sink)
	ctx := context.Background()

	in.Ingest(ctx, sig(ThreatCritical, 0.99, true), Authority{}) // → quarantined
	// A later benign finding must NOT relax containment.
	c := in.Ingest(ctx, sig(ThreatLow, 0.05, false), Authority{})
	if c.PostureOut != PostureQuarantined {
		t.Fatalf("containment must not loosen on a later low finding, got %s", c.PostureOut)
	}
}

func TestHunterContainmentIsRecordedAsEvidence(t *testing.T) {
	log, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(baseGrant()), sink)
	in.Ingest(context.Background(), sig(ThreatHigh, 0.9, false), Authority{})
	if len(*log) != 1 {
		t.Fatalf("hunter containment must be recorded, got %d records", len(*log))
	}
	r := (*log)[0]
	if r.Tool != "hunter:KASA" {
		t.Fatalf("evidence must attribute the hunter, got %q", r.Tool)
	}
	if r.Hash() == "" {
		t.Fatal("hunter containment evidence must be hashable")
	}
}

// Advisory honesty applies to the hunter too.
func TestHunterContainmentNotEffectiveWithoutInterposition(t *testing.T) {
	_, sink := collector()
	in := NewInterdictor(NoInterposition, grants(baseGrant()), sink)
	c := in.Ingest(context.Background(), sig(ThreatCritical, 0.99, true), Authority{})
	if c.Effective {
		t.Fatal("without a PEP in path, hunter containment must be marked ineffective")
	}
}

// ── The Hunter interface / poll loop ─────────────────────────────────────────

type fakeHunter struct {
	name string
	out  []ThreatSignal
}

func (f *fakeHunter) Name() string { return f.name }
func (f *fakeHunter) Poll(context.Context) ([]ThreatSignal, error) {
	out := f.out
	f.out = nil
	return out, nil
}

func TestRunHunterIngestsAndStops(t *testing.T) {
	_, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(baseGrant()), sink)
	h := &fakeHunter{name: "KASA", out: []ThreatSignal{sig(ThreatHigh, 0.95, false)}}

	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan struct{})
	go func() {
		_ = in.RunHunter(ctx, h, Authority{}, time.Millisecond)
		close(done)
	}()

	// Wait for containment to appear, then stop the loop.
	deadline := time.After(2 * time.Second)
	for in.Sessions.Posture(baseGrant().AgentID) == PostureNormal {
		select {
		case <-deadline:
			cancel()
			t.Fatal("hunter loop did not apply containment")
		default:
			time.Sleep(time.Millisecond)
		}
	}
	cancel()
	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("RunHunter did not stop on context cancellation")
	}
}
