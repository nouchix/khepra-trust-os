// Package enforce is the ASAF Enforcement Plane: the decision authority that sits
// between an autonomous agent and the systems it may affect.
//
// It answers the question observability platforms cannot:
//
//	"The agent just violated policy. What actually stops it?"
//
// ── The distinction that keeps this claim honest ──────────────────────────────
//
// Security architecture separates two roles, and conflating them is how vendors
// overclaim "enforcement":
//
//	PDP (Policy Decision Point) — decides what is permitted.   ← THIS PACKAGE
//	PEP (Policy Enforcement Point) — makes the decision stick.  ← the interposer
//
// This package is the PDP. It is real, deterministic, and testable offline. But a
// decision only becomes enforcement when a PEP is *in the agent's path*. KHEPRA
// has three genuine interposition points:
//
//  1. MCP gateway      — tool calls traverse it, so Deny actually blocks the call.
//  2. ASAF daemon      — holds privileged execution; a denied ChangeRequest cannot run.
//  3. Credential broker — withholding a capability token prevents the downstream call.
//
// Where KHEPRA is NOT in the path (an agent on an unmanaged host with its own
// network route and its own credentials), discovery can *find* it and this engine
// can *rule* on it, but nothing here blocks it. Discovery is not interception.
// Say that plainly to customers; it is also the reason interposition is the sale.
//
// IP: SecRed Knowledge Inc. / SOUHIMBOU DOH KONE LLC — USPTO #73565085
package enforce

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"time"
)

// ── Containment posture: adaptive authority, not a binary kill switch ─────────

// Posture is an agent's current authority level. Containment is graduated: an
// organization rarely wants to permanently disable an agent, it wants to reduce
// the agent's authority in proportion to observed risk.
type Posture string

const (
	// PostureNormal — full granted authority.
	PostureNormal Posture = "normal"
	// PostureElevated — risk signals present; state-changing and egress actions
	// require human approval, reads still flow.
	PostureElevated Posture = "elevated"
	// PostureRestricted — read-only. No writes, no egress, no privileged tools.
	PostureRestricted Posture = "restricted"
	// PostureQuarantined — session isolated. Nothing executes; forensic state preserved.
	PostureQuarantined Posture = "quarantined"
	// PostureLocked — capability tokens invalidated. Requires an operator to reinstate.
	PostureLocked Posture = "locked"
)

// rank orders postures so escalation is monotonic — containment never silently
// loosens as a side effect of a later rule.
func (p Posture) rank() int {
	switch p {
	case PostureNormal:
		return 0
	case PostureElevated:
		return 1
	case PostureRestricted:
		return 2
	case PostureQuarantined:
		return 3
	case PostureLocked:
		return 4
	}
	return 0
}

func maxPosture(a, b Posture) Posture {
	if b.rank() > a.rank() {
		return b
	}
	return a
}

// ── Decisions ────────────────────────────────────────────────────────────────

// Decision is the enforcement ruling for one requested action.
type Decision string

const (
	Allow           Decision = "allow"
	Constrain       Decision = "constrain"        // permitted, with the action narrowed
	RequireApproval Decision = "require_approval" // held pending a human
	Deny            Decision = "deny"             // refused
	Quarantine      Decision = "quarantine"       // refused + session isolated
	Lock            Decision = "lock"             // refused + credentials invalidated
)

// Blocking reports whether the ruling prevents execution.
func (d Decision) Blocking() bool {
	switch d {
	case Deny, Quarantine, Lock, RequireApproval:
		return true
	}
	return false
}

// Rule IDs, so a ruling cites the control that fired instead of "policy violation."
const (
	RuleUnknownAgent      = "ENF-1 unidentified-agent"
	RuleToolNotGranted    = "ENF-2 tool-not-granted"
	RuleCapabilityMissing = "ENF-3 capability-not-granted"
	RuleEgressNotAllowed  = "ENF-4 egress-destination-not-allowlisted"
	RuleClassification    = "ENF-5 data-classification-exceeded"
	RulePostureRestricted = "ENF-6 blocked-by-containment-posture"
	RuleInjection         = "ENF-7 prompt-injection-indicator"
	RuleDriftRate         = "ENF-8 behavioral-drift"
	RuleApprovalRequired  = "ENF-9 human-approval-required"
)

