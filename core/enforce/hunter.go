package enforce

import (
	"context"
	"fmt"
	"strings"
	"time"
)

// ── The hunter's trigger: turning KASA's findings into real containment ───────
//
// KASA (Khepra Autonomous Security Agent) is the hunter — a BabyAGI-style
// autonomous loop with ML tampering detection, entropy analysis, vulnerability
// hunting, pentest, and forensic collection. It decides a component is
// compromised and *wants* to quarantine it, revoke its credentials, and block its
// network access.
//
// Today KASA cannot actually do any of that. Its own source says so:
//
//	// These functions log quarantine/block intents to the audit trail.
//	// Wire to your IAM provider and network controller in your deployment:
//	func (kca *KASACryptoAgent) revokeCredentials(componentID string)
//	func (kca *KASACryptoAgent) blockNetworkAccess(componentID string)
//
// It is a spotter with no trigger. This file is the trigger: a ThreatSignal from
// KASA lands in the Interdictor's session state, which Guard() and Transport
// already consult on every action — so containment becomes effective immediately
// and for every subsequent call.
//
// ── Rules of engagement (why KASA is NOT wired to the privileged daemon) ──────
//
// Two deliberate constraints, both security-critical:
//
//  1. KASA never calls the privileged daemon. It emits signals into this plane,
//     and the plane applies its own deny-by-default gates. If KASA could command
//     privileged execution directly, a prompt injection into the autonomous loop
//     would be root on the host.
//
//  2. KASA's authority is CAPPED. Its detection is entropy/ML-based and therefore
//     produces false positives; unbounded autonomous authority would turn one bad
//     anomaly score into a self-inflicted outage (and hand an attacker a
//     denial-of-service primitive: poison the input, get the fleet locked out).
//     So the hunter may tighten containment on its own only up to a ceiling.
//     Beyond it, a human rules.
//
// #CONTROL: AC-3 — hunter findings are authorized through the same PEP as any actor.
// #CONTROL: SI-4 — autonomous detection escalates containment.
// #CONTROL: AC-6 (least privilege) — the hunter's own authority is bounded.

// ThreatLevel mirrors the hunter's assessment severity.
type ThreatLevel string

const (
	ThreatLow      ThreatLevel = "low"
	ThreatMedium   ThreatLevel = "medium"
	ThreatHigh     ThreatLevel = "high"
	ThreatCritical ThreatLevel = "critical"
)

// ThreatSignal is one finding reported by the hunter (KASA) about a subject.
type ThreatSignal struct {
	// Subject is the agent or component the finding is about.
	Subject string `json:"subject"`
	// Reporter identifies the hunter instance, so evidence records who called it.
	Reporter string `json:"reporter"`
	// Level is the hunter's severity assessment.
	Level ThreatLevel `json:"level"`
	// AnomalyScore is the raw detector score (0..1).
	AnomalyScore float64 `json:"anomaly_score"`
	// BehaviorFlags are the specific indicators observed.
	BehaviorFlags []string `json:"behavior_flags"`
	// Corroborated marks a finding confirmed by an independent source (a second
	// detector, a signed device attestation, a human report). Uncorroborated ML
	// findings are held to a lower authority ceiling — see Authority.
	Corroborated bool `json:"corroborated"`
	// Evidence is a hash or reference to the forensic snapshot backing the finding.
	Evidence string `json:"evidence,omitempty"`
	// ObservedAt is when the hunter made the finding.
	ObservedAt time.Time `json:"observed_at"`
}

// Hunter is what an autonomous detector implements to feed this plane. KASA
// satisfies it by adapting its TamperingReport into ThreatSignals.
//
// The interface lives here (dependency inversion) so `core` never imports the
// agent: the hunter can be replaced, run out-of-process, or disabled entirely
// without touching the enforcement plane.
type Hunter interface {
	// Name identifies the hunter for evidence attribution.
	Name() string
	// Poll returns any new findings since the last call. Non-blocking.
	Poll(ctx context.Context) ([]ThreatSignal, error)
}

// Authority caps how far a hunter may tighten containment on its own. This is the
// rules-of-engagement setting, and it is the difference between a precision
// instrument and a self-inflicted outage.
type Authority struct {
	// AutonomousCeiling is the most restrictive posture the hunter may impose
	// without human involvement. Default (zero value handled in Ingest):
	// PostureRestricted — read-only. Deliberately NOT quarantine.
	AutonomousCeiling Posture
	// CorroboratedCeiling applies when a finding is independently corroborated.
	// Default: PostureQuarantined.
	CorroboratedCeiling Posture
	// MinScoreForRestrict is the anomaly score required to reduce to read-only.
	// Default 0.7 — below it, a finding raises posture only to elevated.
	MinScoreForRestrict float64
}

func (a Authority) withDefaults() Authority {
	if a.AutonomousCeiling == "" {
		a.AutonomousCeiling = PostureRestricted
	}
	if a.CorroboratedCeiling == "" {
		a.CorroboratedCeiling = PostureQuarantined
	}
	if a.MinScoreForRestrict <= 0 {
		a.MinScoreForRestrict = 0.7
	}
	return a
}

