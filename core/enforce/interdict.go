package enforce

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

// ── Interdiction: the Policy Enforcement Point ────────────────────────────────
//
// enforce.Engine DECIDES. The Interdictor MAKES IT STICK.
//
// This is the other half of the enforcement claim, and the only reason a Deny is
// worth anything: the Interdictor is positioned so the agent's action physically
// cannot proceed unless it authorizes it. The action is passed in as a closure —
// the Interdictor either invokes it or it does not. There is no path around it.
//
//	agent → Interdictor.Guard(req, action) → [Engine decides] → action() or refusal
//
// Three genuine interposition surfaces are implemented here:
//
//	Guard      — wraps any tool/action call (the MCP gateway integration point).
//	Transport  — an http.RoundTripper that refuses non-allowlisted egress. An
//	             agent using this transport cannot exfiltrate: the dial never happens.
//	Approvals  — holds require_approval actions until a human rules, so the
//	             action is deferred rather than silently dropped.
//
// Containment is stateful: posture is persisted per agent, so a quarantine
// survives the current call and constrains every subsequent one. Without state,
// "quarantine" would be a log line; with it, the agent stays contained.
//
// #CONTROL: AC-3 (access enforcement) — the enforcement point, not just the decision.
// #CONTROL: AC-4 (information flow enforcement) — egress interdiction at the transport.
// #CONTROL: AU-2 — every interdiction emits evidence, permitted or refused.

// Drift-detection guards. Behavioral drift is only claimed once there is enough
// observation to support it (see Sessions.Signals).
const (
	minDriftWindow  = 10 * time.Second
	minDriftSamples = 10
)

// ErrInterdicted is returned when an action was refused by policy. Callers should
// treat it as terminal for that action.
type ErrInterdicted struct {
	Ruling Ruling
}

func (e *ErrInterdicted) Error() string {
	return fmt.Sprintf("interdicted: %s (%s) — %s",
		e.Ruling.Decision, strings.Join(e.Ruling.Rules, ", "), e.Ruling.Rationale)
}

// Interdicted reports whether an error came from policy interdiction, and returns
// the ruling that caused it.
func Interdicted(err error) (Ruling, bool) {
	var ei *ErrInterdicted
	if errors.As(err, &ei) {
		return ei.Ruling, true
	}
	return Ruling{}, false
}

// EvidenceSink receives every ruling. Wire it to the signed DAG in production; a
// nil sink is allowed (decisions still enforce, they are just not persisted —
// which the deployment profile should forbid).
type EvidenceSink interface {
	Record(ctx context.Context, r Ruling) error
}

// SinkFunc adapts a function to EvidenceSink.
type SinkFunc func(ctx context.Context, r Ruling) error

func (f SinkFunc) Record(ctx context.Context, r Ruling) error { return f(ctx, r) }

// ── Session state: containment that persists ─────────────────────────────────

// Sessions tracks per-agent containment posture and violation counts so that
// containment is durable rather than per-call.
type Sessions struct {
	mu    sync.RWMutex
	state map[string]*sessionState
}

type sessionState struct {
	Posture    Posture
	Violations int
	Calls      int
	WindowFrom time.Time
}

func NewSessions() *Sessions {
	return &Sessions{state: make(map[string]*sessionState)}
}

func (s *Sessions) get(agentID string) *sessionState {
	s.mu.Lock()
	defer s.mu.Unlock()
	st, ok := s.state[agentID]
	if !ok {
		st = &sessionState{Posture: PostureNormal, WindowFrom: time.Now()}
		s.state[agentID] = st
	}
	return st
}

// Posture returns an agent's current containment posture.
func (s *Sessions) Posture(agentID string) Posture {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if st, ok := s.state[agentID]; ok {
		return st.Posture
	}
	return PostureNormal
}

// Reinstate restores an agent to normal authority. This is deliberately explicit:
// containment must be lifted by an operator decision, never automatically.
func (s *Sessions) Reinstate(agentID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if st, ok := s.state[agentID]; ok {
		st.Posture = PostureNormal
		st.Violations = 0
	}
}

