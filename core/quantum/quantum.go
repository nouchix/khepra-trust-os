// Package quantum is the governance-and-attestation seam for quantum-classical
// state changes in the KHEPRA / ASAF control plane.
//
// Design principle (TRL10 — enforced, not asserted): KHEPRA does NOT reimplement
// quantum error correction, device calibration, or circuit physics. It is not an
// Ising decoder and it is not a QPU. It *governs* quantum-classical actuation by
// delegating validation to a real backend adapter (NVIDIA Ising decoding, Pasqal
// QEK, CUDA-Q, ProjectQ, EVOVAQ, …) through the Validator interface, and by
// attesting the answer — verified or not — into the evidence DAG.
//
// Two rules make this honest rather than theater:
//
//  1. If no backend is attached for a request's framework, the request is NOT
//     silently passed. The default validator (Unattached) reports Verified=false
//     with an explicit reason, and the Gate fails closed unless an operator has
//     opted into AllowUnverified — in which case the "unverified" status is
//     recorded in the attestation, not hidden.
//  2. The daemon never inspects syndrome density or calibration signals itself.
//     Those belong to the backend. The daemon records the backend's verdict and
//     the content hash of the exact QuantumContext it governed.
//
// IP: SecRed Knowledge Inc. / SOUHIMBOU DOH KONE LLC — USPTO #73565085
package quantum

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"sync"

	"github.com/nouchix/khepra-trust-os/core/adinkra"
)

// QuantumContext is the attested description of a quantum-classical state change.
// Every field is opaque to KHEPRA: the daemon governs and records them, a backend
// interprets them.
type QuantumContext struct {
	Framework        string   `json:"framework"`                   // "cuda-quantum" | "projectq" | "evovaq" | "pasqal-qek"
	BackendTarget    string   `json:"backend_target"`              // e.g. "nvidia-ising-emulator" | "pasqal-neutral-atom-qpu"
	CircuitHash      string   `json:"circuit_hash"`                // content hash of the compiled circuit
	ExpectedSyndrome string   `json:"expected_syndrome,omitempty"` // QEC syndrome bound the backend must assert
	Optimizer        string   `json:"optimizer,omitempty"`         // e.g. EVOVAQ "ParticleSwarm"
	VibeProfiles     []string `json:"vibe_profiles,omitempty"`     // NVIDIA calibration skill profiles the backend checks
}

// #CONTROL: SC-13 — canonical form is deterministic so the attestation hash is
// reproducible from the same logical context (sorted keys, sorted slices).
func (qc QuantumContext) canonical() []byte {
	vibes := append([]string(nil), qc.VibeProfiles...)
	sort.Strings(vibes)
	m := map[string]any{
		"framework":         qc.Framework,
		"backend_target":    qc.BackendTarget,
		"circuit_hash":      qc.CircuitHash,
		"expected_syndrome": qc.ExpectedSyndrome,
		"optimizer":         qc.Optimizer,
		"vibe_profiles":     vibes,
	}
	// json.Marshal of a map sorts keys, giving a stable encoding.
	b, _ := json.Marshal(m)
	return b
}

// Hash returns the content-addressed identifier of this context, used as the
// attestation anchor in the DAG.
func (qc QuantumContext) Hash() string { return adinkra.Hash(qc.canonical()) }

// Verdict is a backend's answer about a QuantumContext. Telemetry is free-form
// evidence the backend chooses to expose (e.g. measured syndrome density).
type Verdict struct {
	Verified  bool              `json:"verified"`
	Backend   string            `json:"backend"`
	Reason    string            `json:"reason"`
	Telemetry map[string]string `json:"telemetry,omitempty"`
}

// Validator is implemented OUT OF PROCESS by a real quantum backend adapter.
// KHEPRA calls it; it never performs the validation itself. Implementations are
// expected to be network clients (gRPC, NVIDIA NIM, local socket) to the actual
// decoder / calibration agent / QPU control plane.
type Validator interface {
	Framework() string
	Validate(ctx context.Context, qc QuantumContext) (Verdict, error)
}

