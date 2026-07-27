// ktos-enforce — demonstrates the ASAF Enforcement Plane.
//
// Shows the difference between observability and control: an agent under
// prompt injection attempts data exfiltration, and the enforcement plane denies
// the action, isolates the session, and produces signed evidence of the decision.
//
//	ktos-enforce --demo
//
// The decisions here are a Policy Decision Point. They become actual enforcement
// only where KHEPRA is interposed in the agent's path (MCP gateway, ASAF daemon,
// or credential broker) — the output states which, honestly, on every ruling.
package main

import (
	"flag"
	"fmt"
	"strings"

	"github.com/nouchix/khepra-trust-os/core/enforce"
)

func main() {
	demo := flag.Bool("demo", false, "run the prompt-injection containment scenario")
	advisory := flag.Bool("advisory", false, "run with NO interposition, to show advisory-only mode")
	flag.Parse()

	if !*demo {
		fmt.Println("usage: ktos-enforce --demo [--advisory]")
		return
	}

	interposer := enforce.ViaMCPGateway
	if *advisory {
		interposer = enforce.NoInterposition
	}
	eng := &enforce.Engine{Interposer: interposer}

	grant := enforce.Grant{
		AgentID:         "did:khepra:acme-research-agent",
		Tools:           []string{"read_kb", "query_api", "write_report"},
		Capabilities:    []string{"read", "write"},
		EgressAllowlist: []string{"api.internal.corp", "*.approved-vendor.com"},
		MaxSensitivity:  "internal",
	}

	bar := strings.Repeat("═", 74)
	fmt.Println(bar)
	fmt.Println("  KHEPRA ASAF — Enforcement Plane")
	fmt.Println("  See what agents do · Control what they may do · Prove what happened")
	fmt.Println(bar)
	fmt.Printf("\nAgent   : %s\n", grant.AgentID)
	fmt.Printf("Granted : tools=%v caps=%v\n", grant.Tools, grant.Capabilities)
	fmt.Printf("Egress  : %v   Max data class: %s\n", grant.EgressAllowlist, grant.MaxSensitivity)
	if interposer == enforce.NoInterposition {
		fmt.Printf("Posture : ADVISORY MODE — not interposed, decisions cannot block\n")
	} else {
		fmt.Printf("Interpose: %s (tool calls traverse KHEPRA, so denials are effective)\n", interposer)
	}

	posture := enforce.PostureNormal
	violations := 0

	steps := []struct {
		title string
		req   enforce.ActionRequest
		sig   enforce.Signals
	}{
		{
			title: "Normal work — read an approved knowledge base",
			req: enforce.ActionRequest{
				AgentID: grant.AgentID, Tool: "read_kb", Capability: "read",
				Target: "kb://hr-policies", Sensitivity: "internal",
			},
		},
		{
			title: "Agent ingests a poisoned document (injection indicators appear)",
			req: enforce.ActionRequest{
				AgentID: grant.AgentID, Tool: "read_kb", Capability: "read",
				Target: "kb://vendor-invoice-2026.pdf", Sensitivity: "internal",
			},
			sig: enforce.Signals{InjectionIndicators: []string{
				`hidden text: "ignore previous instructions"`,
				"instruction origin: untrusted document",
			}},
		},
		{
			title: "INJECTED GOAL: exfiltrate finance data to an external endpoint",
			req: enforce.ActionRequest{
				AgentID: grant.AgentID, Tool: "query_api", Capability: "read",
				Target: "drive://finance/Q4-forecast.xlsx", Sensitivity: "sensitive",
				EgressTo: "paste.attacker.io",
			},
			sig: enforce.Signals{InjectionIndicators: []string{
				`hidden text: "ignore previous instructions"`,
				"destination absent from egress allowlist",
			}},
		},
		{
			title: "Post-containment — agent retries a benign read",
			req: enforce.ActionRequest{
				AgentID: grant.AgentID, Tool: "read_kb", Capability: "read",
				Target: "kb://hr-policies", Sensitivity: "internal",
			},
		},
	}

	for i, s := range steps {
		s.sig.PriorViolations = violations
		r := eng.Decide(s.req, grant, posture, s.sig)

		fmt.Printf("\n── [%d] %s\n", i+1, s.title)
		fmt.Printf("   request   : %s → %s", r.Tool, r.Target)
		if s.req.EgressTo != "" {
			fmt.Printf("  (egress → %s)", s.req.EgressTo)
		}
		fmt.Println()

		verdict := strings.ToUpper(string(r.Decision))
		effect := "blocked"
		if !r.Decision.Blocking() {
			effect = "executed"
		}
		if !r.Enforceable && r.Decision.Blocking() {
			effect = "NOT blocked (advisory only — no PEP in path)"
		}
		fmt.Printf("   decision  : %s  → action %s\n", verdict, effect)
		if len(r.Rules) > 0 {
			fmt.Printf("   rules     : %s\n", strings.Join(r.Rules, ", "))
		}
		fmt.Printf("   rationale : %s\n", r.Rationale)
		if r.PostureIn != r.PostureOut {
			fmt.Printf("   CONTAINMENT: %s → %s\n", r.PostureIn, r.PostureOut)
		}
		fmt.Printf("   evidence  : %s\n", r.Hash()[:32]+"…")

		if r.Decision.Blocking() {
			violations++
		}
		posture = r.PostureOut
	}

	fmt.Printf("\n%s\n", bar)
	fmt.Printf("  Final containment posture: %s\n", strings.ToUpper(string(posture)))
	fmt.Println()
	fmt.Println("  An observability tool would have logged the exfiltration and alerted")
	fmt.Println("  afterward. The enforcement plane refused the action, isolated the")
	fmt.Println("  session, and every ruling above — allow and deny alike — is a signed,")
	fmt.Println("  replayable evidence record.")
	fmt.Println(bar)
}
