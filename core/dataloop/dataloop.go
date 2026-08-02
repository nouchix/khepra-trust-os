// Package dataloop implements the KHEPRA Autonomous Governance Data Loop Engine:
// a closed-loop operational telemetry and intelligence system that connects agent
// intent, PDP/PEP governance rulings, ASAF actuation, ML-DSA-65 PQC proof (AEO),
// and predictive learning metrics across heterogeneous infrastructure.
//
// IP: SOUHIMBOU DOH KONE LLC, exclusively licensed to SecRed Knowledge Inc.
// Patent: USPTO #73565085 (KHEPRA Protocol)
package dataloop

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sync"
	"time"

	"github.com/nouchix/khepra-trust-os/core/aeo"
	"github.com/nouchix/khepra-trust-os/core/enforce"
)

// Intent describes the agent's declared operational goal.
type Intent struct {
	AgentID      string   `json:"agent_id"`
	Description  string   `json:"description"`
	TargetScope  string   `json:"target_scope"`
	AllowedTools []string `json:"allowed_tools"`
	Environment  string   `json:"environment"` // railway | aws | hetzner | sovereign_airgap
}

// TelemetryFrame captures runtime observations and environmental signals.
type TelemetryFrame struct {
	FIMDiffCount   int      `json:"fim_diff_count"`
	EgressTarget   string   `json:"egress_target"`
	LatencyMS      int64    `json:"latency_ms"`
	DriftFactor    float64  `json:"drift_factor"`
	StateDiffHash  string   `json:"state_diff_hash"`
	RiskIndicators []string `json:"risk_indicators"`
}

// ActuationOutcome records the physical interposition result.
type ActuationOutcome struct {
	Enforced    bool   `json:"enforced"`
	Interposer  string `json:"interposer"`
	Status      string `json:"status"` // executed | blocked | pending_approval
	Description string `json:"description"`
}

// IntelligenceSummary presents aggregated learning metrics from the Data Moat.
type IntelligenceSummary struct {
	TotalCycles           int64              `json:"total_cycles"`
	SafeRemediations      int64              `json:"safe_remediations"`
	FalsePositiveBlocks   int64              `json:"false_positive_blocks"`
	FAIRRiskScore         float64            `json:"fair_risk_score"`   // 0.0 - 100.0 financial & operational risk score
	CloudReliability      map[string]float64 `json:"cloud_reliability"` // env -> reliability score (0.0 - 1.0)
	RecommendedMaxPosture enforce.Posture    `json:"recommended_max_posture"`
}

// CycleResult captures the complete 6-step data loop record.
type CycleResult struct {
	CycleID       string             `json:"cycle_id"`
	AgentID       string             `json:"agent_id"`
	Environment   string             `json:"environment"`
	IntentHash    string             `json:"intent_hash"`
	Ruling        enforce.Ruling     `json:"ruling"`
	Actuation     ActuationOutcome   `json:"actuation"`
	Evidence      aeo.EvidenceObject `json:"evidence"`
	Telemetry     TelemetryFrame     `json:"telemetry"`
	FAIRRiskScore float64            `json:"fair_risk_score"`
	ProcessedAt   time.Time          `json:"processed_at"`
}

// DataLoop Engine orchestrates the 6-step governance loop and maintains the Data Moat.
type DataLoop struct {
	mu             sync.RWMutex
	pdpEngine      *enforce.Engine
	parentHashes   map[string]string // agentID -> last AEO hash
	cycles         []CycleResult
	envStats       map[string]*envStatsTracker
	modelSafety    map[string]int64
	falsePositives int64
}

type envStatsTracker struct {
	TotalCalls int64
	Successes  int64
}

// NewDataLoop initializes a DataLoop instance with an interposer PDP engine.
func NewDataLoop(interposer enforce.Interposition) *DataLoop {
	return &DataLoop{
		pdpEngine: &enforce.Engine{
			Interposer:     interposer,
			DriftThreshold: 3.0,
		},
		parentHashes: make(map[string]string),
		envStats: map[string]*envStatsTracker{
			"railway":          {TotalCalls: 10, Successes: 10},
			"aws":              {TotalCalls: 10, Successes: 10},
			"hetzner":          {TotalCalls: 10, Successes: 9},
			"sovereign_airgap": {TotalCalls: 10, Successes: 10},
		},
		modelSafety: make(map[string]int64),
	}
}

