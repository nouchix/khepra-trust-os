// Command ktos-mcp is the KHEPRA Trust OS MCP server.
//
// Default: speak MCP over stdio (JSON-RPC 2.0 on stdin/stdout; logs on stderr),
// so any MCP client — Claude Desktop, Cursor, Antigravity, Smithery, or a
// sovereign mcp.souhimbou.ai deployment — can drive the KTOS trust layer.
//
//	ktos-mcp            # run the stdio MCP server
//	ktos-mcp --demo     # run the end-to-end validation demo and exit
//
// IP: SOUHIMBOU DOH KONE LLC, exclusively licensed to SecRed Knowledge Inc.
// Patent: USPTO #73565085 (KHEPRA Protocol)
package main

import (
	"context"
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/nouchix/khepra-trust-os/core/mcp"
)

func main() {
	demo := flag.Bool("demo", false, "run the end-to-end trust demo and exit")
	flag.Parse()

	if *demo {
		if err := mcp.RunDemo(os.Stdout); err != nil {
			log.Fatalf("demo failed: %v", err)
		}
		return
	}

	// stdout is reserved for JSON-RPC frames; all logs go to stderr.
	logger := log.New(os.Stderr, "[ktos-mcp] ", log.LstdFlags)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	logger.Printf("KHEPRA Trust OS MCP server %s — stdio transport, ML-DSA-65 evidence", mcp.ServerVersion)
	srv := mcp.NewServer(logger)

	// DM-1: a public demonstration deployment (mcp.souhimbou.ai) must carry the
	// no-CUI banner and the input guard. Driven by KHEPRA_DAG_SEED_DEMO, the same
	// variable ops/guards/sovereignty_allowlist.txt already records for that host,
	// so the deployment knob and the documented condition cannot drift apart.
	//
	// Unset means SOVEREIGN: no banner, no guard, CUI accepted. That is the right
	// default — a customer running inside their own boundary is exactly who should
	// be sending controlled data, and refusing it there would break the product.
	if demoMode := mcp.DemoModeFromEnv(os.Getenv); demoMode.Enabled {
		srv.SetDemoMode(demoMode)
		logger.Printf("PUBLIC DEMO MODE — no-CUI banner and input guard active; DAG %q", demoMode.Info().DAG)
	}
	if err := srv.Serve(ctx, os.Stdin, os.Stdout); err != nil && err != context.Canceled {
		logger.Fatalf("server error: %v", err)
	}
}
