# KTOS MVP — Quickstart & Technical Validation Partner brief

**KHEPRA Trust OS is the trust layer for autonomous AI agents.** Plug the KTOS
MCP server into your agent stack and every agent action becomes a
post-quantum-signed, content-addressed forensic record — instantly giving you
verifiable agent history, live trust scores, portable Agent Passports, and
cross-host determinism proofs. *"Trust me" becomes "Prove it."*

This MVP is the surface we're taking to **Technical Validation Partners**: run
it against your real agents, generate real evidence and metrics, and co-produce
the social proof.

---

## 30-second proof

From the repo root — no network, no setup, real cryptography:

```sh
cd core
go run ./cmd/ktos-mcp --demo
```

You'll see an agent onboarded, actions recorded into a hash chain, a forensic
replay, a 0–100 trust score, an issued-and-verified Agent Passport, a
**dual-anchor determinism proof** (agreeing hosts → `DETERMINISTIC`; a tampered
host → auto `DRIFT` finding), and aggregate metrics. Every line is a genuine
ML-DSA-65 signature over a content address — verifiable offline, nothing
fabricated.

## Run the MCP server

```sh
cd core && go build -o ktos-mcp ./cmd/ktos-mcp
./ktos-mcp        # speaks MCP over stdio (JSON-RPC 2.0; logs on stderr)
```

Wire it into any MCP client (Claude Desktop / Cursor / Antigravity):

```json
{
  "mcpServers": {
    "khepra-trust-os": { "command": "/path/to/ktos-mcp" }
  }
}
```

The server is transport-agnostic, so the same binary runs behind both planes
(see below). `core/cmd/ktos-mcp/server.json` is the registration manifest.

## The tools

| Tool | What it does |
|---|---|
| `agent_register` | Mint an ML-DSA-65 agent identity (`did:khepra`). |
| `aeo_record` | Seal one agent action as a signed, chained AI Evidence Object. Optional `transport` + `classification` tags. |
| `aeo_verify` | Verify one AEO: hash integrity + ML-DSA-65 signature + identity binding. |
| `ledger_replay` | Forensic replay — re-verify an agent's full history genesis-to-tip. |
| `trust_score` | 0–100 trust standing (integrity / consistency / intent). |
| `passport_issue` | Issue a registrar-signed Agent Passport (refused without verified history). |
| `passport_verify` | Verify a passport document and re-derive its claims against the ledger. |
| `dual_anchor` | Attest the same action across two transports; matching SHA-256 anchors prove determinism, divergence emits a signed drift finding. |
| `ledger_stats` | Aggregate trust metrics for a traction dashboard. |

Protocol schema: [`AEO_TRUST_EXTENSION.md`](AEO_TRUST_EXTENSION.md)
(`khepra-aeo/1.0` + `khepra-passport/1.0`).

## Two transports, one product story

The same MCP server runs behind two planes — this split *is* the product, not a
redundancy:

```
                 ┌─────────────────────────┐
                 │   KHEPRA Policy Engine   │
                 └───────────┬──────────────┘
                             │  classification
               ┌─────────────┴──────────────┐
               ▼                             ▼
    mcp.smithery.run/skone          mcp.souhimbou.ai
    (discovery • marketplace)       (sovereign • air-gap-capable)
               │                             │
               └─────────────┬───────────────┘
                             ▼
                    KTOS Evidence Fabric
                 (dual-anchor AEOs, drift findings)
```

- **Discovery / marketplace** (`mcp.smithery.run/skone`) — public catalog,
  traction metrics, third-party onboarding.
- **Sovereign execution** (`mcp.souhimbou.ai`) — customer-owned, no third party
  in the trust boundary; the plane for CUI / ITAR / CMMC L3 work.
- **Dual-anchor attestation** — run the same call against both, hash both
  responses, and `dual_anchor` lands two mirror-linked AEOs plus a signed
  determinism verdict. Match → determinism proven; diverge → automatic drift
  report. A live demonstration of *trust the protocol, not the host*.

## For a Technical Validation Partner

**You plug in:** the `ktos-mcp` server, in front of (or alongside) your existing
agents — no change to your agent logic; it records what your agents already do.

**You get back:**
- **Evidence** — every agent action as a verifiable, tamper-evident, PQC-signed
  record; a forensic history you can replay and hand to an auditor.
- **Metrics** — per-agent trust scores and fleet-level aggregates
  (`ledger_stats`) for dashboards.
- **Assurance** — Agent Passports to gate which agents you let act, and
  dual-anchor determinism/drift detection across hosts.

**We co-produce:** the case study, the metrics, and the social proof — and use
your validation to harden the path to CMMC/DoD-grade deployments.

## MVP scope & what's next

This is a **hasty MVP**: state is in-memory and non-persistent (one process, a
demo/validation surface — not yet the durable production ledger). On the
roadmap, in priority order:

1. Durable, DAG-backed persistence for the ledger.
2. PQC-in-transit (X25519+ML-KEM hybrid TLS) on the sovereign plane.
3. Classification-aware transport routing driven by the policy engine.
4. True two-node DAG mirror linkage for dual-anchor (the underlying `core/dag`
   already supports multi-parent nodes).

---
*IP: SOUHIMBOU DOH KONE LLC, exclusively licensed to SecRed Knowledge Inc. ·
Patent: USPTO #73565085 (KHEPRA Protocol).*
