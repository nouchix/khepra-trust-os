package enforce

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func grants(g Grant) func(string) (Grant, bool) {
	return func(id string) (Grant, bool) {
		if id == g.AgentID {
			return g, true
		}
		return Grant{}, false
	}
}

func collector() (*[]Ruling, EvidenceSink) {
	var got []Ruling
	return &got, SinkFunc(func(_ context.Context, r Ruling) error {
		got = append(got, r)
		return nil
	})
}

// ── The core property: a Deny means the action never runs ────────────────────

func TestGuardRunsActionWhenPermitted(t *testing.T) {
	log, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(baseGrant()), sink)

	ran := false
	r, err := in.Guard(context.Background(), readReq(), nil, func(context.Context) error {
		ran = true
		return nil
	})
	if err != nil {
		t.Fatalf("permitted action should not error: %v", err)
	}
	if !ran {
		t.Fatal("permitted action must actually execute")
	}
	if r.Decision != Allow {
		t.Fatalf("expected allow, got %s", r.Decision)
	}
	if len(*log) != 1 {
		t.Fatalf("every ruling must be recorded, got %d", len(*log))
	}
}

// This is the whole point of the package: the action closure is never invoked.
func TestGuardNeverInvokesActionWhenDenied(t *testing.T) {
	_, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(baseGrant()), sink)

	req := readReq()
	req.Tool = "delete_production" // not granted

	ran := false
	_, err := in.Guard(context.Background(), req, nil, func(context.Context) error {
		ran = true
		return nil
	})
	if ran {
		t.Fatal("CRITICAL: a denied action was executed — interdiction failed")
	}
	if err == nil {
		t.Fatal("denied action must return an error")
	}
	ruling, ok := Interdicted(err)
	if !ok {
		t.Fatalf("error must be recognizable as interdiction, got %T", err)
	}
	if !contains(ruling.Rules, RuleToolNotGranted) {
		t.Fatalf("ruling should cite the rule, got %v", ruling.Rules)
	}
}

func TestUngrantedAgentIsDenied(t *testing.T) {
	_, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(baseGrant()), sink)

	req := readReq()
	req.AgentID = "did:khepra:unknown"

	ran := false
	_, err := in.Guard(context.Background(), req, nil, func(context.Context) error { ran = true; return nil })
	if ran || err == nil {
		t.Fatal("an agent with no resolvable grant must be denied")
	}
}

// ── Containment persists across calls ────────────────────────────────────────

func TestQuarantinePersistsAndBlocksSubsequentCalls(t *testing.T) {
	_, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(baseGrant()), sink)
	ctx := context.Background()
	agent := baseGrant().AgentID

	// Trigger the exfiltration pattern → quarantine.
	exfil := ActionRequest{
		AgentID: agent, Tool: "query_api", Capability: "read",
		Target: "drive://finance", Sensitivity: "sensitive", EgressTo: "paste.attacker.io",
	}
	r, err := in.Guard(ctx, exfil, []string{"ignore previous instructions"}, func(context.Context) error {
		t.Fatal("exfiltration must never execute")
		return nil
	})
	if err == nil || r.Decision != Quarantine {
		t.Fatalf("expected quarantine, got %s err=%v", r.Decision, err)
	}
	if got := in.Sessions.Posture(agent); got != PostureQuarantined {
		t.Fatalf("containment must persist in session state, got %s", got)
	}

	// A later, entirely benign call must now also be blocked — containment is durable.
	ran := false
	_, err = in.Guard(ctx, readReq(), nil, func(context.Context) error { ran = true; return nil })
	if ran {
		t.Fatal("a quarantined agent executed a later action — containment did not persist")
	}
	if err == nil {
		t.Fatal("post-quarantine call must be refused")
	}

	// Operator reinstatement is explicit, and restores authority.
	in.Sessions.Reinstate(agent)
	if got := in.Sessions.Posture(agent); got != PostureNormal {
		t.Fatalf("reinstate should restore normal posture, got %s", got)
	}
	ran = false
	if _, err := in.Guard(ctx, readReq(), nil, func(context.Context) error { ran = true; return nil }); err != nil {
		t.Fatalf("after reinstatement the agent should work: %v", err)
	}
	if !ran {
		t.Fatal("after reinstatement the action should execute")
	}
}

// ── Egress interdiction: exfiltration physically fails ───────────────────────

