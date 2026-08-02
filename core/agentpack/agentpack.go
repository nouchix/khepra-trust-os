// Package agentpack implements the Agentpack Specification for KHEPRA:
// declarative blueprints that define agent identity, framework metadata,
// allowed tools, containment postures, and PQC proof requirements.
//
// IP: SecRed Knowledge Inc. / SOUHIMBOU DOH KONE LLC — USPTO #73565085
package agentpack

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/nouchix/khepra-trust-os/core/enforce"
)

// AgentMeta specifies the agent's identity and runtime framework.
type AgentMeta struct {
	Name      string `json:"name"`
	Version   string `json:"version"`
	Framework string `json:"framework"` // langgraph | autogen | crewai | custom
}

// MissionMeta describes the agent's declared operational scope.
type MissionMeta struct {
	Detect []string `json:"detect"`
}

// ToolsMeta enumerates granted tool domains.
type ToolsMeta struct {
	Allowed []string `json:"allowed"`
}

// ContainmentActions classifies specific action rules.
type ContainmentActions struct {
	Allow           []string `json:"allow"`
	RequireApproval []string `json:"require_approval"`
	Deny            []string `json:"deny"`
}

// ContainmentMeta declares posture thresholds and action boundaries.
type ContainmentMeta struct {
	MaxPosture string             `json:"max_posture"` // normal | elevated | restricted | quarantined | locked
	Actions    ContainmentActions `json:"actions"`
}

// SecurityMeta captures PQC attestation and compliance framework requirements.
type SecurityMeta struct {
	PQCAttestation  string          `json:"pqc_attestation"`  // required | optional
	PolicyFramework string          `json:"policy_framework"` // e.g., CMMC_3_0_LEVEL_2
	Containment     ContainmentMeta `json:"containment"`
}

// ProofMeta specifies required cryptographic proof components.
type ProofMeta struct {
	Required []string `json:"required"` // e.g., ML_DSA_65, AEO_DAG_COMMIT
}

// AgentPack is the canonical blueprint for deploying governed agents.
type AgentPack struct {
	Agent    AgentMeta    `json:"agent"`
	Mission  MissionMeta  `json:"mission"`
	Tools    ToolsMeta    `json:"tools"`
	Security SecurityMeta `json:"security"`
	Proof    ProofMeta    `json:"proof"`
}

// SecurityProfile represents the generated runtime containment artifact.
type SecurityProfile struct {
	AgentName         string          `json:"agent_name"`
	Framework         string          `json:"framework"`
	IsolationLevel    string          `json:"isolation_level"`
	PQCRequired       bool            `json:"pqc_required"`
	MaxPosture        enforce.Posture `json:"max_posture"`
	AllowedTools      []string        `json:"allowed_tools"`
	DisallowedActions []string        `json:"disallowed_actions"`
	ApprovedActions   []string        `json:"approved_actions"`
	ApprovalActions   []string        `json:"approval_actions"`
}

// Parse unmarshals JSON or YAML agentpack content into an AgentPack struct.
func Parse(data []byte) (*AgentPack, error) {
	if len(data) == 0 {
		return nil, errors.New("agentpack: empty input")
	}

	trimmed := strings.TrimSpace(string(data))
	var ap AgentPack

	// Direct JSON attempt
	if strings.HasPrefix(trimmed, "{") {
		if err := json.Unmarshal(data, &ap); err != nil {
			return nil, fmt.Errorf("agentpack: invalid JSON: %w", err)
		}
		return &ap, nil
	}

	// Simple YAML to JSON converter for standard key-value structure
	jsonData, err := yamlToJSON(trimmed)
	if err != nil {
		return nil, fmt.Errorf("agentpack: failed to parse YAML: %w", err)
	}

	if err := json.Unmarshal(jsonData, &ap); err != nil {
		return nil, fmt.Errorf("agentpack: failed to decode converted YAML: %w", err)
	}

	return &ap, nil
}

// Validate checks the AgentPack for required fields and valid configurations.
func (ap *AgentPack) Validate() error {
	if ap.Agent.Name == "" {
		return errors.New("agentpack: agent.name is required")
	}
	if ap.Agent.Version == "" {
		return errors.New("agentpack: agent.version is required")
	}
	if ap.Agent.Framework == "" {
		return errors.New("agentpack: agent.framework is required")
	}
	if len(ap.Tools.Allowed) == 0 {
		return errors.New("agentpack: tools.allowed cannot be empty")
	}

	// Validate security attestation requirement
	pqc := strings.ToLower(strings.TrimSpace(ap.Security.PQCAttestation))
	if pqc != "required" && pqc != "optional" && pqc != "" {
		return fmt.Errorf("agentpack: invalid security.pqc_attestation %q (must be 'required' or 'optional')", ap.Security.PQCAttestation)
	}

	return nil
}

