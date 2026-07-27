package enforce

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"
)

// ── The wire: how KASA connects without being imported ───────────────────────
//
// enforce/* imports ONLY the standard library. It does not import KASA, and it
// must not. Three reasons, in order of severity:
//
//  1. THE PEP MUST NOT DEPEND ON WHAT IT POLICES. KASA is an LLM-driven
//     autonomous loop; it is exactly the kind of component that can be
//     compromised (prompt injection). Linking it into the enforcement plane would
//     place untrusted, LLM-steered code inside the trust boundary of the control
//     that is supposed to contain it. KASA must be an untrusted INPUT.
//
//  2. MODULE + IP BOUNDARY. KASA lives in github.com/nouchix/PQC-Khepra-MCP
//     (public); this is github.com/nouchix/khepra-trust-os/core (private).
//     core/README.md rule 4 forbids core depending on the public repo, and
//     ARCH-013 forbids the public repo importing private core. Neither direction
//     of import is legal.
//
//  3. DEPENDENCY WEIGHT. Importing KASA pulls ~13 packages (llm, intel, arsenal,
//     scanner, vuln, forensics, ir, compliance, …) into a security-critical
//     component's SBOM and attack surface, and would break this module's ability
//     to build and test offline.
//
// So the connection is a PROTOCOL, not a link:
//
//	KASA (any repo, any language, any host)
//	   │  POST /threat-signal   {ThreatSignal JSON}  + HMAC-SHA256 signature
//	   ▼
//	SignalIntake ── authenticates the hunter ──► Interdictor.Ingest(signal, authority)
//	   │                                              │
//	   │                                              ▼
//	   └──◄── Containment JSON ───────────  posture persisted; Guard() and
//	                                        Transport enforce it from here on
//
// AUTHENTICATION IS NOT OPTIONAL HERE. An unauthenticated intake IS the
// denial-of-service primitive this design exists to prevent: anyone who can POST
// could quarantine an entire fleet. Every signal is HMAC-authenticated against a
// per-hunter key, compared in constant time, with a freshness bound to stop replay.
//
// #CONTROL: IA-9 (service identification/authentication) — hunters are authenticated.
// #CONTROL: SC-8 — signal integrity via HMAC over the exact body.
// #CONTROL: AC-6 — an authenticated hunter still only gets its capped Authority.

// HunterKeyring resolves a hunter's shared signing key. Returning false denies the
// signal — an unknown reporter has no authority whatsoever.
type HunterKeyring func(reporter string) (key []byte, authority Authority, ok bool)

// SignalIntake is the HTTP endpoint hunters post findings to. It is the only
// coupling between an autonomous detector and the enforcement plane.
type SignalIntake struct {
	In   *Interdictor
	Keys HunterKeyring
	// MaxSkew bounds how old a signal may be, to prevent replay of a stale
	// "critical" finding. Default 5 minutes.
	MaxSkew time.Duration
	// MaxBody caps the request body. Default 64 KiB.
	MaxBody int64
}

// signalEnvelope is the wire format: the reporter and timestamp are outside the
// signed payload's semantics but inside the signed BYTES, so neither can be
// swapped without invalidating the signature.
type signalEnvelope struct {
	Reporter string       `json:"reporter"`
	SentAt   time.Time    `json:"sent_at"`
	Signal   ThreatSignal `json:"signal"`
}

// ServeHTTP accepts one authenticated threat signal and applies containment.
//
// Contract:
//
//	POST  body: signalEnvelope JSON
//	      header: X-KHEPRA-Signature: hex(HMAC-SHA256(key, rawBody))
//	200 → Containment JSON (what was actually applied, including any cap)
//	401 → unknown reporter or bad signature
//	408 → signal too old (replay protection)
//	400 → malformed
func (s *SignalIntake) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	maxBody := s.MaxBody
	if maxBody <= 0 {
		maxBody = 64 << 10
	}
	raw, err := io.ReadAll(io.LimitReader(r.Body, maxBody))
	if err != nil {
		http.Error(w, "cannot read body", http.StatusBadRequest)
		return
	}

	var env signalEnvelope
	if err := json.Unmarshal(raw, &env); err != nil {
		http.Error(w, "malformed signal", http.StatusBadRequest)
		return
	}
	reporter := strings.TrimSpace(env.Reporter)
	if reporter == "" {
		http.Error(w, "reporter required", http.StatusUnauthorized)
		return
	}
	if s.Keys == nil {
		// Fail closed: with no keyring configured, nothing may impose containment.
		http.Error(w, "intake not configured with a keyring", http.StatusUnauthorized)
		return
	}
	key, authority, ok := s.Keys(reporter)
	if !ok || len(key) == 0 {
		http.Error(w, "unknown reporter", http.StatusUnauthorized)
		return
	}

	// Authenticate over the EXACT bytes received.
	mac := hmac.New(sha256.New, key)
	mac.Write(raw)
	want := mac.Sum(nil)
	got, decErr := hex.DecodeString(r.Header.Get("X-KHEPRA-Signature"))
	if decErr != nil || !hmac.Equal(want, got) {
		http.Error(w, "signature verification failed", http.StatusUnauthorized)
		return
	}

	// Freshness: a replayed "critical" finding must not re-quarantine later.
	skew := s.MaxSkew
	if skew <= 0 {
		skew = 5 * time.Minute
	}
	if env.SentAt.IsZero() {
		http.Error(w, "sent_at required", http.StatusBadRequest)
		return
	}
	age := time.Since(env.SentAt)
	if age > skew || age < -skew {
		http.Error(w, "signal outside freshness window", http.StatusRequestTimeout)
		return
	}

	sig := env.Signal
	// The reporter is taken from the AUTHENTICATED envelope, never from the
	// signal body — a hunter cannot attribute a finding to someone else.
	sig.Reporter = reporter
	if sig.Subject == "" {
		http.Error(w, "signal subject required", http.StatusBadRequest)
		return
	}

	containment := s.In.Ingest(r.Context(), sig, authority)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(containment)
}

// SignSignal is the client-side helper a hunter uses to post a finding. It is
// exported so KASA (or any detector, in any repo) can construct a valid request
// without depending on the internals of this package beyond these types.
func SignSignal(key []byte, reporter string, sig ThreatSignal, sentAt time.Time) (body []byte, signature string, err error) {
	env := signalEnvelope{Reporter: reporter, SentAt: sentAt, Signal: sig}
	body, err = json.Marshal(env)
	if err != nil {
		return nil, "", err
	}
	mac := hmac.New(sha256.New, key)
	mac.Write(body)
	return body, hex.EncodeToString(mac.Sum(nil)), nil
}
