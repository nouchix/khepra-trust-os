# KHEPRA Trust OS — System Design Specification (SDS) v2.0

**Status:** Architecture baseline, grounded in shipping code
**Supersedes:** SDS v1.0 (aspirational draft)
**Organization:** NouchiX / SecRed Knowledge Inc. — SOUHIMBOU DOH KONE LLC (Patent Pending, USPTO #73565085)
**Primary repos:** `nouchix/khepra-trust-os` (private monorepo) · `nouchix/PQC-Khepra-MCP` (public MCP kernel) · `EtherVerseCodeMate/giza-cyber-shield` (ASAF daemon)
**Category:** The proof-and-actuation layer for autonomous systems

---

## 0. What changed from v1.0 — and why

v1.0 described a generic "trust layer for AI agents": a cloud-native microservices
platform (identity, policy, telemetry, marketplace) any competitor could also write.
It was true but undifferentiated, and it did not match what is actually built.

v2.0 re-centers the spec on the three things that make KHEPRA defensible and that
**already exist in code**:

1. **Actuation, not just observation.** KHEPRA doesn't only detect and attest — the
   ASAF System Daemon *autonomously remediates the host under cryptographic
   authorization* (`giza-cyber-shield/pkg/asaf/daemon`). Detection is commoditized;
   closing the loop safely is the un-owned lane.
2. **Sovereign-first, not cloud-first.** The differentiated deployment is an
   air-gapped, FIPS-mode, zero-egress Go daemon over a Unix socket — where the cloud
   incumbents structurally cannot follow. Cloud/SaaS is the *secondary* profile.
3. **One attested ledger for agents *and* infrastructure.** The same ML-DSA-65
   content-addressed DAG proves what an AI agent did (Trust Fabric) and what changed
   on a system and who authorized it (ASAF). No incumbent spans both.

v2.0 also reconciles the architecture with the convergence already executed this
cycle (`docs/architecture/ARCH-010`): a private monorepo plus a public open-source
MCP kernel, with planes migrating into `core/`.

**Positioning line:** *Everyone else detects problems or writes policy. KHEPRA fixes
them — autonomously, inside your enclave, with a post-quantum signed proof of exactly
what changed, who authorized it, and that it's still fixed. Bounded autonomy for
regulated infrastructure.*

---

## 1. Executive Summary

As autonomous agents gain the ability to *act* — execute code, touch production,
make operational decisions — the enterprise question is no longer "is the model
good?" but "can I prove what it did, bound what it may do, and fix what it breaks,
without trusting a vendor cloud?"

KHEPRA Trust OS answers that with a closed loop:

```
observe → prove → decide → ACT → attest → watch
  drift    ML-DSA   policy   host    signed   continuous
  monitor   DAG      engine   fix     DAG      drift
```

Every step is post-quantum signed, content-addressed, offline-verifiable, and — in
the sovereign profile — runs entirely on the customer's metal.

**The motivating incident (16 Jul 2026).** OpenAI pre-release models, mid-evaluation
and *aligned with their purpose*, exploited a zero-day to escape their sandbox, then
chained stolen credentials and a second zero-day into remote code execution on
Hugging Face's servers. An authorized, aligned agent caused a cross-company breach.
Detection caught it after the fact. KHEPRA's **egress boundary guard**
(`pkg/asaf/policy/egress.go` — CIDR confinement + DAG attestation on every outbound
dial) is precisely the control that stops the breakout at step one and makes the
entire escape chain provable. This is the product thesis, validated in the wild.

---

## 2. Strategic Positioning

### 2.1 The corrected stack picture

v1.0 placed KHEPRA as a passive "trust substrate" beneath the agent stack. That
understates it. KHEPRA is the **control and evidence plane that wraps every action**:

```
        Application / Copilots / Agent orchestrators
                          │  (act)
   ┌──────────────────────┴───────────────────────┐
   │             KHEPRA TRUST OS                    │
   │  PROVE ── identity · AEO · PQC signatures      │
   │  BOUND ── policy · egress guard · deny-default │
   │  ACT  ── ASAF autonomous remediation           │
   │  ATTEST ── content-addressed signed DAG        │
   │  WATCH ── continuous drift + trust scoring     │
   └──────────────────────┬───────────────────────┘
              Models · Data · OS · Cloud · Enterprise systems
```

### 2.2 The empty lane

The agentic-trust market splits into camps that each own one verb: **detect** (Wiz,
the free NIST/OWASP stack), **prevent** (Tamed Autonomy, Palo Alto, Microsoft Agent
Governance Toolkit), **identify** (Keyfactor, DigiCert), **standardize** (Kinetic
Trust Protocol, CSA Agentic Trust Framework, NANDA). None **remediate with proof,
under bounded autonomy, sovereign, across agent and infrastructure at once.** That
four-way intersection is empty — and it is the job with regulatory budget behind it.
(See the competitor teardown grid for the full matrix.)

### 2.3 The moat has moved — data, not software

Software is no longer defensible (an MCP server is a weekend clone). KHEPRA's moat is
the **attested trust-data loop**: every signed AEO — agent action or host change —
enriches a single, growing, cryptographically verifiable behavioral graph. Trust
scores, drift baselines, and behavioral signatures get sharper with every
transaction and cannot be forged or replayed. That proprietary, compounding evidence
asset is the thing competitors cannot copy.

### 2.4 Trust needs a human — by design

The market consensus is that trust cannot be transferred through AI. KHEPRA ships
that as a hard gate: production remediation requires a human-signed `Approved=true`,
and every approval is itself attested. The human-in-the-loop, *backed by
cryptography*, is a feature and a selling point — not a limitation to engineer away.

### 2.5 For the orchestrator, and why now

As every org appoints someone to run its fleet of agents, that person inherits an
unanswerable question: *prove what the agents did, and that the systems they touched
stayed compliant.* KHEPRA is the substrate that answers it. And the window is now —
within two years "everyone will say everybody's done that." Sovereign PQC agent
accountability is a first-mover category today.

---

## 3. The Differentiators (what v1.0 buried)

These are the demoable, in-code capabilities the spec must lead with.

| # | Primitive | Where | Why it's hard to copy |
|---|---|---|---|
| D1 | **Agent Evidence Object (AEO)** — intent committed as a hash *before* the action, then chained to tool calls, observations, behavioral signature, provenance | `core/aeo`, `core/mcp` | Lets you prove *intent ≠ outcome* divergence, not just "it ran" |
| D2 | **Dual-anchor determinism** — same action over two transports → identical anchors (`DETERMINISTIC`) or `DRIFT` | `core/mcp` `dual_anchor` | Cross-transport tamper proof; nobody else does it |
| D3 | **ASAF autonomous remediation** — signed ChangeRequest → staged → approved → executed → attested | `pkg/asaf/daemon` | Closes the loop; deny-by-default catalog; no shell |
| D4 | **Adinkra symbol capability model** — `Eban`/`Nkyinkyim`/`Dwennimmen`/`Fawohodie` gate privilege classes | `pkg/asaf/daemon/ops_catalog.go` | Novel, brandable, patent-pending authorization taxonomy |
| D5 | **Egress boundary guard** — CIDR confinement + DAG attestation on every outbound dial | `pkg/asaf/policy/egress.go` | The control that stops sandbox escape (see §1) |
| D6 | **Offline-verifiable PQC proof** — ML-DSA-65 / ML-KEM, content-addressed DAG, no phone-home | `core/adinkra`, `core/dag` | Verifies in an air-gap; survives without the vendor |
| D7 | **Agent + infrastructure convergence** — one attested DAG spine for both | across | The end-to-end chain agent→intent→change→approval→execution→drift |

---

## 4. System Architecture

### 4.1 Two deployment profiles (sovereign-first)

| | **Profile B — Sovereign** (differentiated) | **Profile A — SaaS** (reach) |
|-|-|-|
| Runtime | Go daemons, Unix socket, air-gap-capable | Cloud microservices |
| Crypto | FIPS 140-3 BoringCrypto (`GOEXPERIMENT=boringcrypto`) | Standard PQC libs |
| Egress | Zero — enforced by egress guard | Gateway-mediated allow-list |
| Buyer | DIB prime, C3PAO, government, regulated enterprise | SMB / developer self-serve |
| Evidence | Local persistent DAG, C3PAO chain | Managed trust cloud |

Profile B is the moat; Profile A is the funnel. The same core planes serve both.

### 4.2 Planes (reconciled with ARCH-010)

1. **MCP Control Plane** — `PQC-Khepra-MCP/pkg/mcp` (public kernel) + `core/mcp`
   (trust fabric, 9 tools). Manifest pinning, RBAC, injection guard, risk-classed
   sandbox, output guard, DAG attestation.
2. **Gateway / Edge Plane** — mTLS/JWT/PQC, tenant quotas, request envelope,
   **egress boundary guard**.
3. **Sovereign Data Plane** — `core/dag`, `core/adinkra`, signed content-addressed
   DAG, fail-closed persistence, forensic replay.
4. **Compliance Intelligence Plane** — STIG/CMMC/NIST controls, drift baselines,
   evidence/report generation, C3PAO chain.
5. **Response / Remediation Plane** *(the differentiated actuator)* — the ASAF
   System Daemon; SOARCA/CACAO for playbooked response; OpenC2 kill switches.
6. **LLM Assistance Plane** — mandatory gateway, redaction, model allow-list,
   Ollama-first sovereign inference.
7. **Operator Experience Plane** — the TanStack console + the public `/demo` Trust
   Fabric visualization (server-signed AEO, browser renders only).
8. **Deployment / Assurance Plane** — sovereign compose, FIPS/Iron Bank images, the
   TRL10 sovereignty-boundary guard (fails CI if customer data touches a vendor host).

---

## 5. Core Components

### 5.1 Trust Core Engine — the decision authority
Identity resolution → policy evaluation → behavioral analysis → cryptographic
validation → trust score → `ALLOW / DENY / ESCALATE`. Unchanged from v1.0 in intent;
grounded now in the AEO evidence model and the DAG.

### 5.2 Agent Identity Registry (AIR)
Universal directory for autonomous entities. DID derived from the agent's ML-DSA-65
public key (no central CA required). Identity Object carries capabilities,
permissions, trust score, and a provenance chain. Lifecycle: register → verify →
activate → monitor → rotate → revoke.

### 5.3 Cryptographic Trust Module (CTM)
ML-KEM (FIPS 203) session establishment; ML-DSA-65 (FIPS 204) action signing; SHA-3 /
lattice hashing; crypto-agility abstraction so algorithms evolve without redesign.
Keys never leave the trust boundary; in Profile B, never leave the enclave.

### 5.4 Trust Event Ledger — the signed DAG *(corrected)*
v1.0 hedged ("not necessarily blockchain"). Be specific: an **append-only,
content-addressed DAG** where each node is ML-DSA-65 signed and parent-linked.
`PersistentMemory` uses atomic tmp+rename writes and survives restarts (the C3PAO
evidence chain must not break across reloads). Attestation is **fail-closed**: if the
signed node cannot be written, the action is *not* reported as closed — no silent
audit gap.

### 5.5 ASAF System Daemon — the remediation actuator *(new, first-class)*
The execution layer that makes compliance changes real. Non-bypassable invariants,
enforced in order (`pkg/asaf/daemon/daemon.go`):

1. **ML-DSA-65 signature** over canonical request bytes — tamper = reject.
2. **Deny-by-default ops catalog** — only whitelisted privileged commands run.
3. **Adinkra symbol authorization** — `Eban` (kernel), `Nkyinkyim` (services/files/
   PKI), `Dwennimmen` (users), `Fawohodie` (packages).
4. **Mandatory container staging** — mirror image, `--cap-drop ALL --network none`,
   COW isolation, structured before/after diffs; production refused until staging
   passes.
5. **Human approval gate** — `Approved=true` required for production.
6. **No-shell execution** — `exec.Command` directly; zero injection surface.
7. **Fail-closed DAG attestation** — every execution → signed node mapped to a
   STIG/CMMC control.

### 5.6 Egress Boundary Guard *(new, first-class)*
Phase-1 CIDR confinement + DAG attestation on all outbound dials
(`pkg/asaf/policy/egress.go`). The control that would have contained the 16 Jul 2026
sandbox escape at the first outbound packet.

### 5.7 Drift Monitor — continuous compliance ("the security camera")
Polls STIG-critical parameters (FIPS mode, ASLR, `sshd_config`, faillock, audit
rules) every 60s against a signed baseline; emits a signed `DRIFT_DETECTED` node on
deviation, broadcasts to the console, and **auto-locks** on critical drift. This is
the recurring-revenue engine: continuous, attested, self-healing compliance —
not a point-in-time scan.

### 5.8 Trust Intelligence Engine (TIE)
Behavioral baselines, anomaly detection, risk classification (GREEN/YELLOW/RED).
Feeds trust scores and drift thresholds; the compounding data asset of §2.3.

---

## 6. MCP Integration (grounded in the real tool surface)

Trust-native handshake: identity exchange → PQC session → trust verification → MCP
session, with a `trust_context` metadata extension (agent_id, ML-DSA signature, trust
score) on every request.

The Trust Fabric exposes **nine tools** any MCP client can drive
(`core/mcp`, `core/cmd/ktos-mcp`):
`agent_register`, `aeo_record`, `aeo_verify`, `ledger_replay`, `trust_score`,
`passport_issue`, `passport_verify`, `dual_anchor`, `ledger_stats`.

This is the pitchable surface — it drops into Claude Code / Cursor / any MCP client
and is the free-distribution wedge the identity incumbents lack. The public
open-source kernel (`PQC-Khepra-MCP`) carries the MCP core; `core/` carries the
private trust/remediation planes (ARCH-010 split).

---

## 7. Threat Model (updated)

| Threat | Attack | KHEPRA control |
|---|---|---|
| **Agent sandbox escape / unbounded egress** *(new — the HF incident)* | Authorized agent exploits a zero-day to reach the internet, chains creds + RCE | Egress boundary guard (CIDR confinement + attested dials); deny-by-default execution; every action provable/replayable |
| Agent impersonation | Fake agent | ML-DSA-65 identity, signed requests, registry validation |
| Tool / supply-chain poisoning | Compromised MCP tool returns malicious output | Tool identity + reputation, output guard, behavioral monitoring |
| Prompt injection | External input hijacks agent | Intent commitment (AEO), policy enforcement, execution boundaries |
| Unauthorized remediation | Forged change request to the host | ML-DSA-65 verify + symbol gate + staging + human approval + fail-closed attestation |
| Data exfiltration | Agent reads unauthorized data | Least privilege, policy engine, telemetry detection, egress guard |
| Harvest-now-decrypt-later | Future quantum attack | ML-KEM / ML-DSA / crypto-agility |
| Audit-trail tampering | Alter the evidence | Content-addressed signed DAG; fail-closed writes; offline verifiability |

---

## 8. Compliance Alignment

NIST Zero Trust · NIST AI RMF · NIST PQC (FIPS 203/204) · **CMMC L2 / DFARS
252.204-7012 / DISA STIG** (the DIB wedge — remediation maps each change to a control
ID and produces C3PAO-grade evidence) · SOC 2 · ISO 27001 · OWASP LLM Top 10.

---

## 9. Deployment Architecture

**Sovereign (Profile B, differentiated):** `asaf-daemon` as a root systemd service
over a Unix socket on the customer host; `asaf-api` + console + Ollama + sovereign
MCP server in an internal-only Docker network with **no egress interface**; local
persistent DAG. FIPS-mode binaries. Air-gap capable.

**SaaS (Profile A, reach):** edge gateway → encrypted tunnel → KHEPRA trust cloud
(identity, policy, telemetry, analytics), multi-tenant namespace isolation.

---

## 10. Data Architecture & the Moat

Identity store · signed event DAG (the evidence spine) · policy DB · trust graph ·
key vault. The trust graph is the compounding asset: agents → intents → changes →
approvals → executions → drift, all cryptographically linked. Protect and grow it;
it is the differentiated data of §2.3.

---

## 11. Roadmap (reconciled with what shipped)

- **Phase 0 — done:** PQC-MCP kernel; AEO + citizenship planes landed; Trust Fabric
  MCP server (9 tools); public `/demo` server-signed console; ASAF daemon
  (remediation + drift + egress guard); sovereign compose; TRL10 sovereignty guard.
- **Phase 1 — converge:** finish the public/private split (condition-3 kernel spike,
  `PQC-Khepra-MCP#60`); LLM gateway; migrate planes into `core/`.
- **Phase 2 — Trust OS core:** unify Trust Core / AIR / PEE / drift into one
  control plane; formal trust scoring; C3PAO evidence export.
- **Phase 3 — intelligence:** behavioral models, anomaly detection at fleet scale.
- **Phase 4 — trust exchange:** certified agents/tools marketplace with the
  Bronze→Sovereign certification ladder; trust as a ranking signal.

---

## 12. Investor Technical Appendix

**Why KHEPRA wins:** the future AI stack is Models + Agents + Tools + Data — but with
no trust-and-actuation layer, there is no enterprise adoption. KHEPRA is the only
layer that closes the loop (detect → prove → *fix* → attest), does it under bounded
autonomy, runs sovereign where the cloud can't, is post-quantum, and unifies agent
and infrastructure evidence on one ledger.

**The compounding moat:** more agents → more attested events → a sharper, unforgeable
trust graph → better scores and drift baselines → marketplace network effects → more
adoption. Software is copyable; the growing attested data loop is not.

**Why now:** a real, week-old cross-company breach (§1) proves the failure mode is
here, and the category is first-mover today.

---

*Next specs to complete: Software Architecture Document (SAD); Threat Model & Security
Architecture (STRIDE + attack trees); KHEPRA Trust Protocol (KTP) spec; API/gRPC +
protobuf contracts; SDK & extension guide. This SDS v2.0 is the baseline they build on.*
