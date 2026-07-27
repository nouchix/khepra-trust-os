package enforce

import "testing"

func baseGrant() Grant {
	return Grant{
		AgentID:         "did:khepra:agent1",
		Tools:           []string{"read_kb", "query_api", "write_report"},
		Capabilities:    []string{"read", "write"},
		EgressAllowlist: []string{"api.internal.corp", "*.approved-vendor.com"},
		MaxSensitivity:  "internal",
	}
}

func readReq() ActionRequest {
	return ActionRequest{
		AgentID: "did:khepra:agent1", Tool: "read_kb", Capability: "read",
		Target: "kb://policies", Sensitivity: "internal",
	}
}

func TestAllowsGrantedAction(t *testing.T) {
	e := &Engine{Interposer: ViaMCPGateway}
	r := e.Decide(readReq(), baseGrant(), PostureNormal, Signals{})
	if r.Decision != Allow {
		t.Fatalf("granted action should allow, got %s: %s", r.Decision, r.Rationale)
	}
	if !r.Enforceable || r.EnforcedBy != string(ViaMCPGateway) {
		t.Fatal("with an interposer set, the ruling must be marked enforceable and name the PEP")
	}
}

// The honesty property: with no interposition, a Deny is still a Deny decision but
// must NOT claim to be enforceable.
func TestAdvisoryWhenNotInPath(t *testing.T) {
	e := &Engine{} // no interposer
	req := readReq()
	req.Tool = "exfiltrate"
	r := e.Decide(req, baseGrant(), PostureNormal, Signals{})
	if r.Decision != Deny {
		t.Fatalf("ungranted tool must be denied, got %s", r.Decision)
	}
	if r.Enforceable {
		t.Fatal("without a PEP in path the ruling must be marked advisory, not enforceable")
	}
}

func TestDenyByDefaultUngrantedTool(t *testing.T) {
	e := &Engine{Interposer: ViaMCPGateway}
	req := readReq()
	req.Tool = "delete_everything"
	r := e.Decide(req, baseGrant(), PostureNormal, Signals{})
	if r.Decision != Deny || !contains(r.Rules, RuleToolNotGranted) {
		t.Fatalf("expected deny/tool-not-granted, got %s %v", r.Decision, r.Rules)
	}
}

func TestUnknownAgentIsDeniedAndQuarantined(t *testing.T) {
	e := &Engine{Interposer: ViaMCPGateway}
	req := readReq()
	req.AgentID = "did:khepra:imposter"
	r := e.Decide(req, baseGrant(), PostureNormal, Signals{})
	if r.Decision != Deny || !contains(r.Rules, RuleUnknownAgent) {
		t.Fatalf("identity mismatch must deny: %s %v", r.Decision, r.Rules)
	}
	if r.PostureOut != PostureQuarantined {
		t.Fatalf("an identity mismatch should isolate the session, got %s", r.PostureOut)
	}
}

func TestEgressAllowlistBlocksUnapprovedDestination(t *testing.T) {
	e := &Engine{Interposer: ViaMCPGateway}
	req := readReq()
	req.Tool = "query_api"
	req.EgressTo = "attacker.example.com"
	r := e.Decide(req, baseGrant(), PostureNormal, Signals{})
	if r.Decision != Deny || !contains(r.Rules, RuleEgressNotAllowed) {
		t.Fatalf("unapproved egress must deny: %s %v", r.Decision, r.Rules)
	}
}

func TestEgressAllowlistWildcard(t *testing.T) {
	e := &Engine{Interposer: ViaMCPGateway}
	req := readReq()
	req.Tool = "query_api"
	req.EgressTo = "eu.approved-vendor.com"
	r := e.Decide(req, baseGrant(), PostureNormal, Signals{})
	if r.Decision != Allow {
		t.Fatalf("wildcard-allowlisted egress should allow, got %s: %s", r.Decision, r.Rationale)
	}
}

func TestClassificationCeilingEnforced(t *testing.T) {
	e := &Engine{Interposer: ViaMCPGateway}
	req := readReq()
	req.Sensitivity = "regulated" // CUI, but grant caps at internal
	r := e.Decide(req, baseGrant(), PostureNormal, Signals{})
	if r.Decision != Deny || !contains(r.Rules, RuleClassification) {
		t.Fatalf("exceeding the data-class ceiling must deny: %s %v", r.Decision, r.Rules)
	}
}

// ── The scenario that sells the product ──────────────────────────────────────

// Prompt injection → attempted exfiltration → DENIED and QUARANTINED, with
// evidence. This is the case an observability platform can only alert on after
// the fact.
func TestPromptInjectionExfiltrationIsQuarantined(t *testing.T) {
	e := &Engine{Interposer: ViaMCPGateway}
	req := ActionRequest{
		AgentID: "did:khepra:agent1", Tool: "query_api", Capability: "read",
		Target: "company-drive://finance", Sensitivity: "sensitive",
		EgressTo: "paste.attacker.io",
	}
	sig := Signals{InjectionIndicators: []string{"ignore previous instructions", "untrusted document origin"}}

	r := e.Decide(req, baseGrant(), PostureNormal, sig)

	if r.Decision != Quarantine {
		t.Fatalf("injection + egress of sensitive data must quarantine, got %s: %s", r.Decision, r.Rationale)
	}
	if !r.Decision.Blocking() {
		t.Fatal("quarantine must be a blocking decision")
	}
	if r.PostureOut != PostureQuarantined {
		t.Fatalf("session must be isolated, got posture %s", r.PostureOut)
	}
	if !contains(r.Rules, RuleInjection) || !contains(r.Rules, RuleEgressNotAllowed) {
		t.Fatalf("must cite both injection and egress rules, got %v", r.Rules)
	}
	if r.Hash() == "" {
		t.Fatal("ruling must be hashable as evidence")
	}
}

