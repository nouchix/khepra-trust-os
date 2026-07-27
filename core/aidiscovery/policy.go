package aidiscovery

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"time"
)

// ── AI Governance Policy evaluation ──────────────────────────────────────────
//
// What this IS: a declarative evaluator that takes a customer's AI governance
// policy as data and decides, for every discovered AI workload, whether it is
// permitted — producing per-item verdicts with the rule that fired. The verdicts
// are deterministic and hashable, so an attestation can prove *which policy
// version* a judgment was made under.
//
// What this is NOT (state it plainly to customers): a general-purpose policy
// language. It does not evaluate arbitrary logic like OPA/Rego. It covers the
// rules an AI-governance policy actually contains — approved tools, forbidden
// categories, where AI may run, and whether exposed endpoints must be
// authenticated. Anything beyond that shape is a gap, not a silent pass.

// Rule identifiers, so a verdict cites the specific control that fired rather
// than a vague "policy violation."
const (
	RuleUnapprovedService  = "AI-GOV-1 unapproved-service"
	RuleForbiddenCategory  = "AI-GOV-2 forbidden-category"
	RuleUnapprovedHost     = "AI-GOV-3 unapproved-host"
	RuleUnauthenticated    = "AI-GOV-4 unauthenticated-endpoint"
	RuleUnidentifiedListen = "AI-GOV-5 unidentified-listener"
)

// Policy is the customer-supplied AI governance policy, as data.
type Policy struct {
	// Name and Version identify the policy for attestation. A verdict is only
	// meaningful alongside the exact policy that produced it.
	Name    string `json:"name"`
	Version string `json:"version"`

	// ApprovedServices lists signature names permitted to run at all
	// (e.g. ["Ollama"]). Empty means "no AI service is pre-approved" — the
	// deny-by-default posture.
	ApprovedServices []string `json:"approved_services"`

	// ForbiddenCategories bans whole classes outright regardless of approval
	// (e.g. ["notebook"] to ban interactive code-execution surfaces).
	ForbiddenCategories []Category `json:"forbidden_categories"`

	// ApprovedHosts optionally restricts *where* AI may run. Empty means any host.
	ApprovedHosts []string `json:"approved_hosts"`

	// RequireAuthenticated: when true, an AI endpoint that answers an
	// unauthenticated discovery probe is a violation — the probe response itself
	// is the evidence that it is reachable without credentials.
	RequireAuthenticated bool `json:"require_authenticated"`

	// FlagUnidentified: when true, an open port that could not be identified is
	// reported for follow-up rather than ignored.
	FlagUnidentified bool `json:"flag_unidentified"`
}

// Hash pins the policy version into evidence, so an attestation proves which
// policy text a judgment was made under.
func (p Policy) Hash() string {
	norm := p
	norm.ApprovedServices = sortedLower(p.ApprovedServices)
	norm.ApprovedHosts = sortedLower(p.ApprovedHosts)
	cats := make([]string, 0, len(p.ForbiddenCategories))
	for _, c := range p.ForbiddenCategories {
		cats = append(cats, string(c))
	}
	sort.Strings(cats)
	payload := struct {
		Policy
		Cats []string `json:"cats"`
	}{norm, cats}
	b, _ := json.Marshal(payload)
	sum := sha256.Sum256(b)
	return hex.EncodeToString(sum[:])
}

func sortedLower(in []string) []string {
	out := make([]string, 0, len(in))
	for _, s := range in {
		out = append(out, strings.ToLower(strings.TrimSpace(s)))
	}
	sort.Strings(out)
	return out
}

// Disposition is the verdict for one discovered workload.
type Disposition string

const (
	Compliant Disposition = "compliant"    // permitted by policy
	Violation Disposition = "violation"    // forbidden by a specific rule
	Review    Disposition = "needs_review" // cannot be decided from the evidence
)

// Verdict is one policy decision, citing the rule that fired.
type Verdict struct {
	Finding     Finding     `json:"finding"`
	Disposition Disposition `json:"disposition"`
	Rules       []string    `json:"rules,omitempty"` // rule IDs that fired
	Rationale   string      `json:"rationale"`       // plain-language explanation
}

// Assessment is the full policy evaluation over a discovery report.
type Assessment struct {
	PolicyName    string    `json:"policy_name"`
	PolicyVersion string    `json:"policy_version"`
	PolicyHash    string    `json:"policy_hash"`
	ScanHash      string    `json:"scan_hash"`
	Verdicts      []Verdict `json:"verdicts"`
	Compliant     int       `json:"compliant"`
	Violations    int       `json:"violations"`
	NeedsReview   int       `json:"needs_review"`
	EvaluatedAt   string    `json:"evaluated_at"`
}

