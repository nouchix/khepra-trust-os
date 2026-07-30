package mcp

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"time"

	"github.com/nouchix/khepra-trust-os/core/adinkra"
	"github.com/nouchix/khepra-trust-os/core/aeo"
	"github.com/nouchix/khepra-trust-os/core/citizenship"
	"github.com/nouchix/khepra-trust-os/core/dag"
	"github.com/nouchix/khepra-trust-os/core/dataloop"
	"github.com/nouchix/khepra-trust-os/core/enforce"
)

// RegistrarName is the human-readable issuer stamped onto passports.
const RegistrarName = "KHEPRA Trust OS Registrar"

// RegisteredAgentInfo summarizes an internally registered agent identity.
type RegisteredAgentInfo struct {
	AgentID   string
	Name      string
	PublicKey string
}

// agentState binds a registered agent's identity to its recorder.
type agentState struct {
	name     string
	pub      []byte
	priv     []byte
	recorder *aeo.Recorder
}

// TrustServer holds the in-memory trust ledger, the passport registrar, and the
// registered agents. It is the engine behind every MCP tool.
type TrustServer struct {
	ledger    *aeo.Ledger
	registrar *citizenship.Registrar
	agents    map[string]*agentState
	dataLoop  *dataloop.DataLoop

	tools map[string]toolDef
	order []string
}

type toolDef struct {
	desc    string
	schema  map[string]any
	handler func(args json.RawMessage) (any, error)
}

// NewTrustServer builds a fresh trust server: a signed in-memory DAG-anchored
// ledger, a registrar identity, and the tool registry.
func NewTrustServer() *TrustServer {
	ledgerPub, ledgerPriv, err := adinkra.GenerateDilithiumKey()
	if err != nil {
		panic("ktos-mcp: ledger keygen failed: " + err.Error())
	}
	_ = ledgerPub
	regPub, regPriv, err := adinkra.GenerateDilithiumKey()
	if err != nil {
		panic("ktos-mcp: registrar keygen failed: " + err.Error())
	}

	t := &TrustServer{
		ledger:    aeo.NewLedger(dag.NewMemory(), ledgerPriv),
		registrar: citizenship.NewRegistrar(RegistrarName, regPriv, regPub),
		agents:    make(map[string]*agentState),
		dataLoop:  dataloop.NewDataLoop(enforce.ViaMCPGateway),
	}
	t.registerTools()
	return t
}

// Descriptors returns the tool list for MCP tools/list, in a stable order.
func (t *TrustServer) Descriptors() []toolDescriptor {
	out := make([]toolDescriptor, 0, len(t.order))
	for _, name := range t.order {
		td := t.tools[name]
		out = append(out, toolDescriptor{Name: name, Description: td.desc, InputSchema: td.schema})
	}
	return out
}

// Call dispatches an MCP tools/call to its handler. Calls are serialized: the
// trust ledger and agent map are mutated in place.
func (t *TrustServer) Call(name string, args json.RawMessage) (any, error) {
	td, ok := t.tools[name]
	if !ok {
		return nil, fmt.Errorf("unknown tool: %s", name)
	}
	return td.handler(args)
}

// ─── argument / helper types ────────────────────────────────────────────────

type toolCallArg struct {
	Tool      string `json:"tool"`
	Target    string `json:"target"`
	LatencyMS int64  `json:"latency_ms"`
	Outcome   string `json:"outcome"`
}

type obsArg struct {
	Target     string  `json:"target"`
	Finding    string  `json:"finding"`
	Confidence float64 `json:"confidence"`
	Evidence   string  `json:"evidence"`
}

func (t *TrustServer) getAgent(did string) (*agentState, error) {
	a, ok := t.agents[did]
	if !ok {
		return nil, fmt.Errorf("unknown agent_id %q — call agent_register first", did)
	}
	return a, nil
}

