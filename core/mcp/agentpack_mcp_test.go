package mcp_test

import (
	"encoding/json"
	"testing"

	"github.com/nouchix/khepra-trust-os/core/dataloop"
	"github.com/nouchix/khepra-trust-os/core/mcp"
)

const sampleAgentPack = `
agent:
  name: sec-ops-agent
  version: 1.0.0
  framework: langgraph

mission:
  detect:
    - vulnerabilities

tools:
  allowed:
    - github
    - stig_live_query

security:
  pqc_attestation: required
  containment:
    max_posture: PostureNormal
    actions:
      allow:
        - read_logs
      require_approval:
        - deploy_worker

proof:
  required:
    - ML_DSA_65
`

func TestMCPToolAgentpackDeployAndDataLoop(t *testing.T) {
	srv := mcp.NewTrustServer()

	// 1. Test agentpack_deploy tool
	deployArgs, _ := json.Marshal(map[string]any{
		"agentpack_yaml": sampleAgentPack,
	})

	deployRes, err := srv.Call("agentpack_deploy", deployArgs)
	if err != nil {
		t.Fatalf("agentpack_deploy tool call failed: %v", err)
	}

	deployMap, ok := deployRes.(map[string]any)
	if !ok {
		t.Fatalf("expected map[string]any response from agentpack_deploy, got %T", deployRes)
	}

	agentID, _ := deployMap["agent_id"].(string)
	if agentID == "" {
		t.Fatalf("expected valid agent_id from agentpack_deploy")
	}

	// 2. Test dataloop_process tool
	loopArgs, _ := json.Marshal(map[string]any{
		"agent_id":    agentID,
		"intent":      "Audit security controls",
		"tool":        "stig_live_query",
		"target":      "RHEL-09",
		"capability":  "read",
		"environment": "railway",
	})

	loopRes, err := srv.Call("dataloop_process", loopArgs)
	if err != nil {
		t.Fatalf("dataloop_process tool call failed: %v", err)
	}
	if loopRes == nil {
		t.Fatalf("expected non-nil response from dataloop_process")
	}

	// 3. Test dataloop_intelligence tool
	intelRes, err := srv.Call("dataloop_intelligence", json.RawMessage("{}"))
	if err != nil {
		t.Fatalf("dataloop_intelligence tool call failed: %v", err)
	}

	intelSummary, ok := intelRes.(dataloop.IntelligenceSummary)
	if !ok {
		t.Fatalf("expected dataloop.IntelligenceSummary, got %T", intelRes)
	}
	if intelSummary.TotalCycles < 1 {
		t.Errorf("expected TotalCycles >= 1 after dataloop_process call, got %d", intelSummary.TotalCycles)
	}
}
