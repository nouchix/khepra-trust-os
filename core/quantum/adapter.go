package quantum

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// RemoteValidator is the reference backend adapter: it delegates validation to
// an out-of-process quantum backend over HTTP+JSON. Real adapters for NVIDIA
// Ising-decoding (NIM), the Quantum-Calibration agent, a CUDA-Q / ProjectQ
// runner, or a Pasqal QEK service implement this same request/response contract
// (or a gRPC equivalent) — KHEPRA never performs the physics itself.
//
// Wire contract:
//
//	POST {Endpoint}
//	  request  body: QuantumContext (JSON)
//	  response body: Verdict (JSON), HTTP 200
//	  non-200, transport error, or malformed body → error (the Gate treats a
//	  backend error as a DENY, never a pass).
type RemoteValidator struct {
	Fw       string        // framework this adapter answers for
	Endpoint string        // backend URL
	Client   *http.Client  // optional; a sane default is used if nil
	Timeout  time.Duration // optional per-call timeout; default 10s
}

func (r RemoteValidator) Framework() string { return r.Fw }

func (r RemoteValidator) Validate(ctx context.Context, qc QuantumContext) (Verdict, error) {
	body, err := json.Marshal(qc)
	if err != nil {
		return Verdict{}, fmt.Errorf("remote-validator: marshal context: %w", err)
	}

	timeout := r.Timeout
	if timeout <= 0 {
		timeout = 10 * time.Second
	}
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, r.Endpoint, bytes.NewReader(body))
	if err != nil {
		return Verdict{}, fmt.Errorf("remote-validator: build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	client := r.Client
	if client == nil {
		client = &http.Client{Timeout: timeout}
	}
	resp, err := client.Do(req)
	if err != nil {
		return Verdict{}, fmt.Errorf("remote-validator: backend %q unreachable: %w", r.Endpoint, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return Verdict{}, fmt.Errorf("remote-validator: backend %q returned %d", r.Endpoint, resp.StatusCode)
	}

	var v Verdict
	if err := json.NewDecoder(resp.Body).Decode(&v); err != nil {
		return Verdict{}, fmt.Errorf("remote-validator: decode verdict: %w", err)
	}
	if v.Backend == "" {
		v.Backend = r.Fw
	}
	return v, nil
}
