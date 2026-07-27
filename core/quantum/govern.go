package quantum

import "context"

// GuardChange is the exact integration point the ASAF System Daemon calls inside
// Execute(), AFTER the classical gates (ML-DSA signature, deny-by-default ops
// catalog, four-symbol authorization, container staging, human approval) and
// BEFORE privileged execution. It is purely additive: a classical change with no
// quantum context is unaffected.
//
// Contract for the caller:
//   - qp == nil  → the change touches no quantum-classical state; allow is true
//     and att is nil (nothing to attest for the quantum plane).
//   - qp != nil  → the gate is evaluated; att is ALWAYS returned and MUST be
//     committed to the DAG (a denial is evidence too), and the caller proceeds
//     only when allow is true.
//
// Reference daemon wiring (giza-cyber-shield/pkg/asaf/daemon/daemon.go, Execute):
//
//	// ── 7. QUANTUM-CLASSICAL GOVERNANCE GATE (additive) ──
//	att, allow := quantumGate.GuardChange(ctx, req.QuantumProfile)
//	if att != nil {
//	    if _, err := d.commitQuantumAttestation(req, att); err != nil {
//	        return &ChangeResult{Error: "quantum attestation failed (fail-closed): " + err.Error()}
//	    }
//	}
//	if !allow {
//	    return &ChangeResult{QuantumValid: false, Error: "quantum gate denied: " + att.Verdict.Reason}
//	}
//	// … proceed to privileged execution; link att.ContextHash on the execution node …
//
// #CONTROL: AC-3 AC-4 — deny-by-default governance of quantum-classical actuation.
func (g *Gate) GuardChange(ctx context.Context, qp *QuantumContext) (att *Attestation, allow bool) {
	if qp == nil {
		return nil, true // classical-only change; quantum gate is a no-op
	}
	a, err := g.Evaluate(ctx, *qp)
	if err != nil {
		// A malformed context (e.g. empty framework) is not executable: deny,
		// and hand back a minimal attestation so the caller can still record it.
		return &Attestation{
			ContextHash: qp.Hash(),
			Framework:   qp.Framework,
			Verdict:     Verdict{Verified: false, Backend: "gate", Reason: "invalid quantum context: " + err.Error()},
			Policy:      g.policy.String(),
			Decision:    "deny",
		}, false
	}
	return &a, a.Decision == "allow"
}
