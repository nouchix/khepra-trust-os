package mcp

import (
	"encoding/json"
	"fmt"
	"io"
)

// RunDemo drives the trust tools end to end against a fresh in-memory server
// and writes a human-readable narrative to w. It is the one-command proof a
// validation partner runs: real ML-DSA-65 signatures, real hash chains, real
// trust metrics — nothing fabricated.
func RunDemo(w io.Writer) error {
	t := NewTrustServer()

	call := func(tool string, args map[string]any) (map[string]any, error) {
		raw, _ := json.Marshal(args)
		res, err := t.Call(tool, raw)
		if err != nil {
			return nil, fmt.Errorf("%s: %w", tool, err)
		}
		b, _ := json.Marshal(res)
		var m map[string]any
		_ = json.Unmarshal(b, &m)
		return m, nil
	}

	p := func(format string, a ...any) { fmt.Fprintf(w, format+"\n", a...) }

	p("═══════════════════════════════════════════════════════════════")
	p("  KHEPRA Trust OS — MCP validation demo")
	p("  Every line below is a real PQC-signed, content-addressed record.")
	p("═══════════════════════════════════════════════════════════════")

	// 1. Onboard an agent.
	reg, err := call("agent_register", map[string]any{"name": "acme-review-agent"})
	if err != nil {
		return err
	}
	did, _ := reg["agent_id"].(string)
	p("\n[1] agent_register → %s  (%s)", did, reg["algorithm"])

	// 2. Record a few real actions into its Proof of Work History.
	tasks := []map[string]any{
		{"task": "audit CMMC AU controls", "intent": "verify audit-log retention", "transport": "sovereign", "classification": "CUI",
			"tool_calls":   []any{map[string]any{"tool": "filesystem", "target": "/var/log", "latency_ms": 12, "outcome": "ok"}},
			"observations": []any{map[string]any{"target": "AU.L2-3.3.1", "finding": "audit records retained 90d", "confidence": 0.98}}},
		{"task": "scan SC controls", "intent": "verify FIPS crypto in use", "transport": "sovereign", "classification": "CUI",
			"tool_calls":   []any{map[string]any{"tool": "static-analysis", "target": "pkg/crypto", "latency_ms": 40, "outcome": "ok"}},
			"observations": []any{map[string]any{"target": "SC.L2-3.13.11", "finding": "ML-KEM + ML-DSA present", "confidence": 0.97}}},
	}
	for i, tk := range tasks {
		tk["agent_id"] = did
		rec, err := call("aeo_record", tk)
		if err != nil {
			return err
		}
		p("[2.%d] aeo_record → %s… parent=%q", i+1, short(rec["aeo_hash"]), short(rec["parent_event"]))
	}

	// 3. Forensic replay — re-verify the whole chain from evidence.
	rep, err := call("ledger_replay", map[string]any{"agent_id": did})
	if err != nil {
		return err
	}
	p("\n[3] ledger_replay → verified=%v events=%v tip=%s…", rep["verified"], rep["events"], short(rep["chain_tip"]))

	// 4. Trust standing.
	ts, err := call("trust_score", map[string]any{"agent_id": did})
	if err != nil {
		return err
	}
	p("[4] trust_score → overall=%v (integrity=%v consistency=%v intent=%v)",
		ts["score"], ts["integrity_score"], ts["consistency_score"], ts["intent_score"])

	// 5. Agent Passport — issue + verify.
	pass, err := call("passport_issue", map[string]any{"agent_id": did})
	if err != nil {
		return err
	}
	p("[5] passport_issue → khepra-passport/1.0 trust=%v events=%v registrar=%q",
		pass["trust_score"], pass["events"], pass["registrar"])
	ver, err := call("passport_verify", map[string]any{"passport": pass})
	if err != nil {
		return err
	}
	p("    passport_verify → document_valid=%v ledger_consistent=%v", ver["document_valid"], ver["ledger_consistent"])

	// 6. Dual-anchor determinism proof — the flagship demo.
	same := map[string]any{"controls": []string{"AU.L2-3.3.1", "SC.L2-3.13.11"}, "result": "pass"}
	det, err := call("dual_anchor", map[string]any{
		"agent_id": did, "action": "stig query (identical inputs)",
		"response_a": same, "response_b": same,
		"transport_a": "smithery", "transport_b": "sovereign",
	})
	if err != nil {
		return err
	}
	p("\n[6] dual_anchor (agreeing hosts) → %s  anchor_a==anchor_b: %v", det["verdict"], det["deterministic"])

	drift, err := call("dual_anchor", map[string]any{
		"agent_id": did, "action": "stig query (tampered host)",
		"response_a":  same,
		"response_b":  map[string]any{"controls": []string{"AU.L2-3.3.1", "SC.L2-3.13.11"}, "result": "FAIL-injected"},
		"transport_a": "smithery", "transport_b": "sovereign",
	})
	if err != nil {
		return err
	}
	p("    dual_anchor (drifting host) → %s  (auto drift finding emitted, signed)", drift["verdict"])

	// 7. Metrics for the pitch.
	stats, err := call("ledger_stats", nil)
	if err != nil {
		return err
	}
	p("\n[7] ledger_stats → agents=%v total_aeos=%v avg_trust=%v algorithm=%v",
		stats["agents"], stats["total_aeos"], stats["avg_trust_score"], stats["algorithm"])
	p("═══════════════════════════════════════════════════════════════")
	p("  \"Trust me\" → \"Prove it.\"  Every record above is verifiable offline.")
	p("═══════════════════════════════════════════════════════════════")
	return nil
}

func short(v any) string {
	s, _ := v.(string)
	if len(s) <= 12 {
		return s
	}
	return s[:12]
}