// AttestationPayload is the stable, timestamp-free view of an assessment. This
// is what gets signed and anchored: the same environment under the same policy
// must produce the same bytes, so two attestations are directly comparable.
func (a Assessment) AttestationPayload() []byte {
	type row struct {
		Host, Service, Rationale string
		Port                     int
		Disposition              Disposition
		Rules                    []string
	}
	rows := make([]row, 0, len(a.Verdicts))
	for _, v := range a.Verdicts {
		rows = append(rows, row{
			Host: v.Finding.Host, Service: v.Finding.Service, Rationale: v.Rationale,
			Port: v.Finding.Port, Disposition: v.Disposition, Rules: v.Rules,
		})
	}
	sort.Slice(rows, func(i, j int) bool {
		if rows[i].Host != rows[j].Host {
			return rows[i].Host < rows[j].Host
		}
		return rows[i].Port < rows[j].Port
	})
	b, _ := json.Marshal(struct {
		PolicyHash string `json:"policy_hash"`
		ScanHash   string `json:"scan_hash"`
		Rows       []row  `json:"rows"`
	}{a.PolicyHash, a.ScanHash, rows})
	return b
}

// Evaluate judges every finding against the policy.
//
// #CONTROL: CM-7 (least functionality) — unapproved AI services are violations.
// #CONTROL: AC-3 (access enforcement) — unauthenticated AI endpoints are flagged.
// #CONTROL: AU-2 (auditable events) — every verdict cites the rule that fired.
//
// Deny-by-default: a confirmed AI service that is not on the approved list is a
// violation. Silence is never treated as approval.
func Evaluate(rep Report, pol Policy) Assessment {
	approved := map[string]bool{}
	for _, s := range pol.ApprovedServices {
		approved[strings.ToLower(strings.TrimSpace(s))] = true
	}
	forbidden := map[Category]bool{}
	for _, c := range pol.ForbiddenCategories {
		forbidden[c] = true
	}
	hostOK := map[string]bool{}
	for _, h := range pol.ApprovedHosts {
		hostOK[strings.ToLower(strings.TrimSpace(h))] = true
	}

	a := Assessment{
		PolicyName:    pol.Name,
		PolicyVersion: pol.Version,
		PolicyHash:    pol.Hash(),
		ScanHash:      rep.Hash(),
		EvaluatedAt:   time.Now().UTC().Format(time.RFC3339),
	}

	for _, f := range rep.Findings {
		v := judge(f, pol, approved, forbidden, hostOK)
		a.Verdicts = append(a.Verdicts, v)
		switch v.Disposition {
		case Compliant:
			a.Compliant++
		case Violation:
			a.Violations++
		default:
			a.NeedsReview++
		}
	}
	return a
}

func judge(f Finding, pol Policy, approved map[string]bool, forbidden map[Category]bool, hostOK map[string]bool) Verdict {
	// Unidentified open port: cannot be judged from the evidence. Honest answer
	// is "review", never "compliant".
	if f.Confidence != Confirmed {
		if pol.FlagUnidentified {
			return Verdict{
				Finding: f, Disposition: Review, Rules: []string{RuleUnidentifiedListen},
				Rationale: fmt.Sprintf("port %d on %s is open but the service could not be identified; manual confirmation required", f.Port, f.Host),
			}
		}
		return Verdict{
			Finding: f, Disposition: Review,
			Rationale: fmt.Sprintf("port %d on %s open, service unidentified", f.Port, f.Host),
		}
	}

	var rules []string
	var reasons []string

	if forbidden[f.Category] {
		rules = append(rules, RuleForbiddenCategory)
		reasons = append(reasons, fmt.Sprintf("category %q is forbidden by policy", f.Category))
	}
	if !approved[strings.ToLower(f.Service)] {
		rules = append(rules, RuleUnapprovedService)
		reasons = append(reasons, fmt.Sprintf("%q is not in the approved AI service list", f.Service))
	}
	if len(hostOK) > 0 && !hostOK[strings.ToLower(f.Host)] {
		rules = append(rules, RuleUnapprovedHost)
		reasons = append(reasons, fmt.Sprintf("host %s is not approved to run AI workloads", f.Host))
	}
	if pol.RequireAuthenticated {
		// The discovery probe succeeded without credentials — that IS the evidence.
		rules = append(rules, RuleUnauthenticated)
		reasons = append(reasons, "endpoint answered an unauthenticated discovery probe; policy requires authentication")
	}

	if len(rules) == 0 {
		return Verdict{
			Finding: f, Disposition: Compliant,
			Rationale: fmt.Sprintf("%s on %s:%d is an approved AI service", f.Service, f.Host, f.Port),
		}
	}
	return Verdict{
		Finding: f, Disposition: Violation, Rules: rules,
		Rationale: strings.Join(reasons, "; "),
	}
}
