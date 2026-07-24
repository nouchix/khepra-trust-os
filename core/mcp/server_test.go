package mcp

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log"
	"strings"
	"testing"
)

// drive runs a batch of newline-delimited JSON-RPC requests through Serve and
// returns the decoded responses (in order).
func drive(t *testing.T, srv *Server, requests ...string) []rpcResponse {
	t.Helper()
	in := bytes.NewBufferString(strings.Join(requests, "\n") + "\n")
	var out bytes.Buffer
	if err := srv.Serve(context.Background(), in, &out); err != nil {
		t.Fatalf("serve: %v", err)
	}
	var resps []rpcResponse
	dec := json.NewDecoder(&out)
	for {
		var r rpcResponse
		if err := dec.Decode(&r); err == io.EOF {
			break
		} else if err != nil {
			t.Fatalf("decode response: %v", err)
		}
		resps = append(resps, r)
	}
	return resps
}

func TestInitializeAndToolsList(t *testing.T) {
	srv := NewServer(log.New(io.Discard, "", 0))
	resps := drive(t, srv,
		`{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25"}}`,
		`{"jsonrpc":"2.0","method":"notifications/initialized"}`,
		`{"jsonrpc":"2.0","id":2,"method":"tools/list"}`,
	)
	// The notification produces no response → 2 responses total.
	if len(resps) != 2 {
		t.Fatalf("expected 2 responses, got %d", len(resps))
	}

	var initRes initializeResult
	if err := json.Unmarshal(resps[0].Result, &initRes); err != nil {
		t.Fatalf("init result: %v", err)
	}
	if initRes.ServerInfo.Name != ServerName || initRes.ProtocolVersion != "2025-11-25" {
		t.Fatalf("bad init result: %+v", initRes)
	}
	if initRes.Capabilities.Tools == nil {
		t.Fatal("tools capability not advertised")
	}

	var list struct {
		Tools []toolDescriptor `json:"tools"`
	}
	if err := json.Unmarshal(resps[1].Result, &list); err != nil {
		t.Fatalf("tools/list result: %v", err)
	}
	want := map[string]bool{
		"agent_register": false, "aeo_record": false, "aeo_verify": false,
		"ledger_replay": false, "trust_score": false, "passport_issue": false,
		"passport_verify": false, "dual_anchor": false, "ledger_stats": false,
	}
	for _, td := range list.Tools {
		if _, ok := want[td.Name]; ok {
			want[td.Name] = true
		}
		if td.InputSchema == nil {
			t.Fatalf("tool %s missing inputSchema", td.Name)
		}
	}
	for name, seen := range want {
		if !seen {
			t.Fatalf("tools/list missing %s", name)
		}
	}
}

func TestToolsCallOverProtocol(t *testing.T) {
	srv := NewServer(log.New(io.Discard, "", 0))
	resps := drive(t, srv,
		`{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"agent_register","arguments":{"name":"x"}}}`,
		`{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"trust_score","arguments":{"agent_id":"did:khepra:nobody"}}}`,
	)
	if len(resps) != 2 {
		t.Fatalf("expected 2 responses, got %d", len(resps))
	}
	var reg callToolResult
	if err := json.Unmarshal(resps[0].Result, &reg); err != nil || reg.IsError {
		t.Fatalf("agent_register returned error: %v (%+v)", err, reg)
	}
	if !strings.Contains(reg.Content[0].Text, "did:khepra:") {
		t.Fatalf("agent_register did not return a DID: %s", reg.Content[0].Text)
	}
	// Unknown agent still returns a *result* with isError, not a protocol error,
	// so the agent can read the reason.
	var ts callToolResult
	if err := json.Unmarshal(resps[1].Result, &ts); err != nil {
		t.Fatalf("trust_score decode: %v", err)
	}
	// trust_score for an unknown agent returns a report (0 events), not an error.
	if ts.IsError {
		t.Fatalf("trust_score should return a zero report, not an error: %s", ts.Content[0].Text)
	}
}

