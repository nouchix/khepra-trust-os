// Package democonform verifies that a hosted demo surface actually enforces the
// conditions the sovereignty allowlist claims it enforces.
//
// # WHY THIS EXISTS
//
// ops/guards/sovereignty_allowlist.txt permits two vendor-hosted demo surfaces on
// the data plane, each with written TRL10 conditions:
//
//	mcp.souhimbou.ai      DEMO  "input guard + no-CUI banner + isolated demo DAG"
//	gateway.souhimbou.ai  DEMO  "block real-target/credential submission,
//	                             tier-gate authenticated scans, no-CUI banner"
//
// Guard G-1 checks only that such a surface is *acknowledged* in the allowlist. It
// cannot check that any of those controls exist. So the conditions were prose —
// exactly the thing this project's own TRL10 rule rejects ("a claim needs an
// implemented control plus a CI guard that fails loudly").
//
// That gap became load-bearing when ARCH-014 §6.1 deleted ktos-aiscan's local stub
// simulation and moved demonstrations onto these hosted endpoints. Removing the
// stubs was right — a read-only scanner should not open listening sockets — but it
// shifted the exposure from a customer's laptop to a public endpoint whose
// guarantees nothing tested. This package tests them. Tracked as gap DM-1.
//
// # HONESTY MODEL
//
// Every check returns one of three results, never a bare boolean:
//
//	Pass         — the control was observed working, with evidence recorded.
//	Fail         — the control was observed NOT working. This is a finding.
//	Unverifiable — the endpoint does not expose enough to decide from outside.
//
// Unverifiable is NOT a pass. It is reported separately and counted separately,
// because "we could not tell" and "it works" are different claims. This mirrors
// the confirmed-vs-weak confidence split already used in core/aidiscovery: a
// scanner that reports uncertainty as success is worse than no scanner.
//
// # READ-ONLY AND NON-EXPLOITATIVE
//
// Every probe is a benign GET, or a POST of obviously-synthetic values against our
// OWN endpoints, to confirm they are REJECTED. Nothing here attempts to bypass a
// control, escalate, or exfiltrate. The credential-shaped payloads are deliberate
// non-secrets (see syntheticCredential) so that a probe can never leak a real one
// even by accident.
//
// #CONTROL: CA-2 (assessment) — the demo surface is assessed, not assumed.
// #CONTROL: SC-8 — no-CUI posture of a public surface is verified.
// #CONTROL: AC-3 — tier gating on a public surface is verified.
package democonform

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// Result is the outcome of one condition check.
type Result string

const (
	Pass         Result = "pass"
	Fail         Result = "fail"
	Unverifiable Result = "unverifiable"
)

// Finding is one condition's verdict with the evidence behind it.
type Finding struct {
	// Condition is the allowlist condition being tested, in its own words.
	Condition string `json:"condition"`
	// ID is a stable identifier so CI can reference a specific check.
	ID     string `json:"id"`
	Result Result `json:"result"`
	// Evidence is what was actually observed — the basis for the verdict.
	Evidence string `json:"evidence"`
	// Rationale explains why the observation implies the verdict.
	Rationale string `json:"rationale"`
	// Probe records exactly what was sent, so a finding is reproducible.
	Probe string `json:"probe"`
}

// Report is the full assessment of one demo surface.
type Report struct {
	Target       string    `json:"target"`
	CheckedAt    string    `json:"checked_at"`
	Findings     []Finding `json:"findings"`
	Passed       int       `json:"passed"`
	Failed       int       `json:"failed"`
	Unverifiable int       `json:"unverifiable"`
	// Conformant is true ONLY when every condition passed. An unverifiable
	// condition prevents conformance — silence is not evidence.
	Conformant bool `json:"conformant"`
}

// syntheticCredential is a deliberately fake, well-known-invalid credential shape.
// It exists so the input-guard probe can prove rejection WITHOUT any possibility of
// transmitting a real secret. Never replace this with a live value.
const syntheticCredential = "AKIAIOSFODNN7EXAMPLE" // AWS's own documentation example key

// syntheticRealTarget is an RFC 5737 documentation address. Submitting it proves
// the endpoint refuses real-target scans without ever pointing a scan at a real
// third party.
const syntheticRealTarget = "203.0.113.7"

// Checker probes one demo surface.
type Checker struct {
	// BaseURL of the demo surface, e.g. https://mcp.souhimbou.ai
	BaseURL string
	// Client is the HTTP client. A caller supplies one with a sane timeout.
	Client *http.Client
	// Kind selects which condition set applies. "mcp" or "gateway".
	Kind string
}

func (c *Checker) client() *http.Client {
	if c.Client != nil {
		return c.Client
	}
	return &http.Client{Timeout: 20 * time.Second}
}