// Containment is the outcome of ingesting a hunter finding.
type Containment struct {
	Subject      string      `json:"subject"`
	Reporter     string      `json:"reporter"`
	Level        ThreatLevel `json:"level"`
	PostureIn    Posture     `json:"posture_in"`
	PostureOut   Posture     `json:"posture_out"`
	Capped       bool        `json:"capped"`                  // the hunter wanted more authority than it has
	WantedMore   Posture     `json:"wanted_more,omitempty"`   // what it would have imposed
	EscalatedFor string      `json:"escalated_for,omitempty"` // what now needs a human
	Rationale    string      `json:"rationale"`
	Effective    bool        `json:"effective"` // true only when a PEP is in path
	AppliedAt    string      `json:"applied_at"`
}

// desiredPosture maps a finding to the containment the hunter is asking for,
// before any authority cap is applied.
func desiredPosture(s ThreatSignal, a Authority) Posture {
	switch s.Level {
	case ThreatCritical:
		return PostureQuarantined
	case ThreatHigh:
		if s.AnomalyScore >= a.MinScoreForRestrict {
			return PostureRestricted
		}
		return PostureElevated
	case ThreatMedium:
		return PostureElevated
	default:
		return PostureNormal
	}
}

// Ingest applies a hunter finding to the subject's containment state — this is
// the trigger being pulled. The resulting posture is what Guard() and Transport
// enforce on every subsequent action, so the effect is immediate and durable.
//
// Authority is capped per the rules of engagement: when the hunter asks for more
// containment than it is permitted to impose alone, the finding is applied up to
// its ceiling and the remainder is flagged for a human (Containment.EscalatedFor).
// Nothing is silently dropped and nothing is silently escalated.
func (in *Interdictor) Ingest(ctx context.Context, s ThreatSignal, auth Authority) Containment {
	auth = auth.withDefaults()
	if in.Sessions == nil {
		in.Sessions = NewSessions()
	}
	if s.ObservedAt.IsZero() {
		s.ObservedAt = time.Now().UTC()
	}

	current := in.Sessions.Posture(s.Subject)
	want := desiredPosture(s, auth)

	ceiling := auth.AutonomousCeiling
	if s.Corroborated {
		ceiling = auth.CorroboratedCeiling
	}

	// Apply up to the ceiling.
	applied := want
	capped := false
	if want.rank() > ceiling.rank() {
		applied = ceiling
		capped = true
	}

	out := maxPosture(current, applied)

	c := Containment{
		Subject:    s.Subject,
		Reporter:   s.Reporter,
		Level:      s.Level,
		PostureIn:  current,
		PostureOut: out,
		Capped:     capped,
		Effective:  in.Engine != nil && in.Engine.Interposer != NoInterposition,
		AppliedAt:  time.Now().UTC().Format(time.RFC3339),
	}

	reasons := []string{fmt.Sprintf("hunter %q reported %s (score %.2f)", s.Reporter, s.Level, s.AnomalyScore)}
	if len(s.BehaviorFlags) > 0 {
		reasons = append(reasons, "indicators: "+strings.Join(s.BehaviorFlags, ", "))
	}
	if !s.Corroborated {
		reasons = append(reasons, "finding is uncorroborated — hunter authority limited to "+string(ceiling))
	}
	if capped {
		c.WantedMore = want
		c.EscalatedFor = fmt.Sprintf("hunter requested %s; requires human authorization", want)
		reasons = append(reasons, c.EscalatedFor)
	}
	c.Rationale = strings.Join(reasons, "; ")

	// Persist containment — this is what makes the finding bite.
	if out != current {
		st := in.Sessions.get(s.Subject)
		in.Sessions.mu.Lock()
		st.Posture = out
		in.Sessions.mu.Unlock()
	}

	// Record as evidence, shaped as a Ruling so hunter-driven containment sits in
	// the same ledger as every other enforcement decision.
	in.record(ctx, Ruling{
		AgentID:     s.Subject,
		Tool:        "hunter:" + s.Reporter,
		Target:      s.Evidence,
		Decision:    postureToDecision(out),
		PostureIn:   current,
		PostureOut:  out,
		Rules:       []string{RuleDriftRate},
		Rationale:   c.Rationale,
		Enforceable: c.Effective,
		EnforcedBy:  string(in.Engine.Interposer),
		DecidedAt:   c.AppliedAt,
	})

	return c
}

func postureToDecision(p Posture) Decision {
	switch p {
	case PostureQuarantined:
		return Quarantine
	case PostureLocked:
		return Lock
	case PostureRestricted, PostureElevated:
		return Constrain
	default:
		return Allow
	}
}

// RunHunter polls a hunter and ingests its findings until ctx is cancelled. This
// is the spotter/shooter loop: the hunter observes continuously, and every finding
// lands as enforceable containment rather than an audit-log entry.
func (in *Interdictor) RunHunter(ctx context.Context, h Hunter, auth Authority, interval time.Duration) error {
	if interval <= 0 {
		interval = 30 * time.Second
	}
	t := time.NewTicker(interval)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-t.C:
			signals, err := h.Poll(ctx)
			if err != nil {
				continue // a hunter fault must never take down the enforcement plane
			}
			for _, s := range signals {
				if s.Reporter == "" {
					s.Reporter = h.Name()
				}
				in.Ingest(ctx, s, auth)
			}
		}
	}
}