func TestFullTrustFlow(t *testing.T) {
	ts := NewTrustServer()

	// register
	did := mustCallStr(t, ts, "agent_register", map[string]any{"name": "reviewer"}, "agent_id")

	// record two actions
	for i := 0; i < 2; i++ {
		out := mustCall(t, ts, "aeo_record", map[string]any{
			"agent_id": did, "task": "audit", "intent": "verify controls",
			"tool_calls":   []any{map[string]any{"tool": "fs", "target": "/etc", "latency_ms": 5, "outcome": "ok"}},
			"observations": []any{map[string]any{"target": "AU-3.3.1", "finding": "ok", "confidence": 0.9}},
		})
		if out["aeo_hash"] == "" {
			t.Fatal("aeo_record returned no hash")
		}
	}

	// replay + trust
	rep := mustCall(t, ts, "ledger_replay", map[string]any{"agent_id": did})
	if rep["verified"] != true || toInt(rep["events"]) != 2 {
		t.Fatalf("replay wrong: %+v", rep)
	}
	tr := mustCall(t, ts, "trust_score", map[string]any{"agent_id": did})
	if toInt(tr["score"]) != 100 {
		t.Fatalf("expected trust 100 for clean history, got %v", tr["score"])
	}

	// passport issue + verify
	pass := mustCall(t, ts, "passport_issue", map[string]any{"agent_id": did})
	ver := mustCall(t, ts, "passport_verify", map[string]any{"passport": pass})
	if ver["document_valid"] != true || ver["ledger_consistent"] != true {
		t.Fatalf("passport verify failed: %+v", ver)
	}

	// dual-anchor: deterministic then drift
	same := map[string]any{"r": "pass"}
	det := mustCall(t, ts, "dual_anchor", map[string]any{
		"agent_id": did, "action": "q", "response_a": same, "response_b": same,
	})
	if det["verdict"] != "DETERMINISTIC" || det["deterministic"] != true {
		t.Fatalf("expected DETERMINISTIC, got %+v", det)
	}
	if det["anchor_a"] != det["anchor_b"] {
		t.Fatal("deterministic anchors should be equal")
	}
	drift := mustCall(t, ts, "dual_anchor", map[string]any{
		"agent_id": did, "action": "q", "response_a": same, "response_b": map[string]any{"r": "FAIL"},
	})
	if drift["verdict"] != "DRIFT" || drift["deterministic"] != false {
		t.Fatalf("expected DRIFT, got %+v", drift)
	}
	if _, ok := drift["drift"]; !ok {
		t.Fatal("drift result missing drift report")
	}

	// stats: 2 records + 2 (deterministic) + 2 (drift) = 6 AEOs on one agent
	stats := mustCall(t, ts, "ledger_stats", nil)
	if toInt(stats["agents"]) != 1 || toInt(stats["total_aeos"]) != 6 {
		t.Fatalf("stats wrong: %+v", stats)
	}
}

func TestPassportRefusedWithoutHistory(t *testing.T) {
	ts := NewTrustServer()
	did := mustCallStr(t, ts, "agent_register", map[string]any{}, "agent_id")
	if _, err := ts.Call("passport_issue", marshal(map[string]any{"agent_id": did})); err == nil {
		t.Fatal("passport issued for an agent with no verified history")
	}
}

func TestAEOVerify(t *testing.T) {
	ts := NewTrustServer()
	did := mustCallStr(t, ts, "agent_register", map[string]any{}, "agent_id")
	rec := mustCall(t, ts, "aeo_record", map[string]any{"agent_id": did, "task": "t", "intent": "i"})
	hash, _ := rec["aeo_hash"].(string)

	ok := mustCall(t, ts, "aeo_verify", map[string]any{"aeo_hash": hash})
	if ok["verified"] != true {
		t.Fatalf("recorded AEO failed verification: %+v", ok)
	}
	if _, err := ts.Call("aeo_verify", marshal(map[string]any{"aeo_hash": "nope"})); err == nil {
		t.Fatal("unknown aeo_hash should error")
	}
}

func TestDemoRuns(t *testing.T) {
	if err := RunDemo(io.Discard); err != nil {
		t.Fatalf("demo failed: %v", err)
	}
}

// ─── helpers ────────────────────────────────────────────────────────────────

func marshal(v any) json.RawMessage {
	b, _ := json.Marshal(v)
	return b
}

func mustCall(t *testing.T, ts *TrustServer, tool string, args map[string]any) map[string]any {
	t.Helper()
	res, err := ts.Call(tool, marshal(args))
	if err != nil {
		t.Fatalf("%s: %v", tool, err)
	}
	b, _ := json.Marshal(res)
	var m map[string]any
	if err := json.Unmarshal(b, &m); err != nil {
		t.Fatalf("%s result not an object: %v", tool, err)
	}
	return m
}

func mustCallStr(t *testing.T, ts *TrustServer, tool string, args map[string]any, key string) string {
	t.Helper()
	m := mustCall(t, ts, tool, args)
	s, _ := m[key].(string)
	if s == "" {
		t.Fatalf("%s: missing %q in %+v", tool, key, m)
	}
	return s
}

func toInt(v any) int {
	switch n := v.(type) {
	case float64:
		return int(n)
	case int:
		return n
	default:
		return -1
	}
}