// recordOne seals one AEO for an agent and appends it to the ledger.
func (t *TrustServer) recordOne(a *agentState, task, intent string, calls []toolCallArg, obs []obsArg) (*aeo.EvidenceObject, error) {
	tr := a.recorder.StartTask(task, intent)
	for _, c := range calls {
		outcome := c.Outcome
		if outcome == "" {
			outcome = "ok"
		}
		tr.RecordToolCall(c.Tool, c.Target, time.Duration(c.LatencyMS)*time.Millisecond, outcome)
	}
	for _, o := range obs {
		conf := o.Confidence
		if conf == 0 {
			conf = 1.0
		}
		tr.RecordObservation(o.Target, o.Finding, conf, o.Evidence)
	}
	obj, err := tr.Seal()
	if err != nil {
		return nil, err
	}
	if err := t.ledger.Append(obj); err != nil {
		return nil, err
	}
	return obj, nil
}

func sha256hex(b []byte) string {
	h := sha256.Sum256(b)
	return hex.EncodeToString(h[:])
}

// canonical returns a deterministic serialization of a JSON payload so that
// semantically-equal responses (differing only in whitespace or key order)
// hash identically. Non-JSON input is hashed as-is.
func canonical(raw json.RawMessage) []byte {
	if len(raw) == 0 {
		return []byte("null")
	}
	var v any
	if err := json.Unmarshal(raw, &v); err != nil {
		return []byte(raw)
	}
	b, err := json.Marshal(v) // Go sorts object keys → canonical
	if err != nil {
		return []byte(raw)
	}
	return b
}

// ─── tool registry ──────────────────────────────────────────────────────────

