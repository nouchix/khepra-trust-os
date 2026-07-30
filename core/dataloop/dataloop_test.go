package dataloop_test

import (
	"testing"

	"github.com/nouchix/khepra-trust-os/core/adinkra"
	"github.com/nouchix/khepra-trust-os/core/aeo"
	"github.com/nouchix/khepra-trust-os/core/dataloop"
	"github.com/nouchix/khepra-trust-os/core/enforce"
)

func TestDataLoopProcessCycle(t *testing.T) {
	privKey, pubKey, err := adinkra.GenerateKeyPair()
	if err != nil {
		t.Fatalf("failed to generate key pair: %v", err)
	}

	agentDID := aeo.AgentDID(pubKey)
	loop := dataloop.NewDataLoop(enforce.ViaMCPGateway)

	intent := dataloop.Intent{
		AgentID:      agentDID,
		Description:  "Investigate system anomalies and query STIG rules",
		TargetScope:  "infrastructure",
		AllowedTools: []string{"stig_live_query", "read_logs"},
		Environment:  "railway",
	}

	req := enforce.ActionRequest{
		AgentID:       agentDID,
		Tool:          "stig_live_query",
		Capability:    "read",
		Target:        "V-220658",
		StateChanging: false,
	}

	grant := enforce.Grant{
		AgentID:      agentDID,
		Tools:        []string{"stig_live_query", "read_logs"},
		Capabilities: []string{"read"},
	}

	sigs := enforce.Signals{}
	telemetry := dataloop.TelemetryFrame{
		LatencyMS:    42,
		DriftFactor:  1.0,
		FIMDiffCount: 0,
	}

	res, err := loop.ProcessCycle(intent, req, grant, enforce.PostureNormal, sigs, telemetry, privKey, pubKey)
	if err != nil {
		t.Fatalf("ProcessCycle failed: %v", err)
	}

	if res.AgentID != agentDID {
		t.Errorf("expected agent DID %q, got %q", agentDID, res.AgentID)
	}
	if res.Ruling.Decision != enforce.Allow {
		t.Errorf("expected decision 'allow', got %q", res.Ruling.Decision)
	}
	if res.Actuation.Status != "executed" {
		t.Errorf("expected actuation status 'executed', got %q", res.Actuation.Status)
	}

	// Verify cryptographic proof of AEO
	if err := res.Evidence.Verify(); err != nil {
		t.Errorf("AEO evidence verification failed: %v", err)
	}

	// Verify intelligence summary metrics
	intel := loop.GetIntelligenceSummary()
	if intel.TotalCycles != 1 {
		t.Errorf("expected TotalCycles 1, got %d", intel.TotalCycles)
	}
	if intel.CloudReliability["railway"] == 0 {
		t.Errorf("expected railway reliability to be tracked")
	}
}