func TestTransportBlocksUnallowlistedEgress(t *testing.T) {
	// A stand-in attacker endpoint that records whether it was ever reached.
	reached := false
	attacker := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		reached = true
		w.WriteHeader(http.StatusOK)
	}))
	defer attacker.Close()

	_, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(baseGrant()), sink)

	client := &http.Client{Transport: &Transport{
		In: in, AgentID: baseGrant().AgentID, Sensitivity: "internal",
		Injection: []string{"ignore previous instructions"},
	}}

	_, err := client.Get(attacker.URL) // 127.0.0.1 is not on the allowlist
	if err == nil {
		t.Fatal("exfiltration request should have failed")
	}
	if reached {
		t.Fatal("CRITICAL: the attacker endpoint was contacted — egress interdiction failed")
	}
	// The failure must be policy interdiction, not an incidental network error.
	if _, ok := Interdicted(errors.Unwrap(err)); !ok {
		if _, ok2 := Interdicted(err); !ok2 {
			t.Fatalf("failure should be an interdiction, got %v", err)
		}
	}
}

func TestTransportAllowsAllowlistedEgress(t *testing.T) {
	ok := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))
	defer ok.Close()

	g := baseGrant()
	// Allowlist the loopback host the test server runs on.
	g.EgressAllowlist = []string{"127.0.0.1"}
	g.Capabilities = append(g.Capabilities, "network")
	g.Tools = append(g.Tools, "http")

	_, sink := collector()
	in := NewInterdictor(ViaMCPGateway, grants(g), sink)

	client := &http.Client{Transport: &Transport{In: in, AgentID: g.AgentID, Sensitivity: "internal"}}
	resp, err := client.Get(ok.URL)
	if err != nil {
		t.Fatalf("allowlisted egress should succeed: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("unexpected status %d", resp.StatusCode)
	}
}

// ── Approval: hold, then release under a named approver ──────────────────────

func TestApprovalHoldsThenReleasesWithApproverIdentity(t *testing.T) {
	log, sink := collector()
	g := baseGrant()
	g.ApprovalForWrites = true
	in := NewInterdictor(ViaASAFDaemon, grants(g), sink)
	ctx := context.Background()

	w := readReq()
	w.Tool, w.Capability, w.StateChanging = "write_report", "write", true

	ran := false
	_, err := in.Guard(ctx, w, nil, func(context.Context) error { ran = true; return nil })
	if err == nil {
		t.Fatal("write should be held pending approval")
	}
	if ran {
		t.Fatal("held action must not execute before approval")
	}

	pend := in.Approvals.Pending()
	if len(pend) != 1 {
		t.Fatalf("action should be queued, not dropped; got %d pending", len(pend))
	}

	// Approval requires an identity.
	if _, err := in.Approvals.Approve(ctx, pend[0].Ruling.Hash(), "", sink); err == nil {
		t.Fatal("approval without an approver identity must be rejected")
	}

	r, err := in.Approvals.Approve(ctx, pend[0].Ruling.Hash(), "alice@groff", sink)
	if err != nil {
		t.Fatalf("approve: %v", err)
	}
	if !ran {
		t.Fatal("approved action must execute on release")
	}
	if r.Decision != Allow {
		t.Fatalf("released ruling should be allow, got %s", r.Decision)
	}
	// The approver must appear in the evidence — the human-in-the-loop is attested.
	found := false
	for _, x := range *log {
		if x.Decision == Allow && contains([]string{x.Rationale}, x.Rationale) &&
			len(x.Rationale) > 0 && containsSubstr(x.Rationale, "alice@groff") {
			found = true
		}
	}
	if !found {
		t.Fatal("approver identity must be recorded in the evidence")
	}
}

func TestApprovalRefusalDiscardsAction(t *testing.T) {
	_, sink := collector()
	g := baseGrant()
	g.ApprovalForWrites = true
	in := NewInterdictor(ViaASAFDaemon, grants(g), sink)
	ctx := context.Background()

	w := readReq()
	w.Tool, w.Capability, w.StateChanging = "write_report", "write", true
	ran := false
	_, _ = in.Guard(ctx, w, nil, func(context.Context) error { ran = true; return nil })

	pend := in.Approvals.Pending()
	r, err := in.Approvals.Refuse(ctx, pend[0].Ruling.Hash(), "bob@groff", sink)
	if err != nil {
		t.Fatal(err)
	}
	if r.Decision != Deny {
		t.Fatalf("refusal should deny, got %s", r.Decision)
	}
	if ran {
		t.Fatal("refused action must never execute")
	}
	if len(in.Approvals.Pending()) != 0 {
		t.Fatal("refused action should leave the queue")
	}
}

func containsSubstr(s, sub string) bool {
	return len(sub) > 0 && len(s) >= len(sub) && (func() bool {
		for i := 0; i+len(sub) <= len(s); i++ {
			if s[i:i+len(sub)] == sub {
				return true
			}
		}
		return false
	})()
}
