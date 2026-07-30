package agentpack_test

import (
	"testing"

	"github.com/nouchix/khepra-trust-os/core/agentpack"
	"github.com/nouchix/khepra-trust-os/core/enforce"
)

const sampleYAML = `
agent:
  name: soc-investigator
  version: 1.0.0
  framework: langgraph

mission:
  detect:
    - vulnerabilities
    - infrastructure_anomalies
    - compliance_drift

tools:
  allowed:
    - github
    - kubernetes
    - cloudflare

security:
  pqc_attestation: required
  policy_framework: CMMC_3_0_LEVEL_2
  containment:
    max_posture: PostureRestricted
    actions:
      allow:
        - read_logs
        - query_stig
      require_approval:
        - update_dns
      deny:
        - delete_production_database

proof:
  required:
    - ML_DSA_65
    - AEO_DAG_COMMIT
`

func TestParseYAML(t *testing.T) {
	ap, err := agentpack.Parse([]byte(sampleYAML))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}

	if ap.Agent.Name != "soc-investigator" {
		t.Errorf("expected agent name 'soc-investigator', got %q", ap.Agent.Name)
	}
	if ap.Agent.Framework != "langgraph" {
		t.Errorf("expected framework 'langgraph', got %q", ap.Agent.Framework)
	}
	if len(ap.Tools.Allowed) != 3 {
		t.Errorf("expected 3 allowed tools, got %d", len(ap.Tools.Allowed))
	}
	if ap.Security.PQCAttestation != "required" {
		t.Errorf("expected PQC attestation 'required', got %q", ap.Security.PQCAttestation)
	}
}

func TestValidate(t *testing.T) {
	ap, err := agentpack.Parse([]byte(sampleYAML))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}

	if err := ap.Validate(); err != nil {
		t.Errorf("Validate failed for valid agentpack: %v", err)
	}

	invalidAP := &agentpack.AgentPack{}
	if err := invalidAP.Validate(); err == nil {
		t.Error("expected error for empty AgentPack, got nil")
	}
}

func TestToGrant(t *testing.T) {
	ap, err := agentpack.Parse([]byte(sampleYAML))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}

	grant, err := ap.ToGrant("did:khepra:agent-123")
	if err != nil {
		t.Fatalf("ToGrant failed: %v", err)
	}

	if grant.AgentID != "did:khepra:agent-123" {
		t.Errorf("expected agent ID 'did:khepra:agent-123', got %q", grant.AgentID)
	}
	if !grant.ApprovalForWrites {
		t.Error("expected ApprovalForWrites to be true due to require_approval actions")
	}
}

func TestGenerateSecurityProfile(t *testing.T) {
	ap, err := agentpack.Parse([]byte(sampleYAML))
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}

	profile, err := ap.GenerateSecurityProfile()
	if err != nil {
		t.Fatalf("GenerateSecurityProfile failed: %v", err)
	}

	if profile.IsolationLevel != "graph_state_isolated" {
		t.Errorf("expected isolation level 'graph_state_isolated', got %q", profile.IsolationLevel)
	}
	if !profile.PQCRequired {
		t.Error("expected PQCRequired to be true")
	}
	if profile.MaxPosture != enforce.PostureRestricted {
		t.Errorf("expected MaxPosture Restricted, got %v", profile.MaxPosture)
	}
}
