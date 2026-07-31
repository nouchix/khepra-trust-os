package mcp

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
)

// ── DM-1 controls for a publicly-reachable deployment ────────────────────────
//
// server.json names https://mcp.souhimbou.ai/ as this server's homepage, and
// ops/guards/sovereignty_allowlist.txt classifies that host as
// `demo-discovery / DEMO` with three written conditions:
//
//	"input guard + no-CUI banner + isolated demo DAG"
//
// Guard G-1 only checks that the host is ACKNOWLEDGED in the allowlist; it cannot
// check that any of those controls exist. They were prose. This file implements
// them, and core/democonform tests them from the outside.
//
// WHY THIS IS THE HIGHEST-VALUE CONTROL IN THE FILE
//
// The realistic path by which this company accidentally becomes a CUI processor
// is not a breach — it is a prospect pasting real controlled data into a public
// demo box to "try it with our actual environment." Once that lands in a
// vendor-hosted DAG, the sovereignty claim in ARCH-013 is false retroactively and
// the remediation is disclosure, not a code fix. So the guard REFUSES the input
// rather than accepting-and-scrubbing: nothing sensitive should ever reach
// storage, even briefly.
//
// FAIL CLOSED, BUT ONLY IN DEMO MODE. A sovereign customer deployment runs on the
// customer's own infrastructure inside their boundary, where CUI is exactly what
// the product is for. Refusing it there would break the product. So the guard is
// active only when the server is explicitly in demo mode — and demo mode is opt-in
// via KHEPRA_DAG_SEED_DEMO, matching what the allowlist already records.
//
// #CONTROL: SC-8 — public surface declares and enforces a no-CUI posture.
// #CONTROL: AC-3 — sensitive input is refused at the boundary, not stored.
// #CONTROL: CA-2 — the posture is externally assessable (core/democonform).

// NoCUINotice is the banner. It is returned in the MCP `initialize` response's
// instructions field, so every connecting client sees it before its first tool
// call — a banner a human must scroll to is not a control.
const NoCUINotice = "DEMO ONLY — SYNTHETIC DATA ONLY. Do not submit CUI, " +
	"controlled, classified, export-controlled (ITAR/EAR), or personally " +
	"identifiable information to this endpoint. It is a public demonstration " +
	"surface writing to an isolated demo DAG, not a customer evidence chain. " +
	"Submissions containing credentials or control markings are refused. " +
	"For CUI workloads run KHEPRA in sovereign mode inside your own boundary."

// DemoModeInfo is the machine-readable declaration a conformance checker reads.
// Without it, "the demo DAG is isolated" is unverifiable from outside — which
// core/democonform reports as UNVERIFIABLE rather than as a pass.
type DemoModeInfo struct {
	// Demo is true when this process is a public demonstration surface.
	Demo bool `json:"demo"`
	// DAG names the chain being written, so an assessor can confirm it is not a
	// customer chain.
	DAG string `json:"dag"`
	// DataClassification is the posture this surface accepts.
	DataClassification string `json:"data_classification"`
	// Notice is the banner text, so a client can display it verbatim.
	Notice string `json:"notice,omitempty"`
}

// ── The input guard ──────────────────────────────────────────────────────────

// controlMarking matches BANNER AND PORTION MARKINGS, not casual mentions of a
// marking's name. That distinction is the whole design, and it was forced by a
// failing test: the shipped CMMC catalog contains "FIPS-validated cryptography
// for CUI at rest", and the first version of this pattern refused it. A guard
// that blocks the product's own reference data is a bug, not caution.
//
// The realistic risk is a visitor PASTING A MARKED DOCUMENT — whose marking
// appears as a banner ("CUI//SP-PRIV", a leading "CUI" line, "CONTROLLED
// UNCLASSIFIED INFORMATION") — not a visitor writing the word "CUI" in a
// sentence. So the pattern targets marking SYNTAX.
//
// STATED LIMIT, because overclaiming here would be worse than the gap:
// UNMARKED CUI IS UNDETECTABLE BY ANY PATTERN. Nothing in this file can tell
// that an ordinary-looking hostname or filename is controlled. The banner
// (NoCUINotice) is the primary control; this guard is defence in depth against
// the obvious cases, and is deliberately not described as comprehensive.
var controlMarking = regexp.MustCompile(
	// Portion/banner marking syntax: CUI//SP-PRIV, CUI//FEDCON, SECRET//NOFORN
	`(?:CUI|SECRET|CONFIDENTIAL|TOP SECRET)\s*//` +
		// A marking on its own line or at the very start of the input
		`|(?:^|\n)\s*(?:CUI|FOUO|NOFORN)\b` +
		// Spelled-out banners
		`|CONTROLLED UNCLASSIFIED` +
		`|(?i:\bnot\s+releasable\s+to\s+foreign\b)` +
		// Unambiguous standalone markings — these are not ordinary English
		`|(?:^|[^A-Za-z])(?:NOFORN|FOUO|ITAR|EAR99)(?:[^A-Za-z]|$)` +
		`|(?i:\bexport[ -]controlled\b)` +
		`|(?i:\b(?:top[ -]?secret|classified)\b)`)

