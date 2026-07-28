// ktos-aiscan — AI workload discovery and governance-policy attestation.
//
// Answers the two questions an MSP asks about AI in a client environment:
//
//  1. Which ports/services/hosts are running AI, agents, or LLMs?
//  2. Are they running in accordance with the client's AI governance policy?
//
// Usage:
//
//	ktos-aiscan --targets 10.0.0.5,10.0.0.6     # scan hosts with the shipped signature pack
//	ktos-aiscan --targets 10.0.0.5 --policy ai-policy.json
//	ktos-aiscan --print-policy > ai-policy.json # emit a starter policy to edit
//
// Read-only by design: TCP connect plus benign GETs on documented discovery
// endpoints. It never authenticates, never writes, never exploits, and never
// LISTENS — safe to run against a client's production network.
//
// NO SIMULATION MODE. This binary previously carried a `--demo` flag that started
// stub HTTP servers on 127.0.0.1 and then "discovered" them. It was removed
// because it was not a demonstration of this tool:
//
//   - It built its OWN signature pack from the stubs' ephemeral ports, so it never
//     exercised the shipped 15-signature pack. A green demo proved nothing about
//     real detection.
//   - It made a read-only scanner open listening sockets — attack surface, and a
//     direct contradiction of the guarantee above.
//   - It hardcoded a named customer's policy into the shipped binary.
//   - It panicked on listen failure.
//
// Demonstrations now run against a real deployed service, not a local fake. See
// docs/architecture/ARCH-014-production-release-topology.md §6.1.
//
// Single static binary, standard library only: nothing to install on the target,
// no Python runtime, no agent, no data leaves the network.
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/nouchix/khepra-trust-os/core/aidiscovery"
)

func main() {
	var (
		targets  = flag.String("targets", "", "comma-separated hosts/IPs to scan")
		policyIn = flag.String("policy", "", "path to an AI governance policy (JSON)")
		printPol = flag.Bool("print-policy", false, "print a starter policy template and exit")
		jsonOut  = flag.Bool("json", false, "emit the full assessment as JSON")
		timeout  = flag.Duration("timeout", 90*time.Second, "overall scan timeout")
	)
	flag.Parse()

	if *printPol {
		emitStarterPolicy()
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), *timeout)
	defer cancel()

	if *targets == "" {
		fmt.Fprintln(os.Stderr, "error: --targets is required (comma-separated hosts or IPs)")
		flag.Usage()
		os.Exit(2)
	}

	var hosts []string
	for _, h := range strings.Split(*targets, ",") {
		if h = strings.TrimSpace(h); h != "" {
			hosts = append(hosts, h)
		}
	}
	if len(hosts) == 0 {
		fmt.Fprintln(os.Stderr, "error: --targets contained no usable hosts")
		os.Exit(2)
	}

	pol, err := loadPolicy(*policyIn)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}

	// The SHIPPED signature pack — the same one a client engagement uses. There is
	// no code path that substitutes a synthesized pack.
	sc := &aidiscovery.Scanner{}

	rep := sc.Scan(ctx, hosts)
	assessment := aidiscovery.Evaluate(rep, pol)

	if *jsonOut {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		_ = enc.Encode(assessment)
		return
	}
	render(rep, assessment)

	// Non-zero exit on violations so this can gate a pipeline or an MSP check.
	if assessment.Violations > 0 {
		os.Exit(3)
	}
}

func loadPolicy(path string) (aidiscovery.Policy, error) {
	if path == "" {
		// No policy supplied: deny-by-default posture. Everything confirmed is
		// reported as unapproved, which is the honest answer to "we have no policy."
		return aidiscovery.Policy{
			Name:             "implicit deny-by-default (no policy supplied)",
			Version:          "0",
			FlagUnidentified: true,
		}, nil
	}
	b, err := os.ReadFile(path)
	if err != nil {
		return aidiscovery.Policy{}, fmt.Errorf("read policy: %w", err)
	}
	var p aidiscovery.Policy
	if err := json.Unmarshal(b, &p); err != nil {
		return aidiscovery.Policy{}, fmt.Errorf("parse policy %s: %w", path, err)
	}
	if p.Name == "" || p.Version == "" {
		return aidiscovery.Policy{}, fmt.Errorf("policy must set name and version (an attestation must pin the policy version)")
	}
	return p, nil
}

func emitStarterPolicy() {
	p := aidiscovery.Policy{
		Name:                 "Example Corp AI Governance Policy",
		Version:              "1.0",
		ApprovedServices:     []string{"Ollama"},
		ForbiddenCategories:  []aidiscovery.Category{aidiscovery.CatNotebook},
		ApprovedHosts:        []string{},
		RequireAuthenticated: false,
		FlagUnidentified:     true,
	}
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	_ = enc.Encode(p)
}

func render(rep aidiscovery.Report, a aidiscovery.Assessment) {
	line := strings.Repeat("═", 74)
	fmt.Println(line)
	fmt.Println("  KHEPRA — AI Workload Discovery & Governance Attestation")
	fmt.Println(line)
	fmt.Printf("\nTargets      : %s\n", strings.Join(rep.Targets, ", "))
	fmt.Printf("Ports probed : %d    Duration: %s\n", rep.Scanned, rep.Duration)
	fmt.Printf("Policy       : %s (v%s)\n", a.PolicyName, a.PolicyVersion)

	fmt.Printf("\n── Discovered AI workloads ────────────────────────────────────────────────\n\n")
	if len(a.Verdicts) == 0 {
		fmt.Println("  (no listening services found on the probed AI ports)")
	}
	for _, v := range a.Verdicts {
		f := v.Finding
		mark := map[aidiscovery.Disposition]string{
			aidiscovery.Compliant: "[OK]     ",
			aidiscovery.Violation: "[VIOLATE]",
			aidiscovery.Review:    "[REVIEW] ",
		}[v.Disposition]

		name := f.Service
		if name == "" {
			name = "unidentified"
		}
		fmt.Printf("  %s %s:%d  %s\n", mark, f.Host, f.Port, name)
		fmt.Printf("             confidence : %s\n", f.Confidence)
		if f.Evidence != "" {
			fmt.Printf("             evidence   : %s\n", f.Evidence)
		}
		fmt.Printf("             verdict    : %s\n", v.Rationale)
		if len(v.Rules) > 0 {
			fmt.Printf("             rules      : %s\n", strings.Join(v.Rules, ", "))
		}
		if f.Notes != "" {
			fmt.Printf("             risk       : %s\n", f.Notes)
		}
		fmt.Println()
	}

	fmt.Printf("── Attestation ────────────────────────────────────────────────────────────\n\n")
	fmt.Printf("  compliant %d · violations %d · needs review %d\n\n", a.Compliant, a.Violations, a.NeedsReview)
	fmt.Printf("  scan hash   : %s\n", a.ScanHash)
	fmt.Printf("  policy hash : %s\n", a.PolicyHash)
	fmt.Printf("  evaluated   : %s\n", a.EvaluatedAt)
	fmt.Println()
	fmt.Println("  The scan and policy hashes pin this judgment to an exact environment")
	fmt.Println("  and an exact policy version — re-runnable, diffable, and ready to be")
	fmt.Println("  signed into the evidence ledger.")
	fmt.Println(line)
}
