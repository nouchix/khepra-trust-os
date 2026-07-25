package quantum

import (
	"context"
	"errors"
	"testing"
)

// fakeValidator lets tests drive verified / unverified / error paths.
type fakeValidator struct {
	fw       string
	verified bool
	err      error
}

func (f fakeValidator) Framework() string { return f.fw }
func (f fakeValidator) Validate(_ context.Context, _ QuantumContext) (Verdict, error) {
	if f.err != nil {
		return Verdict{}, f.err
	}
	return Verdict{Verified: f.verified, Backend: f.fw, Reason: "test"}, nil
}

func sampleCtx() QuantumContext {
	return QuantumContext{
		Framework:     "pasqal-qek",
		BackendTarget: "pasqal-neutral-atom-qpu",
		CircuitHash:   "abc123",
		VibeProfiles:  []string{"b", "a"},
	}
}

func TestContextHashIsDeterministicAndOrderIndependent(t *testing.T) {
	a := sampleCtx()
	b := sampleCtx()
	b.VibeProfiles = []string{"a", "b"} // different order, same set
	if a.Hash() != b.Hash() {
		t.Fatalf("hash should be order-independent: %s != %s", a.Hash(), b.Hash())
	}
	c := sampleCtx()
	c.CircuitHash = "different"
	if a.Hash() == c.Hash() {
		t.Fatal("hash must change when a governed field changes")
	}
}

func TestFailClosedWhenNoBackendAttached(t *testing.T) {
	g := NewGate(nil, FailClosed) // empty registry → unattached
	att, err := g.Evaluate(context.Background(), sampleCtx())
	if err != nil {
		t.Fatal(err)
	}
	if att.Decision != "deny" {
		t.Fatalf("no backend under fail-closed must deny, got %q", att.Decision)
	}
	if att.Verdict.Verified {
		t.Fatal("unattached must never report verified")
	}
	if att.Verdict.Backend != "unattached" {
		t.Fatalf("expected unattached backend, got %q", att.Verdict.Backend)
	}
}

func TestAllowUnverifiedProceedsButRecordsUnverified(t *testing.T) {
	g := NewGate(nil, AllowUnverified)
	att, err := g.Evaluate(context.Background(), sampleCtx())
	if err != nil {
		t.Fatal(err)
	}
	if att.Decision != "allow" {
		t.Fatalf("allow_unverified should allow, got %q", att.Decision)
	}
	if att.Verdict.Verified {
		t.Fatal("record must still show verified=false — the point is honesty")
	}
	if att.Policy != "allow_unverified" {
		t.Fatalf("policy not recorded, got %q", att.Policy)
	}
}

func TestVerifiedBackendAllows(t *testing.T) {
	reg := NewRegistry()
	reg.Register(fakeValidator{fw: "pasqal-qek", verified: true})
	g := NewGate(reg, FailClosed)
	att, err := g.Evaluate(context.Background(), sampleCtx())
	if err != nil {
		t.Fatal(err)
	}
	if att.Decision != "allow" || !att.Verdict.Verified {
		t.Fatalf("verified backend must allow, got decision=%q verified=%v", att.Decision, att.Verdict.Verified)
	}
	if att.ContextHash == "" {
		t.Fatal("attestation must carry the context hash")
	}
}

func TestBackendErrorIsDeny(t *testing.T) {
	reg := NewRegistry()
	reg.Register(fakeValidator{fw: "pasqal-qek", err: errors.New("qpu offline")})
	g := NewGate(reg, FailClosed)
	att, err := g.Evaluate(context.Background(), sampleCtx())
	if err != nil {
		t.Fatal(err)
	}
	if att.Decision != "deny" {
		t.Fatalf("backend error must deny (not pass), got %q", att.Decision)
	}
}

func TestEmptyFrameworkRejected(t *testing.T) {
	g := NewGate(nil, AllowUnverified)
	if _, err := g.Evaluate(context.Background(), QuantumContext{}); err == nil {
		t.Fatal("a context with no framework must error")
	}
}