// response is one probe's outcome. ContentType matters more than it looks: a
// catch-all "/" route answers any unknown path, so without distinguishing an API
// response from the homepage, a banner containing the words "demo ... only" reads
// as "this endpoint restricts scans to demo targets". That false PASS is exactly
// the failure mode this package exists to prevent, so every API-shaped conclusion
// below requires an API-shaped response.
type response struct {
	Status      int
	ContentType string
	Body        string
}

// isAPI reports whether this response plausibly came from the endpoint we probed
// rather than from a catch-all HTML route.
func (r response) isAPI() bool {
	ct := strings.ToLower(r.ContentType)
	if strings.Contains(ct, "text/html") {
		return false
	}
	if strings.Contains(ct, "json") {
		return true
	}
	// No/unclear content type: accept only if the body actually parses as JSON.
	var v any
	return json.Unmarshal([]byte(strings.TrimSpace(r.Body)), &v) == nil
}

func (c *Checker) do(ctx context.Context, method, path string, payload any) (response, error) {
	var bodyReader io.Reader
	if payload != nil {
		b, err := json.Marshal(payload)
		if err != nil {
			return response{}, err
		}
		bodyReader = strings.NewReader(string(b))
	}
	req, err := http.NewRequestWithContext(ctx, method, strings.TrimRight(c.BaseURL, "/")+path, bodyReader)
	if err != nil {
		return response{}, err
	}
	if payload != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := c.client().Do(req)
	if err != nil {
		return response{}, err
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(io.LimitReader(resp.Body, 256<<10))
	return response{
		Status:      resp.StatusCode,
		ContentType: resp.Header.Get("Content-Type"),
		Body:        string(b),
	}, nil
}

func (c *Checker) get(ctx context.Context, path string) (response, error) {
	return c.do(ctx, http.MethodGet, path, nil)
}

func (c *Checker) postJSON(ctx context.Context, path string, payload any) (response, error) {
	return c.do(ctx, http.MethodPost, path, payload)
}

// refusedStatus reports whether a status code is an unambiguous refusal.
func refusedStatus(s int) bool {
	switch s {
	case http.StatusBadRequest, http.StatusUnauthorized, http.StatusPaymentRequired,
		http.StatusForbidden, http.StatusUnprocessableEntity, http.StatusTooManyRequests:
		return true
	}
	return false
}

// Run executes every condition applicable to the surface Kind.
func (c *Checker) Run(ctx context.Context) Report {
	r := Report{
		Target:    c.BaseURL,
		CheckedAt: time.Now().UTC().Format(time.RFC3339),
	}

	checks := []func(context.Context) Finding{
		c.checkNoCUIBanner,
		c.checkDemoDAGIsolation,
		c.checkCredentialSubmissionRefused,
	}
	if c.Kind == "gateway" {
		checks = append(checks,
			c.checkRealTargetScanRefused,
			c.checkAuthenticatedScanTierGated,
		)
	}

	for _, fn := range checks {
		f := fn(ctx)
		r.Findings = append(r.Findings, f)
		switch f.Result {
		case Pass:
			r.Passed++
		case Fail:
			r.Failed++
		default:
			r.Unverifiable++
		}
	}
	// Unverifiable blocks conformance deliberately: an unproven control is not a
	// control. Reporting it as conformant would reintroduce exactly the
	// prose-as-assurance problem DM-1 exists to close.
	r.Conformant = r.Failed == 0 && r.Unverifiable == 0
	return r
}

// ── Condition 1: the no-CUI banner ───────────────────────────────────────────

var cuiBannerMarkers = []string{
	"no cui", "not for cui", "no controlled unclassified",
	"demo only", "synthetic data only", "do not submit cui",
}

func (c *Checker) checkNoCUIBanner(ctx context.Context) Finding {
	f := Finding{
		ID:        "DM1-BANNER",
		Condition: `allowlist: "no CUI" banner present on the public demo surface`,
		Probe:     "GET /",
	}
	r, err := c.get(ctx, "/")
	if err != nil {
		f.Result = Unverifiable
		f.Evidence = "request failed: " + err.Error()
		f.Rationale = "the surface could not be reached, so the banner cannot be observed"
		return f
	}
	low := strings.ToLower(r.Body)
	for _, m := range cuiBannerMarkers {
		if strings.Contains(low, m) {
			f.Result = Pass
			f.Evidence = fmt.Sprintf("HTTP %d; body contains %q", r.Status, m)
			f.Rationale = "a visitor is told not to submit CUI before interacting"
			return f
		}
	}
	f.Result = Fail
	f.Evidence = fmt.Sprintf("HTTP %d; none of %d no-CUI markers present in %d bytes", r.Status, len(cuiBannerMarkers), len(r.Body))
	f.Rationale = "the allowlist records a no-CUI banner as a condition of hosting this surface; it is absent"
	return f
}

// ── Condition 2: the demo DAG is isolated ────────────────────────────────────

func (c *Checker) checkDemoDAGIsolation(ctx context.Context) Finding {
	f := Finding{
		ID:        "DM1-DAG-ISOLATION",
		Condition: `allowlist: isolated demo DAG (KHEPRA_DAG_SEED_DEMO=true), not the customer chain`,
		Probe:     "GET /health then GET /",
	}
	// Prefer a machine-readable signal. Absent one, this is honestly unverifiable
	// from outside — isolation is never inferred from the absence of evidence.
	//
	// r.isAPI() is load-bearing: a catch-all "/" route answers /health with the
	// homepage, and the homepage's no-CUI banner contains the word "demo". Without
	// this check that banner would be read as a demo-DAG declaration.
	for _, p := range []string{"/health", "/mcp/v1/health", "/api/health"} {
		r, err := c.get(ctx, p)
		if err != nil || r.Status >= 400 || !r.isAPI() {
			continue
		}
		low := strings.ToLower(r.Body)
		if strings.Contains(low, "demo") || strings.Contains(low, "seed") {
			f.Result = Pass
			f.Evidence = fmt.Sprintf("GET %s HTTP %d (%s); response advertises demo-mode DAG", p, r.Status, r.ContentType)
			f.Rationale = "the surface self-reports demo seeding, so the chain is not a customer chain"
			f.Probe = "GET " + p
			return f
		}
		f.Result = Unverifiable
		f.Evidence = fmt.Sprintf("GET %s HTTP %d; health response present but declares no DAG mode", p, r.Status)
		f.Rationale = "isolation cannot be confirmed from outside; the endpoint should expose an explicit demo-mode field"
		f.Probe = "GET " + p
		return f
	}
	f.Result = Unverifiable
	f.Evidence = "no health endpoint returned an API response"
	f.Rationale = "DAG isolation is not externally observable; add an explicit demo-mode field to a health response to make this checkable"
	return f
}

// ── Condition 3: credential submission is refused ────────────────────────────

func (c *Checker) checkCredentialSubmissionRefused(ctx context.Context) Finding {
	f := Finding{
		ID:        "DM1-INPUT-GUARD",
		Condition: `allowlist: input guard blocks credential submission on the demo surface`,
		Probe:     "POST synthetic non-secret credential (AWS documentation example key)",
	}
	payload := map[string]any{
		"target":     "example.invalid",
		"credential": syntheticCredential,
		"api_key":    syntheticCredential,
		"note":       "DM-1 conformance probe; value is a public documentation example, not a secret",
	}
	var accepted *response
	var acceptedPath string
	for _, p := range []string{"/scan", "/api/scan", "/eval", "/mcp/v1/tools/call"} {
		r, err := c.postJSON(ctx, p, payload)
		if err != nil {
			continue
		}
		// An unambiguous refusal status settles it regardless of body shape.
		if refusedStatus(r.Status) {
			f.Result = Pass
			f.Evidence = fmt.Sprintf("POST %s HTTP %d — refused", p, r.Status)
			f.Rationale = "credential-shaped input is rejected rather than accepted and processed"
			f.Probe = "POST " + p
			return f
		}
		// Anything else only counts if it actually came from an API, not a
		// catch-all HTML route that answers every unknown path.
		if !r.isAPI() {
			continue
		}
		low := strings.ToLower(r.Body)
		if strings.Contains(low, "not permitted") || strings.Contains(low, "not allowed") ||
			((strings.Contains(low, "credential") || strings.Contains(low, "secret")) &&
				(strings.Contains(low, "reject") || strings.Contains(low, "refus") || strings.Contains(low, "block"))) {
			f.Result = Pass
			f.Evidence = fmt.Sprintf("POST %s HTTP %d — body declines credential input", p, r.Status)
			f.Rationale = "the surface explicitly declines credential submission"
			f.Probe = "POST " + p
			return f
		}
		rr := r
		accepted, acceptedPath = &rr, p
	}
	if accepted == nil {
		f.Result = Unverifiable
		f.Evidence = "no endpoint returned an API response to a POST"
		f.Rationale = "the input guard could not be exercised; no reachable submission API was found"
		return f
	}
	f.Result = Fail
	f.Evidence = fmt.Sprintf("POST %s HTTP %d (%s); response did not decline credential input (%d bytes)",
		acceptedPath, accepted.Status, accepted.ContentType, len(accepted.Body))
	f.Rationale = "a public demo surface accepted credential-shaped input; the allowlist requires it be blocked"
	f.Probe = "POST " + acceptedPath
	return f
}

// ── Condition 4 (gateway): real-target scans are refused ─────────────────────

func (c *Checker) checkRealTargetScanRefused(ctx context.Context) Finding {
	f := Finding{
		ID:        "DM1-REAL-TARGET",
		Condition: `allowlist: gateway blocks real-target submission on the public eval scan`,
		Probe:     "POST RFC 5737 documentation address " + syntheticRealTarget,
	}
	payload := map[string]any{
		"targets": []string{syntheticRealTarget},
		"note":    "DM-1 conformance probe; RFC 5737 documentation range, never a live host",
	}
	var accepted *response
	var acceptedPath string
	for _, p := range []string{"/scan", "/api/scan", "/eval"} {
		r, err := c.postJSON(ctx, p, payload)
		if err != nil {
			continue
		}
		if r.Status >= 400 && r.Status < 500 {
			f.Result = Pass
			f.Evidence = fmt.Sprintf("POST %s HTTP %d — refused", p, r.Status)
			f.Rationale = "an arbitrary routable target is rejected, so the eval scan cannot be aimed at third parties"
			f.Probe = "POST " + p
			return f
		}
		if !r.isAPI() {
			continue
		}
		// NOTE: deliberately NOT matching on "demo"+"only" — that is banner
		// language, and a catch-all route serving the no-CUI banner would satisfy
		// it while the guard does not exist. Require refusal language instead.
		low := strings.ToLower(r.Body)
		if strings.Contains(low, "block") || strings.Contains(low, "refus") ||
			strings.Contains(low, "not permitted") || strings.Contains(low, "not allowed") ||
			(strings.Contains(low, "target") && strings.Contains(low, "restricted")) {
			f.Result = Pass
			f.Evidence = fmt.Sprintf("POST %s HTTP %d — body refuses the target", p, r.Status)
			f.Rationale = "the surface confines scans to demo targets"
			f.Probe = "POST " + p
			return f
		}
		rr := r
		accepted, acceptedPath = &rr, p
	}
	if accepted == nil {
		f.Result = Unverifiable
		f.Evidence = "no scan endpoint returned an API response"
		f.Rationale = "the real-target guard could not be exercised"
		return f
	}
	f.Result = Fail
	f.Evidence = fmt.Sprintf("POST %s HTTP %d — a routable third-party target was accepted", acceptedPath, accepted.Status)
	f.Rationale = "an open scan proxy is a liability to us and to whoever is scanned; the allowlist requires this be blocked"
	f.Probe = "POST " + acceptedPath
	return f
}

// ── Condition 5 (gateway): authenticated scans are tier-gated ────────────────

func (c *Checker) checkAuthenticatedScanTierGated(ctx context.Context) Finding {
	f := Finding{
		ID:        "DM1-TIER-GATE",
		Condition: `allowlist: authenticated scans are tier-gated on the public eval surface`,
		Probe:     "POST an authenticated-scan request with no license",
	}
	payload := map[string]any{
		"targets":       []string{"demo.invalid"},
		"authenticated": true,
		"note":          "DM-1 conformance probe; expects tier gating",
	}
	var accepted *response
	var acceptedPath string
	for _, p := range []string{"/scan", "/api/scan", "/eval"} {
		r, err := c.postJSON(ctx, p, payload)
		if err != nil {
			continue
		}
		if r.Status == http.StatusPaymentRequired || r.Status == http.StatusUnauthorized ||
			r.Status == http.StatusForbidden {
			f.Result = Pass
			f.Evidence = fmt.Sprintf("POST %s HTTP %d — gated", p, r.Status)
			f.Rationale = "an unlicensed authenticated scan is refused"
			f.Probe = "POST " + p
			return f
		}
		if !r.isAPI() {
			continue
		}
		low := strings.ToLower(r.Body)
		if strings.Contains(low, "license") || strings.Contains(low, "sovereign tier") ||
			strings.Contains(low, "upgrade") {
			f.Result = Pass
			f.Evidence = fmt.Sprintf("POST %s HTTP %d — body indicates a licensing gate", p, r.Status)
			f.Rationale = "the surface declines and points at the licensed tier"
			f.Probe = "POST " + p
			return f
		}
		rr := r
		accepted, acceptedPath = &rr, p
	}
	if accepted == nil {
		f.Result = Unverifiable
		f.Evidence = "no scan endpoint returned an API response"
		f.Rationale = "tier gating could not be exercised"
		return f
	}
	f.Result = Fail
	f.Evidence = fmt.Sprintf("POST %s HTTP %d — an unlicensed authenticated scan was not gated", acceptedPath, accepted.Status)
	f.Rationale = "the allowlist requires authenticated scans be tier-gated on this surface"
	f.Probe = "POST " + acceptedPath
	return f
}
