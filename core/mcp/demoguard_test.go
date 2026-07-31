package mcp

import (
	"encoding/json"
	"strings"
	"testing"
)

// ── The guard refuses what it must ───────────────────────────────────────────

func TestGuardRefusesCredentialShapes(t *testing.T) {
	cases := map[string]string{
		"AWS access key":  `{"name":"acme","note":"AKIAIOSFODNN7EXAMPLE"}`,
		"AWS temp key":    `{"note":"ASIAIOSFODNN7EXAMPLE"}`,
		"PEM private key": `{"key":"-----BEGIN RSA PRIVATE KEY-----\nMIIE..."}`,
		"Stripe live":     `{"note":"sk_live_abcdefghij1234567890"}`,
		"GitHub PAT":      `{"note":"ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ012345"}`,
		"Slack token":     `{"note":"xoxb-123456789012-abcdefghijkl"}`,
		"JWT":             `{"note":"eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVPmB92K27uhbUJU1p1r_wW1gFWFOEjXk"}`,
		"Bearer header":   `{"note":"Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456"}`,
	}
	for name, body := range cases {
		t.Run(name, func(t *testing.T) {
			rej := ScreenInput(json.RawMessage(body))
			if rej == nil {
				t.Fatalf("%s must be refused on a public demo surface", name)
			}
			if rej.Category != "credential" {
				t.Fatalf("expected category credential, got %q", rej.Category)
			}
		})
	}
}

func TestGuardRefusesControlMarkings(t *testing.T) {
	// Banner and portion markings — the shape a PASTED MARKED DOCUMENT actually
	// has. Casual prose mentions of "CUI" are deliberately not in this list; see
	// TestCasualMentionOfCUIIsNotRefused for why.
	cases := map[string]string{
		"CUI portion marking": `{"note":"CUI//SP-PRIV"}`,
		"CUI banner line":     `{"note":"CUI\nThis document contains controlled data"}`,
		"CUI leading":         `{"note":"CUI"}`,
		"spelled-out banner":  `{"note":"CONTROLLED UNCLASSIFIED INFORMATION"}`,
		"NOFORN":              `{"note":"REL TO USA, NOFORN"}`,
		"FOUO":                `{"note":"FOUO - internal only"}`,
		"ITAR":                `{"note":"subject to ITAR restrictions"}`,
		"export control":      `{"note":"this data is export-controlled"}`,
		"classified":          `{"note":"TOP SECRET material"}`,
		"secret portion":      `{"note":"SECRET// portion marking"}`,
		"not releasable":      `{"note":"Not Releasable to Foreign Nationals"}`,
		"nested in array":     `{"items":["fine","CUI//FEDCON"]}`,
		"nested in map":       `{"outer":{"inner":"CUI//SP-PRIV"}}`,
	}
	for name, body := range cases {
		t.Run(name, func(t *testing.T) {
			rej := ScreenInput(json.RawMessage(body))
			if rej == nil {
				t.Fatalf("%s must be refused", name)
			}
			if rej.Category != "control_marking" {
				t.Fatalf("expected control_marking, got %q", rej.Category)
			}
		})
	}
}

func TestGuardRefusesSensitiveFieldNames(t *testing.T) {
	for _, k := range []string{"password", "api_key", "apiKey", "private_key", "client_secret", "access_token", "credential", "ssn"} {
		body, _ := json.Marshal(map[string]any{k: "anything at all"})
		rej := ScreenInput(body)
		if rej == nil {
			t.Fatalf("field %q must be refused whatever its value", k)
		}
		if rej.Category != "sensitive_field" || rej.Field != k {
			t.Fatalf("expected sensitive_field/%s, got %s/%s", k, rej.Category, rej.Field)
		}
	}
}

// Non-JSON bodies must not bypass the guard.
func TestGuardScreensNonJSONBody(t *testing.T) {
	if ScreenInput(json.RawMessage(`not json at all: AKIAIOSFODNN7EXAMPLE`)) == nil {
		t.Fatal("a malformed body carrying a credential must still be refused")
	}
}

// ── The guard does NOT refuse legitimate traffic ─────────────────────────────