func (t *TrustServer) registerTools() {
	t.tools = make(map[string]toolDef)
	add := func(name, desc string, schema map[string]any, h func(json.RawMessage) (any, error)) {
		t.tools[name] = toolDef{desc: desc, schema: schema, handler: h}
		t.order = append(t.order, name)
	}
	obj := func(props map[string]any, required ...string) map[string]any {
		m := map[string]any{"type": "object", "properties": props}
		if len(required) > 0 {
			m["required"] = required
		}
		return m
	}
	str := map[string]any{"type": "string"}

	add("agent_register",
		"Onboard an autonomous agent: mint a post-quantum (ML-DSA-65) identity and return its did:khepra. Every later action is signed under this identity.",
		obj(map[string]any{"name": map[string]any{"type": "string", "description": "human-readable label for the agent"}}),
		t.handleAgentRegister)

	add("aeo_record",
		"Record one agent action as a PQC-signed, content-addressed AI Evidence Object chained into the agent's Proof of Work History. Optionally tag the serving transport and data classification.",
		obj(map[string]any{
			"agent_id":       str,
			"task":           str,
			"intent":         map[string]any{"type": "string", "description": "what the agent set out to do (committed as a hash BEFORE the action)"},
			"tool_calls":     map[string]any{"type": "array", "description": "tools invoked: {tool,target,latency_ms,outcome}"},
			"observations":   map[string]any{"type": "array", "description": "findings: {target,finding,confidence,evidence}"},
			"transport":      map[string]any{"type": "string", "description": "serving plane, e.g. smithery | sovereign"},
			"classification": map[string]any{"type": "string", "description": "data classification, e.g. PUBLIC | CUI | ITAR"},
		}, "agent_id", "task", "intent"),
		t.handleAEORecord)

	add("aeo_verify",
		"Verify a single AEO end-to-end: content-hash integrity, ML-DSA-65 signature, and agent-identity binding.",
		obj(map[string]any{"aeo_hash": str}, "aeo_hash"),
		t.handleAEOVerify)

	add("ledger_replay",
		"Forensic replay of an agent's full history (the 'anti-action'): re-verify every AEO and every chain link from genesis to tip. Returns the verified history or the first break.",
		obj(map[string]any{"agent_id": str}, "agent_id"),
		t.handleLedgerReplay)

	add("trust_score",
		"Compute an agent's trust standing (0-100) from its verified history: integrity (signatures + chain), behavioral consistency, and intent coverage.",
		obj(map[string]any{"agent_id": str}, "agent_id"),
		t.handleTrustScore)

	add("passport_issue",
		"Issue a registrar-signed Agent Passport: a portable credential composing identity, verified history, behavioral baseline, and trust standing. Refused for agents with no verified history — citizenship is earned by record.",
		obj(map[string]any{"agent_id": str}, "agent_id"),
		t.handlePassportIssue)

	add("passport_verify",
		"Verify an Agent Passport document (hash + ML-DSA-65 + registrar binding) and, when the ledger is available, re-derive its claims against the evidence.",
		obj(map[string]any{"passport": map[string]any{"type": "object", "description": "a passport document as returned by passport_issue"}}, "passport"),
		t.handlePassportVerify)

	add("dual_anchor",
		"Dual-anchor determinism proof: attest the SAME agent action from two transports, hash both responses, and land two mirror-linked AEOs. Matching SHA-256 anchors prove determinism ('trust the protocol, not the host'); divergence emits a signed drift finding.",
		obj(map[string]any{
			"agent_id":    str,
			"action":      map[string]any{"type": "string", "description": "logical action attested across both transports"},
			"response_a":  map[string]any{"description": "response payload from transport A (any JSON)"},
			"response_b":  map[string]any{"description": "response payload from transport B (any JSON)"},
			"transport_a": map[string]any{"type": "string", "description": "label for transport A (default: smithery)"},
			"transport_b": map[string]any{"type": "string", "description": "label for transport B (default: sovereign)"},
		}, "agent_id", "action", "response_a", "response_b"),
		t.handleDualAnchor)

	add("ledger_stats",
		"Aggregate trust metrics across all registered agents: agent count, total anchored AEOs, and mean trust score. Useful for traction/social-proof dashboards.",
		obj(map[string]any{}),
		t.handleLedgerStats)

	add("scan_shadow_ai",
		"Discover unapproved or rogue AI services, agents, LLMs, vector databases, and notebooks across target hosts/CIDRs with signature-based HTTP probes.",
		obj(map[string]any{
			"targets":         map[string]any{"type": "array", "description": "list of host IPs or subnets (e.g. ['127.0.0.1', '192.168.1.0/24'])"},
			"timeout_seconds": map[string]any{"type": "integer", "description": "scan timeout in seconds (default: 10)"},
		}),
		t.handleScanShadowAI)

	add("attest_ai_policy",
		"Evaluate discovered AI asset findings against a customer's AI governance policy, producing deterministic verdicts, audit hashes, and suggested enforcement postures.",
		obj(map[string]any{
			"policy":   map[string]any{"type": "object", "description": "customer AI governance policy object"},
			"findings": map[string]any{"type": "array", "description": "list of discovered AI asset findings"},
		}, "policy", "findings"),
		t.handleAttestAIPolicy)

	add("linux_hardening_check",
		"Run real-time Linux host hardening checks against Trimstray Practical Hardening rules and DISA RHEL 9/10 benchmarks.",
		obj(map[string]any{
			"domain": map[string]any{"type": "string", "description": "hardening domain: all | kernel | ssh | pam | filesystem | audit"},
		}),
		t.handleLinuxHardeningCheck)

	add("stig_live_query",
		"Query the live DISA STIG Viewer API v2 for updated benchmarks, CCIs, NIST crosswalks, check contents, and fix texts.",
		obj(map[string]any{
			"slug":     map[string]any{"type": "string", "description": "STIG benchmark slug (default: red_hat_enterprise_linux_9)"},
			"severity": map[string]any{"type": "string", "description": "severity filter: high | medium | low"},
		}),
		t.handleSTIGLiveQuery)

	add("agentpack_deploy",
		"Deploy a declarative agentpack blueprint (agentpack.yaml): parse identity, mission, tools allowed, security policies, and generate governed runtime containment grants.",
		obj(map[string]any{
			"agentpack_yaml": map[string]any{"type": "string", "description": "raw agentpack.yaml or JSON string"},
			"agentpack_json": map[string]any{"type": "string", "description": "raw agentpack JSON string"},
		}),
		t.handleAgentpackDeploy)

	add("dataloop_process",
		"Execute one cycle of the 6-step KHEPRA Autonomous Governance Data Loop Engine (Intent -> PDP Ruling -> ASAF Actuation -> ML-DSA-65 AEO -> Telemetry -> Data Intelligence).",
		obj(map[string]any{
			"agent_id":    str,
			"intent":      map[string]any{"type": "string", "description": "declared operational intent"},
			"tool":        map[string]any{"type": "string", "description": "tool to invoke"},
			"target":      map[string]any{"type": "string", "description": "target resource or endpoint"},
			"capability":  map[string]any{"type": "string", "description": "read | write | exec"},
			"environment": map[string]any{"type": "string", "description": "railway | aws | hetzner | sovereign_airgap"},
		}, "agent_id", "intent", "tool", "target"),
		t.handleDataLoopProcess)

	add("dataloop_intelligence",
		"Retrieve real-time Data Intelligence Layer metrics and moat analytics (safe remediations, false positive rate, FAIR financial risk score, cross-cloud reliability).",
		obj(map[string]any{}),
		t.handleDataLoopIntelligence)
}

