# KHEPRA Trust OS (KTOS)

**The trust layer for autonomous AI systems.** KTOS gives every AI agent a
cryptographic identity, a behavioral fingerprint, and an immutable history of
actions — the first digital citizenship protocol for AI agents.

> "Trust me" becomes **"Prove it."**

---

## Why KTOS exists

AI agents today have identity, API keys, permissions, prompts, and outputs.
What they lack is **verifiable operational history**. When an agent reports "I
ran a security audit and launched 8 subagents," nothing proves which subagents
existed, what they inspected, what evidence they used, what they decided, or who
approved it. The answer today is *trust me*.

That gap becomes a Catch-22 as agents gain autonomy:

```
autonomy → requires trust → requires verification → requires observation
        → requires another trusted system → who verifies that verifier?
```

KTOS answers it with a **cryptographically anchored evidence fabric**: every
record is self-verifying (post-quantum signature + content address) and
cross-anchored (hash-chained and DAG-anchored), so no single trusted observer is
required. Where network tools ask *"is the traffic normal?"*, KTOS asks *"is this
autonomous entity behaving consistently with its identity and history?"* — a
different problem, and a new category: **Agent Citizenship Infrastructure.**

## How it works

Every agent action becomes a forensic artifact, and those artifacts compose into
a portable credential:

```
agent action
   │
   ▼
AI Evidence Object (AEO)   content-addressed · ML-DSA-65 signed · hash-chained
   │   identity · declared intent · tools used · observations ·
   │   behavioral fingerprint · parent-event link
   ▼
Ledger                     chain enforcement · KHEPRA DAG anchoring · forensic replay
   │
   ▼
Trust score                integrity · behavioral consistency · intent coverage
   │
   ▼
Agent Passport             registrar-signed credential of digital citizenship
```

- **AI Evidence Object (`khepra-aeo/1.0`)** — the fundamental unit. Each records
  the agent's `did:khepra` identity, a pre-execution intent hash, the tools it
  used, its observations, and a behavioral fingerprint (execution pattern, tool
  transition graph, latency vector), sealed with an ML-DSA-65 (FIPS 204)
  signature over a content-addressed hash and linked to the previous event.
- **Forensic replay (the "anti-action")** — an agent's history is valid only if
  every state transition re-verifies from evidence, genesis to tip.
- **Agent Passport (`khepra-passport/1.0`)** — a registrar-signed credential
  composing identity + verified history + behavioral baseline + trust standing.
  Citizenship is *earned by record, not asserted*: no passport is issued without
  a fully replayed, verified chain.

Full protocol: [`docs/AEO_TRUST_EXTENSION.md`](docs/AEO_TRUST_EXTENSION.md).

## Repository layout

This is the KTOS product monorepo (private).

| Path | What it is |
|---|---|
| `src/` | KTOS **console** — the operator surface (TanStack Start + React + Tailwind) |
| `core/` | **Go planes** — self-contained module `github.com/nouchix/khepra-trust-os/core`. Trust layer landed: `core/aeo`, `core/citizenship` (+ interim `adinkra`/`dag`/`forensics` support copies) |
| `deploy/` | Deployment profiles (e.g. `deploy/profiles/sovereign`) |
| `ops/guards/` | Enforceable TRL10 controls run in CI (see Sovereignty boundary below) |
| `ports/` | UI/logic ports staged for migration (e.g. `ports/asaf/compliance-graph`) |
| `docs/` | Architecture (`ARCH-010`, reconciliation) and protocol specs |
| `PQC-Khepra-MCP` | Reference to the public post-quantum MCP kernel |
| `supabase/` | Console backend config + migrations |

## Premium Tiers