// The single most important negative case. The shipped CMMC catalog contains
// "FIPS-validated cryptography for CUI at rest", and AEO hashes and ML-DSA
// signatures are long base64-ish strings. A guard that trips on those makes the
// product unusable, so substring matching on "CUI" and entropy scoring were both
// rejected in favour of word-boundary and shape matching.
func TestGuardAllowsLegitimateInput(t *testing.T) {
	ok := []string{
		`{"name":"acme-review-agent"}`,
		`{"family":"Access Control"}`,
		`{"stig_id":"application_security_and_development"}`,
		`{"title":"FIPS-validated cryptography for CUI at rest"}`, // catalog text
		`{"aeo_hash":"a43c0a2e4e570058e0bc4ceb4eb4491e9f0c1d2e3a4b5c6d7e8f9012345678ab"}`,
		`{"note":"circuit acuity biscuit"}`, // contains "cui" inside words
		`{"signature":"3045022100abcdef0123456789abcdef0123456789abcdef0123456789abcdef012345678902"}`,
		`{"count":42,"enabled":true,"ratio":0.5}`,
		`{}`,
	}
	for _, body := range ok {
		if rej := ScreenInput(json.RawMessage(body)); rej != nil {
			t.Fatalf("legitimate input was refused: %s → %s (%s)", body, rej.Category, rej.Field)
		}
	}
}

// A casual mention is not a marking. This is a DELIBERATE, DOCUMENTED limit, not
// an oversight: "FIPS-validated cryptography for CUI at rest" is the product's own
// catalog text, and an earlier version of the guard refused it. The banner
// (NoCUINotice) is the primary control; pattern matching is defence in depth
// against pasted marked documents, and cannot detect unmarked CUI at all.
func TestCasualMentionOfCUIIsNotRefused(t *testing.T) {
	for _, s := range []string{
		"FIPS-validated cryptography for CUI at rest",
		"our product protects CUI in sovereign mode",
		"does this handle CUI workloads?",
	} {
		body, _ := json.Marshal(map[string]any{"note": s})
		if rej := ScreenInput(body); rej != nil {
			t.Fatalf("a prose mention must not be refused (%q → %s); blocking the product's own vocabulary makes the demo unusable", s, rej.Category)
		}
	}
}

func TestCUISubstringInsideWordIsNotAMarking(t *testing.T) {
	// "biscuit", "circuit", "acuity" all contain "cui". If these trip the guard,
	// the word-boundary anchoring has regressed.
	for _, s := range []string{"biscuit", "circuit board", "visual acuity", "Cuisine"} {
		body, _ := json.Marshal(map[string]any{"note": s})
		if rej := ScreenInput(body); rej != nil {
			t.Fatalf("%q must not be treated as a CUI marking (got %s)", s, rej.Category)
		}
	}
}

// ── The rejection never echoes the secret ────────────────────────────────────

func TestRejectionDoesNotEchoTheSecret(t *testing.T) {
	const secret = "AKIAIOSFODNN7EXAMPLE"
	body, _ := json.Marshal(map[string]any{"note": secret})
	rej := ScreenInput(body)
	if rej == nil {
		t.Fatal("expected refusal")
	}
	if strings.Contains(rej.Message, secret) {
		t.Fatal("CRITICAL: the rejection message echoes the credential — that puts it in logs and error paths, which is the leak the guard exists to prevent")
	}
}

// ── Demo mode is opt-in; sovereign deployments are unaffected ────────────────

func TestSovereignDeploymentAcceptsCUI(t *testing.T) {
	var sovereign DemoMode // zero value
	// A genuine banner marking, not a prose mention — otherwise this test would
	// pass for the wrong reason (prose is allowed everywhere) and would not
	// actually exercise the sovereign bypass.
	body, _ := json.Marshal(map[string]any{"note": "CUI//SP-PRIV\nquarterly contract data"})
	if rej := sovereign.Screen(body); rej != nil {
		t.Fatal("a sovereign deployment inside the customer's boundary must accept CUI — that is what the product is for")
	}
	if sovereign.Instructions() != "" {
		t.Fatal("a sovereign deployment must not emit a no-CUI banner")
	}
	if info := sovereign.Info(); info.Demo {
		t.Fatal("zero value must not declare demo mode")
	}
}