// ─── handlers ───────────────────────────────────────────────────────────────

func (t *TrustServer) registerAgentInternal(name string, pub, priv []byte) (*RegisteredAgentInfo, error) {
	rec := aeo.NewRecorder(priv, pub)
	did := rec.AgentID()
	if name == "" {
		name = "agent"
	}
	t.agents[did] = &agentState{name: name, pub: pub, priv: priv, recorder: rec}

	return &RegisteredAgentInfo{
		AgentID:   did,
		Name:      name,
		PublicKey: hex.EncodeToString(pub),
	}, nil
}

func (t *TrustServer) handleAgentRegister(args json.RawMessage) (any, error) {
	var in struct {
		Name string `json:"name"`
	}
	_ = json.Unmarshal(args, &in)

	pub, priv, err := adinkra.GenerateDilithiumKey()
	if err != nil {
		return nil, fmt.Errorf("keygen failed: %w", err)
	}

	info, err := t.registerAgentInternal(in.Name, pub, priv)
	if err != nil {
		return nil, err
	}

	return map[string]any{
		"agent_id":   info.AgentID,
		"name":       info.Name,
		"algorithm":  aeo.AttestAlgorithm,
		"public_key": info.PublicKey,
	}, nil
}

func (t *TrustServer) handleAEORecord(args json.RawMessage) (any, error) {
	var in struct {
		AgentID        string        `json:"agent_id"`
		Task           string        `json:"task"`
		Intent         string        `json:"intent"`
		ToolCalls      []toolCallArg `json:"tool_calls"`
		Observations   []obsArg      `json:"observations"`
		Transport      string        `json:"transport"`
		Classification string        `json:"classification"`
	}
	if err := json.Unmarshal(args, &in); err != nil {
		return nil, fmt.Errorf("invalid arguments: %w", err)
	}
	a, err := t.getAgent(in.AgentID)
	if err != nil {
		return nil, err
	}

	obs := in.Observations
	if in.Transport != "" {
		obs = append(obs, obsArg{Target: "transport", Finding: in.Transport, Confidence: 1.0})
	}
	if in.Classification != "" {
		obs = append(obs, obsArg{Target: "classification", Finding: in.Classification, Confidence: 1.0})
	}

	o, err := t.recordOne(a, in.Task, in.Intent, in.ToolCalls, obs)
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"aeo_hash":     o.Hash,
		"parent_event": o.ParentEvent,
		"agent_id":     o.AgentID,
		"task":         o.Task,
		"tools_used":   o.ToolsUsed,
		"behavior": map[string]any{
			"execution_pattern": o.BehaviorSignature.ExecutionPattern,
			"tool_graph":        o.BehaviorSignature.ToolGraph,
		},
		"algorithm": o.CryptographicAttestation.Algorithm,
		"timestamp": o.Timestamp,
	}, nil
}

