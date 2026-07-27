package quantum

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRemoteValidatorVerifiedThroughGate(t *testing.T) {
	// A stand-in backend that echoes a verified verdict — the shape a real
	// NVIDIA Ising / Pasqal QEK adapter would return.
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var qc QuantumContext
		_ = json.NewDecoder(r.Body).Decode(&qc)
		_ = json.NewEncoder(w).Encode(Verdict{
			Verified:  true,
			Backend:   "pasqal-qek@test",
			Reason:    "atom register within array bounds",
			Telemetry: map[string]string{"circuit_hash": qc.CircuitHash},
		})
	}))
	defer srv.Close()

	reg := NewRegistry()
	reg.Register(RemoteValidator{Fw: "pasqal-qek", Endpoint: srv.URL})
	g := NewGate(reg, FailClosed)

	att, allow := g.GuardChange(context.Background(), &QuantumContext{Framework: "pasqal-qek", CircuitHash: "xyz"})
	if !allow || att == nil || att.Decision != "allow" || !att.Verdict.Verified {
		t.Fatalf("verified backend should allow: allow=%v att=%+v", allow, att)
	}
	if att.Verdict.Telemetry["circuit_hash"] != "xyz" {
		t.Fatalf("backend telemetry not carried through: %+v", att.Verdict.Telemetry)
	}
}

func TestRemoteValidatorBackendErrorIsDeny(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer srv.Close()

	reg := NewRegistry()
	reg.Register(RemoteValidator{Fw: "cuda-quantum", Endpoint: srv.URL})
	g := NewGate(reg, FailClosed)

	att, allow := g.GuardChange(context.Background(), &QuantumContext{Framework: "cuda-quantum", CircuitHash: "c1"})
	if allow || att.Decision != "deny" {
		t.Fatalf("a 500 from the backend must deny, not pass: allow=%v att=%+v", allow, att)
	}
}

func TestGuardChangeNilIsClassicalNoOp(t *testing.T) {
	g := NewGate(nil, FailClosed)
	att, allow := g.GuardChange(context.Background(), nil)
	if !allow || att != nil {
		t.Fatalf("a classical (nil quantum) change must pass with no attestation: allow=%v att=%v", allow, att)
	}
}