// credentialShape matches things that are credentials by construction, not by
// entropy heuristics. Entropy scoring produces false positives on hashes and
// base64 payloads, which this server legitimately handles (AEO hashes, ML-DSA
// signatures), so shape matching is deliberately preferred over entropy.
var credentialShape = regexp.MustCompile(
	`-----BEGIN [A-Z ]*PRIVATE KEY-----` + // PEM private key
		`|\bAKIA[0-9A-Z]{16}\b` + // AWS access key id
		`|\bASIA[0-9A-Z]{16}\b` + // AWS temporary key id
		`|\bsk_live_[0-9a-zA-Z]{10,}` + // Stripe live secret
		`|\bghp_[0-9A-Za-z]{20,}` + // GitHub personal access token
		`|\bgithub_pat_[0-9A-Za-z_]{20,}` +
		`|\bxox[baprs]-[0-9A-Za-z-]{10,}` + // Slack
		`|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}` + // JWT
		`|(?i:\bBearer\s+[A-Za-z0-9._~+/-]{20,})`)

// sensitiveKey matches field NAMES that should never carry a value on a public
// demo surface, whatever the value looks like.
var sensitiveKey = regexp.MustCompile(
	`(?i:^(?:password|passwd|secret|api[_-]?key|apikey|private[_-]?key|` +
		`client[_-]?secret|access[_-]?token|refresh[_-]?token|credential|` +
		`ssn|social[_-]?security)$)`)

// GuardRejection describes why input was refused. It names the CATEGORY, never
// the matched value: echoing the offending secret back into an error message,
// a log, or an evidence record is precisely the leak the guard exists to stop.
type GuardRejection struct {
	Category string `json:"category"`
	Field    string `json:"field,omitempty"`
	Message  string `json:"message"`
}

func (g GuardRejection) Error() string { return g.Message }

// ScreenInput refuses tool arguments that carry credentials, control markings, or
// sensitive field names. It returns nil when the input is acceptable.
//
// It inspects field names and string values recursively. Non-string leaves cannot
// carry a marking, so they are skipped.
func ScreenInput(raw json.RawMessage) *GuardRejection {
	if len(raw) == 0 {
		return nil
	}
	var v any
	if err := json.Unmarshal(raw, &v); err != nil {
		// Not JSON: screen the raw text so a malformed body cannot bypass.
		return screenString("", string(raw))
	}
	return screenValue("", v)
}

func screenValue(field string, v any) *GuardRejection {
	switch t := v.(type) {
	case map[string]any:
		for k, sub := range t {
			if sensitiveKey.MatchString(k) {
				return &GuardRejection{
					Category: "sensitive_field",
					Field:    k,
					Message: fmt.Sprintf("field %q is not accepted on the public demo surface. %s",
						k, NoCUINotice),
				}
			}
			if r := screenValue(k, sub); r != nil {
				return r
			}
		}
	case []any:
		for _, sub := range t {
			if r := screenValue(field, sub); r != nil {
				return r
			}
		}
	case string:
		return screenString(field, t)
	}
	return nil
}

func screenString(field, s string) *GuardRejection {
	if credentialShape.MatchString(s) {
		return &GuardRejection{
			Category: "credential",
			Field:    field,
			Message:  "input appears to contain a credential and was refused. " + NoCUINotice,
		}
	}
	if controlMarking.MatchString(s) {
		return &GuardRejection{
			Category: "control_marking",
			Field:    field,
			Message:  "input carries a control marking (CUI/ITAR/classified) and was refused. " + NoCUINotice,
		}
	}
	return nil
}

// ── Wiring ───────────────────────────────────────────────────────────────────

// DemoMode holds the server's public-surface posture. The zero value is a
// sovereign (non-demo) deployment: the guard is OFF and CUI is accepted, which is
// correct for a customer running inside their own boundary.
type DemoMode struct {
	Enabled bool
	DAGName string
}

// Info renders the machine-readable declaration a conformance checker reads.
func (d DemoMode) Info() DemoModeInfo {
	if !d.Enabled {
		return DemoModeInfo{Demo: false, DAG: d.dagName(), DataClassification: "customer-defined"}
	}
	return DemoModeInfo{
		Demo:               true,
		DAG:                d.dagName(),
		DataClassification: "DEMO / SYNTHETIC ONLY — no CUI",
		Notice:             NoCUINotice,
	}
}

func (d DemoMode) dagName() string {
	if d.DAGName != "" {
		return d.DAGName
	}
	if d.Enabled {
		return "demo-seeded"
	}
	return "sovereign"
}

// Instructions is the text handed to a client in the initialize response.
func (d DemoMode) Instructions() string {
	if !d.Enabled {
		return ""
	}
	return NoCUINotice
}

// Screen applies the input guard only when this is a public demo surface.
func (d DemoMode) Screen(raw json.RawMessage) *GuardRejection {
	if !d.Enabled {
		return nil
	}
	return ScreenInput(raw)
}

// DemoModeFromEnv reads the same variable the sovereignty allowlist already
// records for mcp.souhimbou.ai (KHEPRA_DAG_SEED_DEMO=true), so the deployment
// knob and the documented condition cannot drift apart.
func DemoModeFromEnv(getenv func(string) string) DemoMode {
	v := strings.TrimSpace(strings.ToLower(getenv("KHEPRA_DAG_SEED_DEMO")))
	enabled := v == "true" || v == "1" || v == "yes"
	return DemoMode{Enabled: enabled, DAGName: strings.TrimSpace(getenv("KHEPRA_DAG_NAME"))}
}