// Signals derives live behavioral signals for an agent, merging caller-supplied
// indicators (e.g. injection detection) with observed call-rate state.
func (s *Sessions) Signals(agentID string, injection []string, baselinePerMin int) Signals {
	st := s.get(agentID)
	s.mu.RLock()
	defer s.mu.RUnlock()
	// Drift requires a real observation window. Computing a per-minute rate from
	// a handful of calls over a few microseconds produces absurd multiples and
	// would flag every fresh session as catastrophic drift — a false positive that
	// would destroy trust in the control. Report zero drift until we have enough
	// signal to make an honest claim.
	elapsed := time.Since(st.WindowFrom).Minutes()
	rate := 0
	if elapsed >= minDriftWindow.Minutes() && st.Calls >= minDriftSamples {
		rate = int(float64(st.Calls) / elapsed)
	}
	return Signals{
		InjectionIndicators: injection,
		ToolCallsPerMin:     rate,
		BaselinePerMin:      baselinePerMin,
		PriorViolations:     st.Violations,
	}
}

// ── The Interdictor ──────────────────────────────────────────────────────────

// Interdictor is the Policy Enforcement Point. It owns the decision engine, the
// containment state, the approval queue, and the evidence sink.
type Interdictor struct {
	Engine   *Engine
	Sessions *Sessions
	Sink     EvidenceSink
	// Grants resolves an agent's authorization. Required: an agent with no
	// resolvable grant is denied (deny-by-default).
	Grants func(agentID string) (Grant, bool)
	// Approvals holds actions awaiting a human ruling. Optional; when nil, a
	// require_approval decision is refused rather than queued.
	Approvals *ApprovalQueue
}

// NewInterdictor builds a PEP for a given interposition point.
func NewInterdictor(at Interposition, grants func(string) (Grant, bool), sink EvidenceSink) *Interdictor {
	return &Interdictor{
		Engine:    &Engine{Interposer: at},
		Sessions:  NewSessions(),
		Sink:      sink,
		Grants:    grants,
		Approvals: NewApprovalQueue(),
	}
}

// Guard is the interdiction primitive: it evaluates req and invokes action ONLY
// if policy permits. This is what makes a Deny real — the action closure is never
// called when the ruling blocks.
//
// Returns *ErrInterdicted when refused. The ruling is always recorded to the
// evidence sink, whether the action ran or not.
func (in *Interdictor) Guard(ctx context.Context, req ActionRequest, injection []string, action func(context.Context) error) (Ruling, error) {
	if in.Engine == nil {
		in.Engine = &Engine{}
	}
	if in.Sessions == nil {
		in.Sessions = NewSessions()
	}

	// Resolve authority. No grant ⇒ no authority.
	var grant Grant
	if in.Grants != nil {
		if g, ok := in.Grants(req.AgentID); ok {
			grant = g
		}
	}

	st := in.Sessions.get(req.AgentID)
	in.Sessions.mu.Lock()
	st.Calls++
	in.Sessions.mu.Unlock()

	sig := in.Sessions.Signals(req.AgentID, injection, 60)
	posture := in.Sessions.Posture(req.AgentID)

	ruling := in.Engine.Decide(req, grant, posture, sig)

	// Persist containment BEFORE acting, so an escalation binds this call and all
	// subsequent ones even if the action panics or the process is interrupted.
	in.Sessions.mu.Lock()
	st.Posture = maxPosture(st.Posture, ruling.PostureOut)
	if ruling.Decision.Blocking() {
		st.Violations++
	}
	in.Sessions.mu.Unlock()

	in.record(ctx, ruling)

	// Approval path: defer rather than drop.
	if ruling.Decision == RequireApproval {
		if in.Approvals != nil {
			in.Approvals.Enqueue(PendingAction{
				Ruling:   ruling,
				Request:  req,
				QueuedAt: time.Now().UTC(),
				action:   action,
			})
		}
		return ruling, &ErrInterdicted{Ruling: ruling}
	}

	if ruling.Decision.Blocking() {
		return ruling, &ErrInterdicted{Ruling: ruling}
	}

	// Permitted — and only now does the action exist.
	if action != nil {
		if err := action(ctx); err != nil {
			return ruling, err
		}
	}
	return ruling, nil
}

func (in *Interdictor) record(ctx context.Context, r Ruling) {
	if in.Sink == nil {
		return
	}
	_ = in.Sink.Record(ctx, r)
}

// ── Egress interdiction at the transport ─────────────────────────────────────

// Transport is an http.RoundTripper that interdicts outbound requests. An agent
// configured with this transport cannot reach a non-allowlisted destination: the
// request is refused before any connection is made, so exfiltration fails at the
// network boundary rather than being noticed afterward.
//
// This is the most literal form of interdiction in the package — the dial never
// happens.
type Transport struct {
	// Base is the underlying transport. Defaults to http.DefaultTransport.
	Base http.RoundTripper
	// In is the interdictor that rules on each request.
	In *Interdictor
	// AgentID attributes outbound requests to an agent.
	AgentID string
	// Sensitivity classifies the data this agent handles, for the ceiling check.
	Sensitivity string
	// Injection carries live injection indicators, if the runtime detected any.
	Injection []string
}