// ── Adaptive containment ─────────────────────────────────────────────────────

func TestQuarantinedAgentCannotAct(t *testing.T) {
	e := &Engine{Interposer: ViaMCPGateway}
	r := e.Decide(readReq(), baseGrant(), PostureQuarantined, Signals{})
	if r.Decision != Deny {
		t.Fatalf("a quarantined agent must not even read, got %s", r.Decision)
	}
	if !contains(r.Rules, RulePostureRestricted) {
		t.Fatalf("must cite the containment rule, got %v", r.Rules)
	}
}

func TestRestrictedPostureIsReadOnly(t *testing.T) {
	e := &Engine{Interposer: ViaMCPGateway}

	// Read still flows.
	if r := e.Decide(readReq(), baseGrant(), PostureRestricted, Signals{}); r.Decision != Allow {
		t.Fatalf("restricted should still permit reads, got %s: %s", r.Decision, r.Rationale)
	}
	// Write does not.
	w := readReq()
	w.Tool, w.Capability, w.StateChanging = "write_report", "write", true
	if r := e.Decide(w, baseGrant(), PostureRestricted, Signals{}); r.Decision != Deny {
		t.Fatalf("restricted must block writes, got %s", r.Decision)
	}
}

func TestElevatedPostureGatesStateChangeOnApproval(t *testing.T) {
	e := &Engine{Interposer: ViaMCPGateway}
	w := readReq()
	w.Tool, w.Capability, w.StateChanging = "write_report", "write", true
	r := e.Decide(w, baseGrant(), PostureElevated, Signals{})
	if r.Decision != RequireApproval {
		t.Fatalf("elevated posture should require approval for writes, got %s", r.Decision)
	}
	if !r.Decision.Blocking() {
		t.Fatal("require_approval must block until a human acts")
	}
}

func TestBehavioralDriftEscalatesPosture(t *testing.T) {
	e := &Engine{Interposer: ViaMCPGateway}
	sig := Signals{ToolCallsPerMin: 400, BaselinePerMin: 10} // 40x baseline
	r := e.Decide(readReq(), baseGrant(), PostureNormal, sig)
	if r.PostureOut != PostureElevated {
		t.Fatalf("drift should escalate containment to elevated, got %s", r.PostureOut)
	}
	if !contains(r.Rules, RuleDriftRate) {
		t.Fatalf("must cite drift, got %v", r.Rules)
	}
}

func TestRepeatViolationsReduceAuthority(t *testing.T) {
	e := &Engine{Interposer: ViaMCPGateway}
	sig := Signals{PriorViolations: 4}
	r := e.Decide(readReq(), baseGrant(), PostureNormal, sig)
	if r.PostureOut != PostureRestricted {
		t.Fatalf("repeat violations should ratchet to restricted, got %s", r.PostureOut)
	}
}

func TestDenialItselfEscalatesPosture(t *testing.T) {
	e := &Engine{Interposer: ViaMCPGateway}
	req := readReq()
	req.Tool = "not_granted"
	r := e.Decide(req, baseGrant(), PostureNormal, Signals{})
	if r.PostureOut != PostureElevated {
		t.Fatalf("a denial should tighten the agent for the next request, got %s", r.PostureOut)
	}
}

func TestApprovalForWritesGrantFlag(t *testing.T) {
	e := &Engine{Interposer: ViaASAFDaemon}
	g := baseGrant()
	g.ApprovalForWrites = true
	w := readReq()
	w.Tool, w.Capability, w.StateChanging = "write_report", "write", true
	r := e.Decide(w, g, PostureNormal, Signals{})
	if r.Decision != RequireApproval || !contains(r.Rules, RuleApprovalRequired) {
		t.Fatalf("standing write-approval gate should hold the action: %s %v", r.Decision, r.Rules)
	}
}

// ── Evidence ─────────────────────────────────────────────────────────────────

func TestEvidenceIsDeterministicAndTimestampFree(t *testing.T) {
	e := &Engine{Interposer: ViaMCPGateway}
	a := e.Decide(readReq(), baseGrant(), PostureNormal, Signals{})
	b := e.Decide(readReq(), baseGrant(), PostureNormal, Signals{})
	if a.Hash() != b.Hash() {
		t.Fatal("identical decisions must hash identically (timestamps excluded) so rulings are diffable")
	}
	c := e.Decide(func() ActionRequest { r := readReq(); r.Tool = "nope"; return r }(), baseGrant(), PostureNormal, Signals{})
	if a.Hash() == c.Hash() {
		t.Fatal("different rulings must hash differently")
	}
}

func TestPostureMonotonicity(t *testing.T) {
	// Containment must never loosen as a side effect of evaluation.
	if maxPosture(PostureQuarantined, PostureNormal) != PostureQuarantined {
		t.Fatal("posture escalation must be monotonic")
	}
	if PostureLocked.rank() <= PostureQuarantined.rank() {
		t.Fatal("locked must outrank quarantined")
	}
}