func (t *TrustServer) handleAEOVerify(args json.RawMessage) (any, error) {
	var in struct {
		AEOHash string `json:"aeo_hash"`
	}
	if err := json.Unmarshal(args, &in); err != nil {
		return nil, fmt.Errorf("invalid arguments: %w", err)
	}
	o, ok := t.ledger.Get(in.AEOHash)
	if !ok {
		return nil, fmt.Errorf("unknown aeo_hash %q", in.AEOHash)
	}
	res := map[string]any{
		"aeo_hash":  o.Hash,
		"agent_id":  o.AgentID,
		"task":      o.Task,
		"timestamp": o.Timestamp,
		"algorithm": o.CryptographicAttestation.Algorithm,
	}
	if err := o.Verify(); err != nil {
		res["verified"] = false
		res["error"] = err.Error()
	} else {
		res["verified"] = true
	}
	return res, nil
}

func (t *TrustServer) handleLedgerReplay(args json.RawMessage) (any, error) {
	var in struct {
		AgentID string `json:"agent_id"`
	}
	if err := json.Unmarshal(args, &in); err != nil {
		return nil, fmt.Errorf("invalid arguments: %w", err)
	}
	history, err := t.ledger.Replay(in.AgentID)
	if err != nil {
		return nil, err
	}
	tasks := make([]map[string]any, 0, len(history))
	for i, o := range history {
		tasks = append(tasks, map[string]any{
			"seq": i, "aeo_hash": o.Hash, "task": o.Task, "timestamp": o.Timestamp,
		})
	}
	return map[string]any{
		"verified":   true,
		"agent_id":   in.AgentID,
		"events":     len(history),
		"chain_tip":  history[len(history)-1].Hash,
		"first_seen": history[0].Timestamp,
		"last_seen":  history[len(history)-1].Timestamp,
		"tasks":      tasks,
	}, nil
}

func (t *TrustServer) handleTrustScore(args json.RawMessage) (any, error) {
	var in struct {
		AgentID string `json:"agent_id"`
	}
	if err := json.Unmarshal(args, &in); err != nil {
		return nil, fmt.Errorf("invalid arguments: %w", err)
	}
	return t.ledger.Trust(in.AgentID), nil
}

