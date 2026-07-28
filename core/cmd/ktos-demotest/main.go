// ktos-demotest — verifies that a hosted demo surface enforces the conditions the
// sovereignty allowlist claims it enforces (gap DM-1).
//
// ops/guards/sovereignty_allowlist.txt permits two vendor-hosted demo surfaces on
// the data plane, each with written TRL10 conditions. Guard G-1 checks only that
// such a surface is *acknowledged*; it cannot check that the conditions hold. This
// command checks them.
//
// Usage:
//
//	ktos-demotest --target https://mcp.souhimbou.ai     --kind mcp
//	ktos-demotest --target https://gateway.souhimbou.ai --kind gateway
//	ktos-demotest --target https://... --kind gateway --json
//
// Exit codes, so this can gate a pipeline:
//
//	0  conformant — every applicable condition observed working
//	2  usage error
//	3  at least one condition FAILED — a real finding
//	4  no failures, but at least one condition was UNVERIFIABLE
//
// 4 is separate from 0 on purpose. "We could not tell" is not "it works"; folding
// them together is how a prose condition survives as an unchecked assumption, which
// is the whole reason DM-1 exists.
//
// Read-only. Every probe is a benign GET or a POST of deliberately synthetic,
// published non-secret values against our OWN endpoints, to confirm they are
// refused. It never attempts to bypass a control.
//
// IP: SOUHIMBOU DOH KONE LLC, exclusively licensed to SecRed Knowledge Inc.
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/nouchix/khepra-trust-os/core/democonform"
)

func main() {
	var (
		target  = flag.String("target", "", "base URL of the demo surface to assess (required)")
		kind    = flag.String("kind", "mcp", `condition set: "mcp" or "gateway"`)
		jsonOut = flag.Bool("json", false, "emit the full report as JSON")
		timeout = flag.Duration("timeout", 60*time.Second, "overall assessment timeout")
	)
	flag.Parse()

	if *target == "" {
		fmt.Fprintln(os.Stderr, "error: --target is required (e.g. https://mcp.souhimbou.ai)")
		flag.Usage()
		os.Exit(2)
	}
	if !strings.HasPrefix(*target, "http://") && !strings.HasPrefix(*target, "https://") {
		fmt.Fprintln(os.Stderr, "error: --target must be an absolute http(s) URL")
		os.Exit(2)
	}
	if *kind != "mcp" && *kind != "gateway" {
		fmt.Fprintf(os.Stderr, "error: --kind must be \"mcp\" or \"gateway\", got %q\n", *kind)
		os.Exit(2)
	}

	ctx, cancel := context.WithTimeout(context.Background(), *timeout)
	defer cancel()

	c := &democonform.Checker{
		BaseURL: *target,
		Kind:    *kind,
		Client:  &http.Client{Timeout: 20 * time.Second},
	}
	rep := c.Run(ctx)

	if *jsonOut {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		_ = enc.Encode(rep)
	} else {
		render(rep, *kind)
	}

	switch {
	case rep.Failed > 0:
		os.Exit(3)
	case rep.Unverifiable > 0:
		os.Exit(4)
	}
}

func render(r democonform.Report, kind string) {
	line := strings.Repeat("═", 74)
	fmt.Println(line)
	fmt.Println("  KHEPRA — Demo Surface Conformance (gap DM-1)")
	fmt.Println(line)
	fmt.Printf("\nTarget    : %s\n", r.Target)
	fmt.Printf("Condition set : %s\n", kind)
	fmt.Printf("Checked   : %s\n", r.CheckedAt)

	fmt.Printf("\n── Allowlist conditions ───────────────────────────────────────────────────\n\n")
	mark := map[democonform.Result]string{
		democonform.Pass:         "[PASS]   ",
		democonform.Fail:         "[FAIL]   ",
		democonform.Unverifiable: "[UNVERIF]",
	}
	for _, f := range r.Findings {
		fmt.Printf("  %s %s\n", mark[f.Result], f.ID)
		fmt.Printf("             condition : %s\n", f.Condition)
		fmt.Printf("             probe     : %s\n", f.Probe)
		fmt.Printf("             observed  : %s\n", f.Evidence)
		fmt.Printf("             verdict   : %s\n", f.Rationale)
		fmt.Println()
	}

	fmt.Printf("── Result ─────────────────────────────────────────────────────────────────\n\n")
	fmt.Printf("  pass %d · fail %d · unverifiable %d\n\n", r.Passed, r.Failed, r.Unverifiable)
	switch {
	case r.Conformant:
		fmt.Println("  CONFORMANT — every condition the allowlist records was observed working.")
	case r.Failed > 0:
		fmt.Println("  NOT CONFORMANT — a condition the allowlist records as required is not")
		fmt.Println("  enforced. Until it is, the allowlist entry overstates what this surface")
		fmt.Println("  does, and the demo surface is carrying risk the guard cannot see.")
	default:
		fmt.Println("  INCONCLUSIVE — nothing failed, but a condition could not be observed")
		fmt.Println("  from outside. This is NOT a pass: an unproven control is not a control.")
		fmt.Println("  Expose the missing signal (e.g. an explicit demo-mode field on /health)")
		fmt.Println("  so the condition becomes checkable rather than assumed.")
	}
	fmt.Println(line)
}
