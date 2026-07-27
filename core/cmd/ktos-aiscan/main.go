// ktos-aiscan — AI workload discovery and governance-policy attestation.
//
// Answers the two questions an MSP asks about AI in a client environment:
//
//  1. Which ports/services/hosts are running AI, agents, or LLMs?
//  2. Are they running in accordance with the client's AI governance policy?
//
// Usage:
//
//	ktos-aiscan --demo                          # self-contained demo, no network needed
//	ktos-aiscan --targets 10.0.0.5,10.0.0.6     # scan hosts with the shipped signature pack
//	ktos-aiscan --targets 10.0.0.5 --policy ai-policy.json
//	ktos-aiscan --print-policy > ai-policy.json # emit a starter policy to edit
//
// Read-only by design: TCP connect plus benign GETs on documented discovery
// endpoints. It never authenticates, never writes, never exploits — safe to run
// against a client's production network.
//
// Single static binary, standard library only: nothing to install on the target,
// no Python runtime, no agent, no data leaves the network.
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/nouchix/khepra-trust-os/core/aidiscovery"
)

func main() {
	var (
		targets  = flag.String("targets", "", "comma-separated hosts/IPs to scan")
		policyIn = flag.String("policy", "", "path to an AI governance policy (JSON)")
		demo     = flag.Bool("demo", false, "run a self-contained demo (starts local stub AI services, then finds them)")
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

	var (
		hosts []string
		sc    = &aidiscovery.Scanner{}
		pol   aidiscovery.Policy
	)

	switch {
	case *demo:
		var stop func()
		hosts, sc, pol, stop = setupDemo()
		defer stop()
	default:
		if *targets == "" {
			fmt.Fprintln(os.Stderr, "error: provide --targets, or use --demo to see it work")
			flag.Usage()
			os.Exit(2)
		}
		for _, h := range strings.Split(*targets, ",") {
			if h = strings.TrimSpace(h); h != "" {
				hosts = append(hosts, h)
			}
		}
		var err error
		pol, err = loadPolicy(*policyIn)
		if err != nil {
			fmt.Fprintf(os.Stderr, "error: %v\n", err)
			os.Exit(1)
		}
	}

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

// setupDemo starts local stub AI services so the tool can be demonstrated on a
// laptop with no client network and no real AI installed.
func setupDemo() ([]string, *aidiscovery.Scanner, aidiscovery.Policy, func()) {
	// Stub "Ollama" — an approved service.
	ollama := newStub(map[string]string{
		"/api/tags": `{"models":[{"name":"llama3:8b","size":4661211808}]}`,
	})
	// Stub "Jupyter" — a forbidden category (arbitrary code execution).
	jupyter := newStub(map[string]string{
		"/api/status": `{"started":"2026-12-25T09:00:00Z","version":"7.0.6","kernels":2}`,
	})
	// A plain web server — open port, NOT AI. Must be reported as weak, not as a
	// false shadow-AI finding.
	decoy := newStub(map[string]string{
		"/": `<html><body>intranet</body></html>`,
	})

	oHost, oPort := splitURL(ollama.URL)
	jHost, jPort := splitURL(jupyter.URL)
	_, dPort := splitURL(decoy.URL)

	sc := &aidiscovery.Scanner{
		Ports: []int{oPort, jPort, dPort},
		Signatures: []aidiscovery.Signature{
			{
				Name: "Ollama", Category: aidiscovery.CatLLMServer, Ports: []int{oPort},
				ProbePaths: []string{"/api/tags"}, BodyMarkers: []string{"models"},
				Notes: "Local LLM runtime; often binds 0.0.0.0 with no auth.",
			},
			{
				Name: "Jupyter Notebook / JupyterLab", Category: aidiscovery.CatNotebook, Ports: []int{jPort},
				ProbePaths: []string{"/api/status"}, BodyMarkers: []string{"kernels", "version"},
				Notes: "HIGH RISK: arbitrary code execution surface.",
			},
		},
	}

	pol := aidiscovery.Policy{
		Name:                "Groff NetWorks AI Governance Policy (sample)",
		Version:             "1.0",
		ApprovedServices:    []string{"Ollama"},
		ForbiddenCategories: []aidiscovery.Category{aidiscovery.CatNotebook},
		FlagUnidentified:    true,
	}

	hosts := []string{oHost}
	if jHost != oHost {
		hosts = append(hosts, jHost)
	}
	return hosts, sc, pol, func() {
		ollama.Close()
		jupyter.Close()
		decoy.Close()
	}
}

type stub struct {
	URL   string
	close func()
}

func (s *stub) Close() { s.close() }

func newStub(routes map[string]string) *stub {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if body, ok := routes[r.URL.Path]; ok {
			_, _ = w.Write([]byte(body))
			return
		}
		w.WriteHeader(http.StatusNotFound)
	})
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		panic(err)
	}
	srv := &http.Server{Handler: mux}
	go func() { _ = srv.Serve(l) }()
	return &stub{
		URL:   "http://" + l.Addr().String(),
		close: func() { _ = srv.Close() },
	}
}

func splitURL(raw string) (string, int) {
	hp := strings.TrimPrefix(raw, "http://")
	host, portStr, _ := net.SplitHostPort(hp)
	p, _ := strconv.Atoi(portStr)
	return host, p
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