func (t *TrustServer) handlePassportIssue(args json.RawMessage) (any, error) {
	var in struct {
		AgentID string `json:"agent_id"`
	}
	if err := json.Unmarshal(args, &in); err != nil {
		return nil, fmt.Errorf("invalid arguments: %w", err)
	}
	p, err := t.registrar.Issue(t.ledger, in.AgentID)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (t *TrustServer) handlePassportVerify(args json.RawMessage) (any, error) {
	var in struct {
		Passport json.RawMessage `json:"passport"`
	}
	if err := json.Unmarshal(args, &in); err != nil {
		return nil, fmt.Errorf("invalid arguments: %w", err)
	}
	var p citizenship.Passport
	if err := json.Unmarshal(in.Passport, &p); err != nil {
		return nil, fmt.Errorf("passport is not a valid document: %w", err)
	}

	res := map[string]any{
		"agent_id":    p.AgentID,
		"trust_score": p.TrustScore,
		"events":      p.Events,
		"revoked":     p.Revoked,
	}
	if err := p.Verify(); err != nil {
		res["document_valid"] = false
		res["error"] = err.Error()
		return res, nil
	}
	res["document_valid"] = true
	if err := p.VerifyAgainstLedger(t.ledger); err != nil {
		res["ledger_consistent"] = false
		res["ledger_note"] = err.Error()
	} else {
		res["ledger_consistent"] = true
	}
	return res, nil
}

func (t *TrustServer) handleDualAnchor(args json.RawMessage) (any, error) {
	var in struct {
		AgentID    string          `json:"agent_id"`
		Action     string          `json:"action"`
		ResponseA  json.RawMessage `json:"response_a"`
		ResponseB  json.RawMessage `json:"response_b"`
		TransportA string          `json:"transport_a"`
		TransportB string          `json:"transport_b"`
	}
	if err := json.Unmarshal(args, &in); err != nil {
		return nil, fmt.Errorf("invalid arguments: %w", err)
	}
	a, err := t.getAgent(in.AgentID)
	if err != nil {
		return nil, err
	}
	if in.TransportA == "" {
		in.TransportA = "smithery"
	}
	if in.TransportB == "" {
		in.TransportB = "sovereign"
	}

	anchorA := sha256hex(canonical(in.ResponseA))
	anchorB := sha256hex(canonical(in.ResponseB))
	deterministic := anchorA == anchorB
	verdict := "DETERMINISTIC"
	if !deterministic {
		verdict = "DRIFT"
	}

	// Two mirror-linked AEO nodes: each records its own transport's anchor and
	// references the sibling anchor, plus the determinism verdict.
	task := "dual-anchor: " + in.Action
	intent := "prove determinism of " + in.Action + " across transports " + in.TransportA + " and " + in.TransportB

	aeoA, err := t.recordOne(a, task, intent,
		[]toolCallArg{{Tool: "mcp-transport", Target: in.TransportA, Outcome: "ok"}},
		[]obsArg{
			{Target: in.TransportA, Finding: "response anchored", Confidence: 1.0, Evidence: anchorA},
			{Target: "mirror", Finding: "sibling anchor (" + in.TransportB + ")", Confidence: 1.0, Evidence: anchorB},
			{Target: "verdict", Finding: verdict, Confidence: 1.0, Evidence: anchorA + ":" + anchorB},
		})
	if err != nil {
		return nil, err
	}
	aeoB, err := t.recordOne(a, task, intent,
		[]toolCallArg{{Tool: "mcp-transport", Target: in.TransportB, Outcome: "ok"}},
		[]obsArg{
			{Target: in.TransportB, Finding: "response anchored", Confidence: 1.0, Evidence: anchorB},
			{Target: "mirror", Finding: "sibling anchor (" + in.TransportA + ")", Confidence: 1.0, Evidence: anchorA},
			{Target: "verdict", Finding: verdict, Confidence: 1.0, Evidence: anchorA + ":" + anchorB},
		})
	if err != nil {
		return nil, err
	}

	res := map[string]any{
		"verdict":       verdict,
		"deterministic": deterministic,
		"action":        in.Action,
		"transport_a":   in.TransportA,
		"transport_b":   in.TransportB,
		"anchor_a":      anchorA,
		"anchor_b":      anchorB,
		"aeo_a":         aeoA.Hash,
		"aeo_b":         aeoB.Hash,
		"mirrors":       map[string]string{aeoA.Hash: aeoB.Hash, aeoB.Hash: aeoA.Hash},
	}
	if !deterministic {
		res["drift"] = map[string]any{
			"summary":   "transport responses diverge — anchors do not match",
			"transport": []string{in.TransportA, in.TransportB},
			"anchors":   []string{anchorA, anchorB},
		}
	}
	return res, nil
}

func (t *TrustServer) handleLedgerStats(_ json.RawMessage) (any, error) {
	dids := make([]string, 0, len(t.agents))
	for did := range t.agents {
		dids = append(dids, did)
	}
	sort.Strings(dids)

	totalAEOs := 0
	sumTrust := 0
	scored := 0
	for _, did := range dids {
		h := t.ledger.History(did)
		totalAEOs += len(h)
		if len(h) > 0 {
			sumTrust += t.ledger.Trust(did).Score
			scored++
		}
	}
	avg := 0
	if scored > 0 {
		avg = sumTrust / scored
	}
	return map[string]any{
		"agents":              len(dids),
		"total_aeos":          totalAEOs,
		"agents_with_history": scored,
		"avg_trust_score":     avg,
		"algorithm":           aeo.AttestAlgorithm,
		"registrar_id":        t.registrar.ID(),
	}, nil
}

var errUnused = errors.New("") // reserved
var _ = errUnused