// ToGrant converts the AgentPack security rules into an ASAF PDP enforce.Grant.
func (ap *AgentPack) ToGrant(agentID string) (enforce.Grant, error) {
	if err := ap.Validate(); err != nil {
		return enforce.Grant{}, err
	}

	if agentID == "" {
		agentID = ap.Agent.Name
	}

	// Default capabilities granted to governed agents
	capabilities := []string{"read", "exec"}

	// Check if human approval is required for state-changing actions
	approvalForWrites := len(ap.Security.Containment.Actions.RequireApproval) > 0 ||
		len(ap.Security.Containment.Actions.Deny) > 0

	grant := enforce.Grant{
		AgentID:           agentID,
		Tools:             ap.Tools.Allowed,
		Capabilities:      capabilities,
		EgressAllowlist:   ap.Tools.Allowed,
		MaxSensitivity:    "sensitive",
		ApprovalForWrites: approvalForWrites,
	}

	return grant, nil
}

// GenerateSecurityProfile builds the governed runtime isolation profile.
func (ap *AgentPack) GenerateSecurityProfile() (*SecurityProfile, error) {
	if err := ap.Validate(); err != nil {
		return nil, err
	}

	pqcReq := strings.EqualFold(ap.Security.PQCAttestation, "required")

	maxPosture := enforce.PostureNormal
	switch strings.ToLower(strings.TrimSpace(ap.Security.Containment.MaxPosture)) {
	case "elevated", "postureelevated":
		maxPosture = enforce.PostureElevated
	case "restricted", "posturerestricted":
		maxPosture = enforce.PostureRestricted
	case "quarantined", "posturequarantined":
		maxPosture = enforce.PostureQuarantined
	case "locked", "posturelocked":
		maxPosture = enforce.PostureLocked
	}

	isolationLevel := "container_isolated"
	switch strings.ToLower(ap.Agent.Framework) {
	case "langgraph":
		isolationLevel = "graph_state_isolated"
	case "autogen":
		isolationLevel = "multi_agent_sandbox"
	case "crewai":
		isolationLevel = "role_bounded_process"
	}

	return &SecurityProfile{
		AgentName:         ap.Agent.Name,
		Framework:         ap.Agent.Framework,
		IsolationLevel:    isolationLevel,
		PQCRequired:       pqcReq,
		MaxPosture:        maxPosture,
		AllowedTools:      ap.Tools.Allowed,
		DisallowedActions: ap.Security.Containment.Actions.Deny,
		ApprovedActions:   ap.Security.Containment.Actions.Allow,
		ApprovalActions:   ap.Security.Containment.Actions.RequireApproval,
	}, nil
}

// yamlToJSON converts basic YAML structure to JSON bytes.
func yamlToJSON(yamlStr string) ([]byte, error) {
	lines := strings.Split(yamlStr, "\n")
	root := make(map[string]interface{})

	var stack []map[string]interface{}
	var keys []string
	var indents []int

	currentMap := root

	for _, rawLine := range lines {
		// Ignore comments and blank lines
		line := rawLine
		if idx := strings.Index(line, "#"); idx >= 0 {
			line = line[:idx]
		}
		trimmedLine := strings.TrimSpace(line)
		if trimmedLine == "" {
			continue
		}

		indent := len(line) - len(strings.TrimLeft(line, " "))

		// Pop stack for shallower indentation
		for len(indents) > 0 && indent <= indents[len(indents)-1] {
			indents = indents[:len(indents)-1]
			currentMap = stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			keys = keys[:len(keys)-1]
		}

		if strings.HasPrefix(trimmedLine, "- ") {
			// Handle slice element under last key.
			if len(keys) == 0 {
				continue
			}
			parentMap := stack[len(stack)-1]
			lastKey := keys[len(keys)-1]
			val := strings.TrimSpace(strings.TrimPrefix(trimmedLine, "- "))
			val = strings.Trim(val, "\"'")

			existing, exists := parentMap[lastKey]
			if !exists {
				parentMap[lastKey] = []interface{}{val}
			} else if slice, ok := existing.([]interface{}); ok {
				parentMap[lastKey] = append(slice, val)
			} else {
				// Overwrite map placeholder with the slice
				parentMap[lastKey] = []interface{}{existing, val}
			}
			continue
		}

		parts := strings.SplitN(trimmedLine, ":", 2)
		if len(parts) < 1 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		if key == "" {
			continue
		}

		val := ""
		if len(parts) == 2 {
			val = strings.TrimSpace(parts[1])
		}

		if val == "" {
			// Nested map
			newMap := make(map[string]interface{})
			currentMap[key] = newMap

			stack = append(stack, currentMap)
			indents = append(indents, indent)
			keys = append(keys, key)
			currentMap = newMap
		} else {
			// Primitive scalar value
			val = strings.Trim(val, "\"'")
			if boolVal, err := strconv.ParseBool(val); err == nil {
				currentMap[key] = boolVal
			} else {
				currentMap[key] = val
			}
		}
	}

	return json.Marshal(root)
}