func (t *Transport) RoundTrip(r *http.Request) (*http.Response, error) {
	base := t.Base
	if base == nil {
		base = http.DefaultTransport
	}
	if t.In == nil {
		return base.RoundTrip(r) // no interdictor wired: pass through, honestly unguarded
	}

	host := r.URL.Hostname()
	if h, _, err := net.SplitHostPort(r.URL.Host); err == nil && h != "" {
		host = h
	}

	req := ActionRequest{
		AgentID:       t.AgentID,
		Tool:          "http",
		Capability:    "network",
		Target:        r.URL.String(),
		Sensitivity:   t.Sensitivity,
		EgressTo:      host,
		StateChanging: r.Method != http.MethodGet && r.Method != http.MethodHead,
	}

	var resp *http.Response
	_, err := t.In.Guard(r.Context(), req, t.Injection, func(ctx context.Context) error {
		var e error
		resp, e = base.RoundTrip(r)
		return e
	})
	if err != nil {
		return nil, err // includes *ErrInterdicted — the exfiltration simply fails
	}
	return resp, nil
}

// ── Approval queue: hold, don't drop ─────────────────────────────────────────

// PendingAction is an action held awaiting human approval.
type PendingAction struct {
	Ruling   Ruling        `json:"ruling"`
	Request  ActionRequest `json:"request"`
	QueuedAt time.Time     `json:"queued_at"`

	action func(context.Context) error
}

// ApprovalQueue holds require_approval actions so a human can release or refuse
// them. Holding is materially different from dropping: the agent's intent is
// preserved for review, and the approval itself becomes evidence.
type ApprovalQueue struct {
	mu      sync.Mutex
	pending map[string]PendingAction
}

func NewApprovalQueue() *ApprovalQueue {
	return &ApprovalQueue{pending: make(map[string]PendingAction)}
}

// Enqueue holds an action, keyed by its ruling hash.
func (q *ApprovalQueue) Enqueue(p PendingAction) string {
	q.mu.Lock()
	defer q.mu.Unlock()
	id := p.Ruling.Hash()
	q.pending[id] = p
	return id
}

// Pending lists held actions.
func (q *ApprovalQueue) Pending() []PendingAction {
	q.mu.Lock()
	defer q.mu.Unlock()
	out := make([]PendingAction, 0, len(q.pending))
	for _, p := range q.pending {
		out = append(out, p)
	}
	return out
}

// Approve releases a held action, executing it under the named approver. The
// approver identity is returned in the ruling so the evidence records WHO
// authorized it — the human-in-the-loop is itself attested.
func (q *ApprovalQueue) Approve(ctx context.Context, id, approver string, sink EvidenceSink) (Ruling, error) {
	// Validate BEFORE dequeuing. Removing the held action first would let an
	// invalid approval (e.g. a missing approver identity) silently discard a
	// pending action — a dequeue-by-bad-input flaw that would drop the very
	// actions a human still needs to rule on.
	if approver == "" {
		return Ruling{}, errors.New("approval requires an approver identity")
	}
	q.mu.Lock()
	p, ok := q.pending[id]
	if ok {
		delete(q.pending, id)
	}
	q.mu.Unlock()
	if !ok {
		return Ruling{}, fmt.Errorf("no pending action %s", id)
	}

	r := p.Ruling
	r.Decision = Allow
	r.Rationale = fmt.Sprintf("released by approver %q (was: %s)", approver, p.Ruling.Rationale)
	r.DecidedAt = time.Now().UTC().Format(time.RFC3339)
	if sink != nil {
		_ = sink.Record(ctx, r)
	}

	if p.action != nil {
		if err := p.action(ctx); err != nil {
			return r, err
		}
	}
	return r, nil
}

// Refuse discards a held action under the named approver, recording the refusal.
func (q *ApprovalQueue) Refuse(ctx context.Context, id, approver string, sink EvidenceSink) (Ruling, error) {
	q.mu.Lock()
	p, ok := q.pending[id]
	if ok {
		delete(q.pending, id)
	}
	q.mu.Unlock()
	if !ok {
		return Ruling{}, fmt.Errorf("no pending action %s", id)
	}
	r := p.Ruling
	r.Decision = Deny
	r.Rationale = fmt.Sprintf("refused by approver %q", approver)
	r.DecidedAt = time.Now().UTC().Format(time.RFC3339)
	if sink != nil {
		_ = sink.Record(ctx, r)
	}
	return r, nil
}