// ProcessCycle executes all 6 steps of the Autonomous Governance Data Loop.
func (dl *DataLoop) ProcessCycle(
	intent Intent,
	req enforce.ActionRequest,
	grant enforce.Grant,
	currentPosture enforce.Posture,
	sigs enforce.Signals,
	telemetry TelemetryFrame,
	privKey, pubKey []byte,
) (*CycleResult, error) {

	dl.mu.Lock()
	defer dl.mu.Unlock()

	// 1. Agent Intent Commitment
	intentHash := aeo.IntentHash(intent.Description)
	env := intent.Environment
	if env == "" {
		env = "railway"
	}

	// 2. Governance Decision (ASAF PDP Evaluation)
	ruling := dl.pdpEngine.Decide(req, grant, currentPosture, sigs)

	// 3. ASAF Actuation (Enforced State Change)
	actuation := ActuationOutcome{
		Enforced:   ruling.Enforceable,
		Interposer: ruling.EnforcedBy,
	}

	if ruling.Decision.Blocking() {
		actuation.Status = "blocked"
		actuation.Description = fmt.Sprintf("Actuation interdicted action %q: %s", req.Tool, ruling.Rationale)
	} else {
		actuation.Status = "executed"
		actuation.Description = fmt.Sprintf("Actuation permitted action %q on target %q", req.Tool, req.Target)
	}

	// 4. Cryptographic Proof (ML-DSA-65 Signed AEO)
	parentHash := dl.parentHashes[req.AgentID]
	toolCalls := []aeo.ToolCall{
		{
			Tool:      req.Tool,
			Target:    req.Target,
			StartedAt: time.Now().UTC().Add(-time.Duration(telemetry.LatencyMS) * time.Millisecond),
			LatencyMS: telemetry.LatencyMS,
			Outcome:   actuation.Status,
		},
	}

	obs := []aeo.Observation{
		{
			Target:     req.Target,
			Finding:    fmt.Sprintf("Interposition Ruling: %s (Posture: %s)", ruling.Decision, ruling.PostureOut),
			Confidence: 1.0,
			Evidence:   ruling.Hash(),
		},
	}

	ev := aeo.EvidenceObject{
		SpecVersion:  aeo.SpecVersion,
		AgentID:      req.AgentID,
		Task:         intent.Description,
		IntentHash:   intentHash,
		ToolsUsed:    []string{req.Tool},
		ToolCalls:    toolCalls,
		Observations: obs,
		BehaviorSignature: aeo.BehaviorSignature{
			ExecutionPattern: aeo.IntentHash(req.Tool + ":" + req.Target),
			LatencyVector:    []int64{telemetry.LatencyMS},
		},
		Timestamp:   time.Now().UTC(),
		ParentEvent: parentHash,
	}

	if err := ev.Seal(privKey, pubKey); err != nil {
		return nil, fmt.Errorf("dataloop: evidence sealing failed: %w", err)
	}

	// Update DAG chain pointer
	dl.parentHashes[req.AgentID] = ev.Hash

	// 5. Telemetry & FAIR Risk Computation
	fairRisk := computeFAIRRisk(ruling, telemetry)

	// 6. Data Intelligence Layer (Operational Learning Engine)
	if tracker, exists := dl.envStats[env]; exists {
		tracker.TotalCalls++
		if !ruling.Decision.Blocking() {
			tracker.Successes++
		}
	} else {
		dl.envStats[env] = &envStatsTracker{TotalCalls: 1, Successes: 1}
	}

	if !ruling.Decision.Blocking() {
		dl.modelSafety[intent.AgentID]++
	}

	cycleSum := fmt.Sprintf("%s:%s:%d", req.AgentID, ev.Hash, time.Now().UnixNano())
	cycleSumHash := sha256.Sum256([]byte(cycleSum))

	res := CycleResult{
		CycleID:       hex.EncodeToString(cycleSumHash[:16]),
		AgentID:       req.AgentID,
		Environment:   env,
		IntentHash:    intentHash,
		Ruling:        ruling,
		Actuation:     actuation,
		Evidence:      ev,
		Telemetry:     telemetry,
		FAIRRiskScore: fairRisk,
		ProcessedAt:   time.Now().UTC(),
	}

	dl.cycles = append(dl.cycles, res)
	return &res, nil
}

// GetIntelligenceSummary returns operational metrics and Moat analytics.
func (dl *DataLoop) GetIntelligenceSummary() IntelligenceSummary {
	dl.mu.RLock()
	defer dl.mu.RUnlock()

	var totalCycles int64 = int64(len(dl.cycles))
	var safeRemediations int64
	for _, count := range dl.modelSafety {
		safeRemediations += count
	}

	reliability := make(map[string]float64)
	for env, tracker := range dl.envStats {
		if tracker.TotalCalls > 0 {
			reliability[env] = float64(tracker.Successes) / float64(tracker.TotalCalls)
		} else {
			reliability[env] = 1.0
		}
	}

	avgRisk := 5.0
	if totalCycles > 0 {
		var riskSum float64
		for _, c := range dl.cycles {
			riskSum += c.FAIRRiskScore
		}
		avgRisk = riskSum / float64(totalCycles)
	}

	return IntelligenceSummary{
		TotalCycles:           totalCycles,
		SafeRemediations:      safeRemediations,
		FalsePositiveBlocks:   dl.falsePositives,
		FAIRRiskScore:         avgRisk,
		CloudReliability:      reliability,
		RecommendedMaxPosture: enforce.PostureNormal,
	}
}

func computeFAIRRisk(ruling enforce.Ruling, sigs TelemetryFrame) float64 {
	baseRisk := 2.5
	if ruling.Decision.Blocking() {
		baseRisk += 15.0
	}
	if sigs.DriftFactor > 2.0 {
		baseRisk += sigs.DriftFactor * 5.0
	}
	if sigs.FIMDiffCount > 0 {
		baseRisk += float64(sigs.FIMDiffCount) * 2.0
	}
	if baseRisk > 100.0 {
		baseRisk = 100.0
	}
	return baseRisk
}