| Tier | Price | License Key | Tools | Egress |
|------|-------|-------------|-------|--------|
| **Enterprise** | $499/mo | ✅ Required | All 80 tools | Zero |
| **Sovereign** | Custom — [Contact Sales](https://khepra.nouchix.com/) | ✅ Required | All 80 tools + air-gap/offline licensing + HSM | Zero |

> [!NOTE]
> **Open-Source Kernel**: The Community (Free) and Pro ($19/mo) tiers are served exclusively via the public [PQC-Khepra-MCP](https://github.com/nouchix/PQC-Khepra-MCP) repository. This private repository is the commercial landing zone containing the advanced capabilities detailed below.

---

## Tool Matrix

### Enterprise & Sovereign (Included in KTOS)
*Focus: Distributed orchestration, active defense, and CMMC compliance.*
- **All 80 Tools from the Open-Source Kernel**
- `khepra_edge_exec` (Bolt Edge Node remote execution)
- `khepra_bolt_scan` (Remote threat scanning)
- `cmmc_assess`
- `dag_attestation`
- `kasa_crypto_agent`
- `kasa_forensics`
- **Hub & Fleet Architecture** (Orchestrate Sentinels globally)
- **AI Evidence Objects (AEO)** (Immutable forensic trails)
- **Privileged Enforcement Daemon** (Actuation and remote quarantine)

## Architecture & trajectory

Per [`docs/architecture/ARCH-010-convergence-and-public-split.md`](docs/architecture/ARCH-010-convergence-and-public-split.md),
KTOS is converging behind a deliberate public/private split:

- **`nouchix/khepra-trust-os` (this repo, private)** is the **Fully Commercial, Closed-Source Version**. It is the authoritative commercial landing zone serving enterprise and defense customers. Beyond the baseline open-source kernel, it introduces advanced AI Governance, Runtime Security, Actuation policies (Privileged Enforcement Daemon), and complete AEO (Agentic Evidence Object) management.
- **`nouchix/PQC-Khepra-MCP` (public)** is the **Open-Source Reference Implementation**, provided as a national security contribution to the community. It is strictly scoped to the foundational post-quantum MCP kernel.
- **Dependency direction is one-way:** private `core/` (Trust OS) imports the public kernel as a tagged Go module; the open-source repository never imports any private commercial capabilities.

Product planes migrate from the public repo into `core/` one at a time, each a
paired PR (add private / remove public), guards green on both sides — see
[`core/README.md`](core/README.md) for the migration order and rules.

## Development

### Console (`src/`)

```sh
npm i
npm run dev        # vite dev server
npm run lint
npm run build
```

### Core Go planes (`core/`)

The module is self-contained and vendored, so it builds and tests fully offline:

```sh
cd core
go vet ./...
go test ./...                 # aeo + citizenship + mcp suites run green
go run ./cmd/ktos-mcp --demo  # end-to-end trust demo (real PQC signatures)
go build -o ktos-mcp ./cmd/ktos-mcp && ./ktos-mcp   # stdio MCP server
```

The **KTOS Trust MCP server** (`core/mcp`, `core/cmd/ktos-mcp`) is the
validation-partner surface: any MCP client drives the trust layer through it.
Partner brief: [`docs/MVP_QUICKSTART.md`](docs/MVP_QUICKSTART.md).

## Sovereignty boundary (guard G-1)

A customer's CUI compliance data plane (Hub, Fleet, DAG, scan findings) must
**never** land on a NouchiX-operated vendor host — sovereignty is *enforced*, not
asserted in a comment. CI runs `ops/guards/sovereignty_boundary_guard.sh`, which
fails the build if any shipped client defaults a data-plane URL to a vendor
domain. Control-plane endpoints (telemetry, licensing) are allowed; public demo
surfaces must be acknowledged in `ops/guards/sovereignty_allowlist.txt` as
DEMO/SYNTHETIC. Agent working rules live in [`AGENTS.md`](AGENTS.md).

## Lovable

This project is connected to [Lovable](https://lovable.dev); commits to the
connected branch sync back into the editor. Keep `main` in a working state and
avoid rewriting published history (force-push, rebase/amend/squash of pushed
commits) — it rewrites history on Lovable's side.

---

*IP: SOUHIMBOU DOH KONE LLC, exclusively licensed to SecRed Knowledge Inc. ·
Patent: USPTO #73565085 (KHEPRA Protocol). Private repository.*


---
### 🚀 System Architecture Update: Public Kernel Extraction Complete
**Status:** ✅ Condition 3 (Kernel Standalone) Met

The core Khepra MCP (`PQC-Khepra-MCP`) has been successfully decoupled from all proprietary orchestration and security planes (Adinkra, Sekhem, Giza). Through the introduction of the `kernelports` dependency injection boundary, the `khepra-kernel` now builds and operates in complete isolation. All legacy internal tools continue to compile seamlessly against the original repository. 

*This paves the way for the formal Apache-2.0 open-source release of the standalone PQC-Khepra-MCP kernel!*