// Unattached is the honest default validator: it verifies nothing and says so.
// It exists so that a missing backend produces a recorded "unverified" verdict
// rather than an accidental pass.
type Unattached struct{ Fw string }

func (u Unattached) Framework() string { return u.Fw }
func (u Unattached) Validate(_ context.Context, _ QuantumContext) (Verdict, error) {
	return Verdict{
		Verified: false,
		Backend:  "unattached",
		Reason:   "no quantum backend attached for framework " + u.Fw + "; validation not performed",
	}, nil
}

// Registry maps framework name -> Validator adapter.
type Registry struct {
	mu sync.RWMutex
	m  map[string]Validator
}

func NewRegistry() *Registry { return &Registry{m: make(map[string]Validator)} }

// Register adds (or replaces) the adapter for a framework.
func (r *Registry) Register(v Validator) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.m[v.Framework()] = v
}

// Get returns the adapter for a framework, or false if none is registered.
func (r *Registry) Get(framework string) (Validator, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	v, ok := r.m[framework]
	return v, ok
}

// Policy controls what the Gate does when a context cannot be positively verified.
type Policy int

const (
	// FailClosed denies any QuantumContext that a backend did not verify. Default.
	FailClosed Policy = iota
	// AllowUnverified permits an unverified context to proceed, but records the
	// unverified status in the attestation. For dev/emulator use only.
	AllowUnverified
)

func (p Policy) String() string {
	if p == AllowUnverified {
		return "allow_unverified"
	}
	return "fail_closed"
}

// Attestation is the governance record the daemon commits to the DAG for a
// quantum-classical state change. It is produced whether the decision is allow
// or deny — a denial is evidence too.
type Attestation struct {
	ContextHash string  `json:"context_hash"`
	Framework   string  `json:"framework"`
	Verdict     Verdict `json:"verdict"`
	Policy      string  `json:"policy"`
	Decision    string  `json:"decision"` // "allow" | "deny"
}

// Gate is the governance decision point the ASAF daemon calls before executing a
// QuantumContext-bearing ChangeRequest.
type Gate struct {
	reg    *Registry
	policy Policy
}

// NewGate builds a Gate. A nil registry is treated as empty (everything
// unattached), which under the default FailClosed policy denies all quantum
// contexts — the safe posture for a host with no quantum backend.
func NewGate(reg *Registry, policy Policy) *Gate {
	if reg == nil {
		reg = NewRegistry()
	}
	return &Gate{reg: reg, policy: policy}
}

// Evaluate governs one QuantumContext: it resolves the backend adapter (or the
// honest Unattached default), obtains a verdict, applies policy, and returns an
// Attestation the caller MUST record. It fails closed by default.
//
// #CONTROL: AC-3 AC-4 — deny-by-default authorization of quantum-classical
// actuation; unverified contexts are denied unless policy explicitly allows.
func (g *Gate) Evaluate(ctx context.Context, qc QuantumContext) (Attestation, error) {
	if qc.Framework == "" {
		return Attestation{}, fmt.Errorf("quantum: context has no framework")
	}

	v, ok := g.reg.Get(qc.Framework)
	if !ok {
		v = Unattached{Fw: qc.Framework}
	}

	verdict, err := v.Validate(ctx, qc)
	if err != nil {
		// A backend error is not a pass. Record a deny with the error as reason.
		return Attestation{
			ContextHash: qc.Hash(),
			Framework:   qc.Framework,
			Verdict:     Verdict{Verified: false, Backend: v.Framework(), Reason: "backend error: " + err.Error()},
			Policy:      g.policy.String(),
			Decision:    "deny",
		}, nil
	}

	att := Attestation{
		ContextHash: qc.Hash(),
		Framework:   qc.Framework,
		Verdict:     verdict,
		Policy:      g.policy.String(),
	}

	switch {
	case verdict.Verified:
		att.Decision = "allow"
	case g.policy == AllowUnverified:
		att.Decision = "allow" // proceeds, but Verdict.Verified stays false in the record
	default:
		att.Decision = "deny"
	}
	return att, nil
}