// ── Inputs ───────────────────────────────────────────────────────────────────

// Sensitivity ranks data classes so "may this agent touch this data?" is decidable.
type Sensitivity int

const (
	Public Sensitivity = iota
	Internal
	Sensitive
	Regulated // CUI / PHI / ITAR
)

func ParseSensitivity(s string) Sensitivity {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "regulated", "cui", "phi", "itar":
		return Regulated
	case "sensitive":
		return Sensitive
	case "internal":
		return Internal
	default:
		return Public
	}
}

func (s Sensitivity) String() string {
	return [...]string{"public", "internal", "sensitive", "regulated"}[s]
}

// Grant is what an agent has been authorized to do. Absence of a grant is denial
// — the engine never infers authority.
type Grant struct {
	AgentID           string   `json:"agent_id"`
	Tools             []string `json:"tools"`               // tools the agent may invoke
	Capabilities      []string `json:"capabilities"`        // e.g. "read", "write", "exec"
	EgressAllowlist   []string `json:"egress_allowlist"`    // permitted external destinations
	MaxSensitivity    string   `json:"max_sensitivity"`     // highest data class it may touch
	ApprovalForWrites bool     `json:"approval_for_writes"` // human gate on state change
}

// ActionRequest is one thing an agent is trying to do, right now.
type ActionRequest struct {
	AgentID       string `json:"agent_id"`
	Tool          string `json:"tool"`
	Capability    string `json:"capability"`     // read | write | exec | network
	Target        string `json:"target"`         // resource or destination
	Sensitivity   string `json:"sensitivity"`    // class of data involved
	EgressTo      string `json:"egress_to"`      // non-empty ⇒ leaves the boundary
	StateChanging bool   `json:"state_changing"` // mutates a system
}

// Signals are behavioral observations from the runtime — the inputs that make
// containment adaptive rather than static.
type Signals struct {
	// InjectionIndicators: markers that the agent's instructions were influenced
	// by untrusted content (the prompt-injection case).
	InjectionIndicators []string `json:"injection_indicators"`
	// ToolCallsPerMin observed vs BaselinePerMin establishes drift.
	ToolCallsPerMin int `json:"tool_calls_per_min"`
	BaselinePerMin  int `json:"baseline_per_min"`
	// PriorViolations in this session.
	PriorViolations int `json:"prior_violations"`
}

// driftFactor returns how far above baseline the agent is operating.
func (s Signals) driftFactor() float64 {
	if s.BaselinePerMin <= 0 {
		return 0
	}
	return float64(s.ToolCallsPerMin) / float64(s.BaselinePerMin)
}

// ── Output ───────────────────────────────────────────────────────────────────

// Ruling is the enforcement decision, shaped as evidence.
type Ruling struct {
	AgentID     string   `json:"agent_id"`
	Tool        string   `json:"tool"`
	Target      string   `json:"target"`
	Decision    Decision `json:"decision"`
	PostureIn   Posture  `json:"posture_in"`
	PostureOut  Posture  `json:"posture_out"`
	Rules       []string `json:"rules,omitempty"`
	Rationale   string   `json:"rationale"`
	Constraints []string `json:"constraints,omitempty"` // applied when Decision==Constrain
	Enforceable bool     `json:"enforceable"`           // true only when a PEP is in path
	EnforcedBy  string   `json:"enforced_by,omitempty"` // which interposition point
	DecidedAt   string   `json:"decided_at"`
}

// EvidencePayload is the stable, timestamp-free form that gets signed and anchored.
func (r Ruling) EvidencePayload() []byte {
	rules := append([]string(nil), r.Rules...)
	sort.Strings(rules)
	b, _ := json.Marshal(struct {
		AgentID, Tool, Target, Rationale, EnforcedBy string
		Decision                                     Decision
		PostureIn, PostureOut                        Posture
		Rules                                        []string
		Enforceable                                  bool
	}{r.AgentID, r.Tool, r.Target, r.Rationale, r.EnforcedBy,
		r.Decision, r.PostureIn, r.PostureOut, rules, r.Enforceable})
	return b
}

// Hash content-addresses the ruling for the evidence ledger.
func (r Ruling) Hash() string {
	sum := sha256.Sum256(r.EvidencePayload())
	return hex.EncodeToString(sum[:])
}