func TestDemoDeploymentRefusesCUI(t *testing.T) {
	demo := DemoMode{Enabled: true}
	body, _ := json.Marshal(map[string]any{"note": "CUI//SP-PRIV\nquarterly contract data"})
	if rej := demo.Screen(body); rej == nil {
		t.Fatal("a public demo surface must refuse a marked document")
	}
	if !strings.Contains(demo.Instructions(), "Do not submit CUI") {
		t.Fatal("demo mode must emit the no-CUI banner")
	}
	info := demo.Info()
	if !info.Demo || info.DAG != "demo-seeded" {
		t.Fatalf("demo mode must declare an isolated demo DAG, got %+v", info)
	}
	if !strings.Contains(strings.ToLower(info.DataClassification), "no cui") {
		t.Fatalf("the declaration must state the accepted classification, got %q", info.DataClassification)
	}
}

func TestDemoModeFromEnv(t *testing.T) {
	on := DemoModeFromEnv(func(k string) string {
		if k == "KHEPRA_DAG_SEED_DEMO" {
			return "true"
		}
		return ""
	})
	if !on.Enabled {
		t.Fatal("KHEPRA_DAG_SEED_DEMO=true must enable demo mode — it is the variable the allowlist already records")
	}
	off := DemoModeFromEnv(func(string) string { return "" })
	if off.Enabled {
		t.Fatal("unset must mean sovereign, not demo — fail toward the customer's boundary")
	}
}

// ── End to end through the MCP protocol ──────────────────────────────────────

func TestInitializeCarriesBannerInDemoMode(t *testing.T) {
	s := NewServer(nil)
	s.SetDemoMode(DemoMode{Enabled: true})
	resp := s.handleInitialize(rpcRequest{ID: json.RawMessage(`1`)})

	raw, _ := json.Marshal(resp.Result)
	var got initializeResult
	if err := json.Unmarshal(raw, &got); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(got.Instructions, "Do not submit CUI") {
		t.Fatalf("initialize must carry the no-CUI banner in demo mode, got %q", got.Instructions)
	}
	if !got.DemoMode.Demo {
		t.Fatal("initialize must declare demo mode so the posture is externally observable")
	}
}

func TestInitializeOmitsBannerWhenSovereign(t *testing.T) {
	s := NewServer(nil)
	resp := s.handleInitialize(rpcRequest{ID: json.RawMessage(`1`)})
	raw, _ := json.Marshal(resp.Result)
	if strings.Contains(string(raw), "Do not submit CUI") {
		t.Fatal("a sovereign deployment must not claim to be a no-CUI demo surface")
	}
}

func TestToolCallRefusesCredentialBeforeRecordingEvidence(t *testing.T) {
	s := NewServer(nil)
	s.SetDemoMode(DemoMode{Enabled: true})

	before := len(s.trust.agents)

	params, _ := json.Marshal(map[string]any{
		"name":      "agent_register",
		"arguments": map[string]any{"name": "AKIAIOSFODNN7EXAMPLE"},
	})
	resp := s.handleToolsCall(rpcRequest{ID: json.RawMessage(`1`), Params: params})

	raw, _ := json.Marshal(resp.Result)
	var res callToolResult
	_ = json.Unmarshal(raw, &res)
	if !res.IsError {
		t.Fatal("a credential-bearing tool call must be refused")
	}

	// THE POINT: an AEO is content-addressed and chained, so a credential written
	// into the ledger cannot be removed afterwards without breaking the chain.
	// The guard must run before anything is recorded or registered.
	if after := len(s.trust.agents); after != before {
		t.Fatalf("CRITICAL: refused input still registered %d agent(s) — a credential in a chained ledger is unremovable", after-before)
	}
}

func TestToolCallUnaffectedWhenSovereign(t *testing.T) {
	s := NewServer(nil)
	params, _ := json.Marshal(map[string]any{
		"name":      "agent_register",
		"arguments": map[string]any{"name": "acme-agent"},
	})
	resp := s.handleToolsCall(rpcRequest{ID: json.RawMessage(`1`), Params: params})
	raw, _ := json.Marshal(resp.Result)
	var res callToolResult
	_ = json.Unmarshal(raw, &res)
	if res.IsError {
		t.Fatalf("a normal sovereign tool call must succeed: %v", res.Content)
	}
}
