# KHEPRA MCP Trust Extension — AI Evidence Objects (AEO)

**Spec:** `khepra-aeo/1.0` · **Status:** Draft · **Reference implementation:** `pkg/aeo` in [PQC-Khepra-MCP](https://github.com/nouchix/PQC-Khepra-MCP) and [giza-cyber-shield](https://github.com/EtherVerseCodeMate/giza-cyber-shield)

> KHEPRA is the trust layer for autonomous AI systems. It gives every agent a
> cryptographic identity, a behavioral fingerprint, and an immutable history
> of actions. **"Trust me" becomes "Prove it."**

## 1. Problem — the autonomy Catch-22

AI agents today have identity, API keys, permissions, prompts, and outputs.
They lack **verifiable operational history**. When an agent reports
"I launched 8 subagents", nothing proves which subagents existed, what files
they inspected, what evidence they used, what they decided, or who approved it.

```
AI needs autonomy
      ↓
Autonomy requires trust
      ↓
Trust requires verification
      ↓
Verification requires observation
      ↓
Observation requires another trusted system
      ↓
Who verifies that verifier?
```

KHEPRA's answer is a **cryptographically anchored evidence fabric**: every
record is self-verifying (post-quantum signature + content address) and
cross-anchored (DAG parentage), so no single trusted observer is required.

## 2. The fundamental unit: the AI Evidence Object

The AEO is not a log line. It is a signed, content-addressed, chained
forensic artifact produced for every agent task:

```json
{
  "spec_version": "khepra-aeo/1.0",
  "agent_id": "did:khepra:REVIEWAGENTLATTICEHASH...",
  "task": "security audit PQC-Khepra-MCP",
  "intent_hash": "…committed BEFORE execution…",
  "tools_used": ["filesystem", "github", "static-analysis"],
  "observations": [
    {
      "target": "pkg/auth/pqc_auth.go",
      "finding": "missing signature validation",
      "confidence": 0.97
    }
  ],
  "behavior_signature": {
    "execution_pattern": "…hash of ordered tool sequence…",
    "tool_graph": "…hash of tool transition edges…",
    "tool_graph_edges": ["filesystem->static-analysis", "github->filesystem"],
    "latency_vector": [12, 40, 7]
  },
  "timestamp": "2026-07-24T00:00:00Z",
  "parent_event": "…hash of the agent's previous AEO…",
  "hash": "…content address (Khepra lattice hash)…",
  "cryptographic_attestation": {
    "algorithm": "ML-DSA-65",
    "public_key": "…hex…",
    "signature": "…hex…"
  }
}
```

Key properties:

- **Identity binding** — `agent_id` is a `did:khepra` DID derived from the
  ML-DSA-65 public key. A valid signature from a foreign key fails
  verification even if the content is untouched.
- **Intent commitment** — `intent_hash` is recorded when the task *starts*,
  so the declaration provably precedes the action.
- **Behavioral fingerprint** — *how* the agent worked (execution pattern,
  tool transition graph, latency vector), not just what it produced. An
  impersonated or compromised agent is distinguishable by behavior.
- **Hash chain** — `parent_event` links each AEO to the agent's previous
  one. The chain is the agent's Proof of Work History.
- **Post-quantum seal** — ML-DSA-65 (FIPS 204) signatures; content
  addresses over SHA-256 via the Khepra lattice encoding.

## 3. Agent State Vector

The engineering form of the "AI Soul Matrix":

```
S(t) = Identity + Intent + Capabilities + Memory + Actions + Behavior + Evidence + Trust
```

Every AEO records one transformation `S(t0) → Action → S(t1)`. The
"anti-action" is **forensic replay**: `Ledger.Replay(agentID)` re-verifies
every signature, chain link, and timestamp from genesis to tip, and returns
the history *iff* the entire state transition sequence is provable from
evidence alone.

## 4. Secure MCP — the protocol extension

MCP today:

```
Agent → calls → Tool
```

KHEPRA MCP Trust Extension:

```
Agent
  → proves identity        (did:khepra + ML-DSA-65)
  → records intent          (intent_hash, pre-execution)
  → calls tool              (recorded as ToolCall)
  → generates evidence      (Observation + sealed AEO)
  → anchors evidence        (DAG node AEO_RECORDED / AKOMA_NTOSO)
  → updates reputation      (Trust score)
```

## 5. Trust scoring

`Ledger.Trust(agentID)` scores an agent 0–100 from its full history:

| Component | Weight | Question |
|---|---|---|
| Integrity | 50% | Do all signatures verify and all chain links hold? |
| Consistency | 30% | Is the behavioral fingerprint stable across events (Jaccard similarity of tool graphs)? |
| Intent | 20% | Did the agent commit its intent before acting? |

NETSCOUT asks: *"Is the network behaving normally?"*
KHEPRA asks: *"Is this autonomous entity behaving consistently with its
identity and history?"* Different problem. Different category:
**Agent Citizenship Infrastructure.**

## 6. CMMC 2.0 evidence generation

The same AEO that proves what an agent did doubles as assessor-grade
audit evidence. `CMMCEvidence(aeo)` maps every verified object to:

| Practice | NIST 800-171 | Why the AEO satisfies it |
|---|---|---|
| CMMC.AU.L2-3.3.1 | 3.3.1 | AEO is a complete system audit record |
| CMMC.AU.L2-3.3.2 | 3.3.2 | Actions traceable to a unique agent DID |
| CMMC.AU.L2-3.3.8 | 3.3.8 | Audit info protected: signed + DAG-anchored |

AEOs wrapping Imhotep's Eye forensic host snapshots
(`Recorder.RecordForensicSnapshot`) additionally substantiate
**SI.L2-3.14.6**, **SI.L2-3.14.7**, and **IR.L2-3.6.1** — the host's
condition and the entity that observed it are sealed into one verifiable
record.

## 7. The Agent Passport (`khepra-passport/1.0`)

The `citizenship` package composes an agent's full record into one portable,
registrar-signed credential — the passport of Digital Citizenship:

```json
{
  "spec": "khepra-passport/1.0",
  "agent_id": "did:khepra:…",
  "issued_at": "2026-07-24T00:00:00Z",
  "events": 42,
  "chain_tip": "…hash of the latest AEO…",
  "first_seen": "…genesis timestamp…",
  "last_seen": "…tip timestamp…",
  "behavior_baseline": "…tool-graph hash of the tip AEO…",
  "trust_score": 97,
  "integrity_score": 100,
  "consistency_score": 94,
  "intent_score": 100,
  "registrar": "KHEPRA Registrar",
  "registrar_id": "did:khepra:…issuer…",
  "hash": "…content address…",
  "attestation": { "algorithm": "ML-DSA-65", "public_key": "…", "signature": "…" }
}
```

Rules of issue:

- **Citizenship is earned by record, not asserted** — a passport is only
  issued after the agent's entire AEO chain replays and verifies end to end.
  Agents with no history are refused.
- **Two verification paths** — `Verify()` checks the document (hash,
  ML-DSA-65 signature, registrar identity binding) for relying parties that
  trust the registrar; `VerifyAgainstLedger()` re-derives every claim from
  the evidence for parties that don't.
- **Stale-but-honest** — a passport whose chain tip has since advanced still
  verifies against the ledger as long as its tip appears at the claimed
  position in the verified chain.
- **Revocation** — only the issuing registrar can re-issue with the revoked
  flag; relying parties honor the newest registrar-signed statement.

## 8. Pipeline summary

```
[Agent task / forensic snapshot]
        │
        ▼
Recorder (intent commit → tool calls → observations)
        │
        ▼
EvidenceObject (behavioral fingerprint + content address)
        │
        ▼
ML-DSA-65 seal (FIPS 204 post-quantum signature)
        │
        ▼
Ledger.Append (chain enforcement + duplicate/fork rejection)
        │
        ▼
KHEPRA DAG anchor (AEO_RECORDED node, Akoma Ntoso)
        │
        ▼
Trust score · Forensic replay · CMMC evidence export
```

---
*IP: SOUHIMBOU DOH KONE LLC, exclusively licensed to SecRed Knowledge Inc. ·
Patent: USPTO #73565085 (KHEPRA Protocol)*