// ── The engine ───────────────────────────────────────────────────────────────

// Interposition names where this engine's decisions are actually enforceable.
// Empty means advisory only — and the Ruling says so, rather than implying control.
type Interposition string

const (
	NoInterposition     Interposition = ""
	ViaMCPGateway       Interposition = "mcp-gateway"       // tool calls traverse KHEPRA
	ViaASAFDaemon       Interposition = "asaf-daemon"       // privileged execution held by KHEPRA
	ViaCredentialBroker Interposition = "credential-broker" // capability tokens issued by KHEPRA
)

// Engine is the Policy Decision Point.
type Engine struct {
	// Interposer declares where rulings are enforceable. Set it to the real
	// integration point; leave empty and every Ruling is honestly marked advisory.
	Interposer Interposition
	// DriftThreshold is the multiple of baseline tool-call rate that counts as
	// behavioral drift. Default 3.0.
	DriftThreshold float64
}

// Decide evaluates one action against the agent's grant, its current containment
// posture, and live behavioral signals — returning a ruling and the (possibly
// escalated) posture.
//
// #CONTROL: AC-3 (access enforcement) — deny-by-default action authorization.
// #CONTROL: AC-4 (information flow) — egress destinations must be allowlisted.
// #CONTROL: SI-4 (monitoring) — drift and injection signals escalate containment.
// #CONTROL: AU-2 (auditable events) — every ruling is evidence, allow or deny.
func (e *Engine) Decide(req ActionRequest, grant Grant, posture Posture, sig Signals) Ruling {
	if e.DriftThreshold <= 0 {
		e.DriftThreshold = 3.0
	}
	if posture == "" {
		posture = PostureNormal
	}

	r := Ruling{
		AgentID:     req.AgentID,
		Tool:        req.Tool,
		Target:      req.Target,
		PostureIn:   posture,
		PostureOut:  posture,
		Enforceable: e.Interposer != NoInterposition,
		EnforcedBy:  string(e.Interposer),
		DecidedAt:   time.Now().UTC().Format(time.RFC3339),
	}

	var rules []string
	var reasons []string
	worst := Allow
	escalate := posture

	// ── Identity: an unidentified agent gets nothing. ────────────────────────
	if req.AgentID == "" || grant.AgentID == "" || req.AgentID != grant.AgentID {
		r.Decision = Deny
		r.Rules = []string{RuleUnknownAgent}
		r.Rationale = "agent identity is absent or does not match the presented grant"
		r.PostureOut = maxPosture(posture, PostureQuarantined)
		return r
	}

	// ── Containment posture gates first: a contained agent cannot act. ───────
	switch posture {
	case PostureLocked, PostureQuarantined:
		r.Decision = Deny
		r.Rules = []string{RulePostureRestricted}
		r.Rationale = fmt.Sprintf("agent is %s; no actions execute until an operator reinstates authority", posture)
		return r
	case PostureRestricted:
		if req.StateChanging || req.Capability == "write" || req.Capability == "exec" || req.EgressTo != "" {
			rules = append(rules, RulePostureRestricted)
			reasons = append(reasons, "agent is restricted to read-only by containment posture")
			worst = escalateDecision(worst, Deny)
		}
	case PostureElevated:
		if req.StateChanging || req.EgressTo != "" {
			rules = append(rules, RuleApprovalRequired)
			reasons = append(reasons, "containment posture is elevated; state-changing and egress actions need human approval")
			worst = escalateDecision(worst, RequireApproval)
		}
	}

	// ── Injection indicators: treat as active compromise. ────────────────────
	if len(sig.InjectionIndicators) > 0 {
		rules = append(rules, RuleInjection)
		reasons = append(reasons, "prompt-injection indicators present: "+strings.Join(sig.InjectionIndicators, ", "))
		// Injection + an attempt to leave the boundary is the exfiltration pattern.
		if req.EgressTo != "" || ParseSensitivity(req.Sensitivity) >= Sensitive {
			worst = escalateDecision(worst, Quarantine)
			escalate = maxPosture(escalate, PostureQuarantined)
			reasons = append(reasons, "injection combined with data egress is the exfiltration pattern — session isolated")
		} else {
			worst = escalateDecision(worst, RequireApproval)
			escalate = maxPosture(escalate, PostureElevated)
		}
	}

	// ── Grant checks: deny-by-default. ──────────────────────────────────────
	if !contains(grant.Tools, req.Tool) {
		rules = append(rules, RuleToolNotGranted)
		reasons = append(reasons, fmt.Sprintf("tool %q is not in the agent's granted tool set", req.Tool))
		worst = escalateDecision(worst, Deny)
	}
	if req.Capability != "" && !contains(grant.Capabilities, req.Capability) {
		rules = append(rules, RuleCapabilityMissing)
		reasons = append(reasons, fmt.Sprintf("capability %q was not granted", req.Capability))
		worst = escalateDecision(worst, Deny)
	}
	if req.EgressTo != "" && !matchesAllowlist(grant.EgressAllowlist, req.EgressTo) {
		rules = append(rules, RuleEgressNotAllowed)
		reasons = append(reasons, fmt.Sprintf("egress to %q is not allowlisted", req.EgressTo))
		worst = escalateDecision(worst, Deny)
	}
	if ParseSensitivity(req.Sensitivity) > ParseSensitivity(grant.MaxSensitivity) {
		rules = append(rules, RuleClassification)
		reasons = append(reasons, fmt.Sprintf("action touches %s data; agent is limited to %s",
			ParseSensitivity(req.Sensitivity), ParseSensitivity(grant.MaxSensitivity)))
		worst = escalateDecision(worst, Deny)
	}

	// ── Behavioral drift: escalate containment, don't necessarily block. ────
	if f := sig.driftFactor(); f >= e.DriftThreshold {
		rules = append(rules, RuleDriftRate)
		reasons = append(reasons, fmt.Sprintf("tool-call rate is %.1fx baseline", f))
		escalate = maxPosture(escalate, PostureElevated)
		if worst == Allow && (req.StateChanging || req.EgressTo != "") {
			worst = escalateDecision(worst, RequireApproval)
		}
	}

	// ── Repeat violations ratchet containment. ──────────────────────────────
	if sig.PriorViolations >= 3 {
		escalate = maxPosture(escalate, PostureRestricted)
		reasons = append(reasons, fmt.Sprintf("%d prior violations this session — authority reduced", sig.PriorViolations))
	}

	// ── Standing approval gate on writes. ───────────────────────────────────
	if grant.ApprovalForWrites && (req.StateChanging || req.Capability == "write") && worst == Allow {
		rules = append(rules, RuleApprovalRequired)
		reasons = append(reasons, "grant requires human approval for state-changing actions")
		worst = escalateDecision(worst, RequireApproval)
	}

	// A denial is itself a signal: escalate posture so the next request is
	// evaluated against a tightened agent, not a fresh one.
	if worst == Deny {
		escalate = maxPosture(escalate, PostureElevated)
	}
	if worst == Quarantine {
		escalate = maxPosture(escalate, PostureQuarantined)
	}

	r.Decision = worst
	r.Rules = rules
	r.PostureOut = escalate
	if worst == Allow {
		r.Rationale = fmt.Sprintf("%s on %s is within the agent's grant", req.Tool, req.Target)
	} else {
		r.Rationale = strings.Join(reasons, "; ")
	}
	return r
}

// escalateDecision keeps the most restrictive decision seen.
func escalateDecision(cur, next Decision) Decision {
	order := map[Decision]int{Allow: 0, Constrain: 1, RequireApproval: 2, Deny: 3, Quarantine: 4, Lock: 5}
	if order[next] > order[cur] {
		return next
	}
	return cur
}

func contains(set []string, v string) bool {
	for _, s := range set {
		if strings.EqualFold(strings.TrimSpace(s), strings.TrimSpace(v)) {
			return true
		}
	}
	return false
}

// matchesAllowlist supports exact hosts and a leading "*." wildcard.
func matchesAllowlist(allow []string, dest string) bool {
	d := strings.ToLower(strings.TrimSpace(dest))
	for _, a := range allow {
		a = strings.ToLower(strings.TrimSpace(a))
		if a == "" {
			continue
		}
		if strings.HasPrefix(a, "*.") {
			if strings.HasSuffix(d, a[1:]) {
				return true
			}
			continue
		}
		if d == a {
			return true
		}
	}
	return false
}
