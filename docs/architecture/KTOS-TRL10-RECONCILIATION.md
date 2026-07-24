# KTOS-TRL10 — Cross-Repository Reconciliation Architecture

**Document:** ARCH-RECON-001
**Date:** 2026-07-24
**Status:** Draft for review
**Scope:** Reconciles six repositories into a single TRL10 KHEPRA Trust OS (KTOS) product architecture.

---

## 1. What "TRL10" Means Here

The classic NASA scale ends at TRL 9 ("actual system proven in operational environment").
This codebase family already defines the extension internally — see
`Adinkhepra-ASAF/scripts/sovereignty_boundary_guard.sh`:

> *"TRL10 enforceable control … Sovereignty must be **enforced**, not **asserted in a comment**. This guard makes a violation fail loudly in CI."*

**KTOS TRL10 therefore means:** every security, sovereignty, and compliance claim the
product makes is backed by (a) an implemented control, (b) an automated test or CI guard
that fails loudly when the control is violated, and (c) a signed evidence event in the
audit DAG. A claim without all three is, by definition, below TRL10 and must not appear
in product/marketing/accreditation materials.

This document reconciles the two prior engineering reviews (PQC-Khepra-MCP architecture
review and khepra-trust-os independent codebase summary, both 2026-07-24) with a survey
of the four remaining repositories, and specifies what each repository contributes to —
or must be excluded from — the KTOS TRL10 build.

---

## 2. Repository Inventory and Assigned Roles

| Repository | Stack | License posture | KTOS role |
|---|---|---|---|
| `nouchix/khepra-trust-os` | TanStack Start, React 19, TS, Supabase | Proprietary (Lovable-linked) | **Product shell**: trust-evidence console, tenant/AEO data model, SaaS control plane |
| `nouchix/PQC-Khepra-MCP` | Go (75+ pkgs, 25 cmds), Next.js UI | Proprietary | **Security core**: MCP control plane, gateway, DAG/attestation, compliance engines, LLM plane |
| `nouchix/Adinkhepra-ASAF` | Next.js UI + Go release binaries, Docker Compose | Proprietary, patent-pending | **Sovereign deployment profile**: air-gap stack, FIPS 140-3 BoringCrypto build, TRL10 CI-guard pattern |
| `EtherVerseCodeMate/SOARCA-spartan` | Go 1.23 (COSSAS SOARCA fork) | **Apache-2.0** | **Response/orchestration plane**: CACAO v2 playbook engine, OpenC2/SSH/HTTP/PowerShell capabilities |
| `spectralplasma/worldmonitor` | TS SPA, Vercel/Railway/Tauri, ONNX workers | **AGPL-3.0** | **Pattern donor + optional intel feed** — patterns freely reusable; code reuse gated by license decision (§6) |
| `spectralplasma/Satellite-Open-Source` | README link catalog only (no code) | N/A | **Reference bibliography** for a future space/SATCOM segment. Nothing to integrate at TRL10 today |

Key structural facts confirmed in-tree:

- `khepra-trust-os` contains an **empty `PQC-Khepra-MCP/` directory** — an integration
  placeholder that currently ships nothing. This reconciliation replaces that implicit
  intent with an explicit contract (§5.1).
- ASAF's `docker-compose.asaf.yml` already composes the target sovereign quartet:
  `asaf-api` (Go compliance graph), `asaf-ui` (Next.js), `ollama` (local LLM),
  `khepra-mcp` (72-tool sovereign MCP server, zero egress) — plus a bare-metal
  `asaf-daemon` over a Unix socket. This is the closest existing artifact to a deployable
  KTOS sovereign profile.
- SOARCA-spartan retains upstream layout: `pkg/core/{decomposer,executors,capability}`
  with `http`, `ssh`, `openc2`, `powershell`, `manual`, `fin` capabilities and a JSON
  trigger/playbook/reporter API.
- worldmonitor demonstrates production-grade operational patterns KTOS lacks: seed/cache
  freshness tracking with stampede protection, edge rate limiting, HMAC'd MCP grants
  (`api/_mcp-grant-hmac.ts`), in-browser ONNX ML workers, variant-by-hostname builds,
  and a CI-enforced docs-accuracy check (`npm run docs:check`) — itself a TRL10-style
  "docs must match code" guard.

---

## 3. Target Plane Model and Repo → Plane Leverage Map

The seven planes from the PQC-Khepra-MCP review are adopted as the KTOS product planes.
Each plane now gets a **single owning repo** and named **donor repos** — the core
reconciliation decision. Duplicated capability outside the owner becomes legacy.

| # | Plane | Owner | Donors (what is leveraged) |
|---|---|---|---|
| 1 | **MCP Control Plane** | PQC-Khepra-MCP (`cmd/khepra-mcp`, `pkg/mcp`) | ASAF: 72-tool sovereign MCP routing config; worldmonitor: HMAC MCP-grant pattern |
| 2 | **Gateway / Edge Plane** | PQC-Khepra-MCP (`cmd/gateway`, `pkg/gateway`) | worldmonitor: edge rate-limit/session/CORS middleware patterns (`api/_rate-limit.js`, `api/_session.js`, `api/_cors.js`) |
| 3 | **Sovereign Data Plane** (DAG/attest/audit) | PQC-Khepra-MCP (`pkg/dag`, `pkg/attest`, `pkg/audit`, `pkg/evidence`) | khepra-trust-os: AEO/aeo_links relational projection + RLS model; ASAF: `data/dag` on-disk layout |
| 4 | **Compliance Intelligence Plane** | PQC-Khepra-MCP (`pkg/stig`, `pkg/compliance`, `pkg/intel`, `pkg/ert`, `pkg/poam`, `pkg/emass`, `pkg/sbom`) | khepra-trust-os: STIG Viewer + Smithery evidence-recording functions |
| 5 | **LLM Assistance Plane** | **New `LLMGateway` service** (built in PQC-Khepra-MCP, consumed by all) | PQC `pkg/llm` (Ollama-first), ASAF ollama compose service; worldmonitor: local-inference-first ML worker pattern |
| 6 | **Operator Experience Plane** | khepra-trust-os (TanStack console) | PQC `packages/dag-viewer`; ASAF `compliance-graph` UI (enrollment wizard, policy editor, staging gate, evidence export); worldmonitor: panel/layout + Tauri desktop patterns |
| 7 | **Deployment / Assurance Plane** | ASAF (sovereign compose + FIPS binaries + sovereignty guard) | PQC: Dockerfiles (fips/ironbank), `aws-govcloud`; SOARCA: Docker/compose reference; worldmonitor: multi-target CI (Vercel/Railway/Tauri/GHCR) patterns |
| 8 | **Response / Orchestration Plane** *(new — added by this reconciliation)* | SOARCA-spartan (CACAO v2 engine) | PQC `pkg/ir`, `pkg/acp`, `pkg/scada`; OpenC2 capability becomes the KTOS kill-switch/remediation actuator |

Plane 8 is the genuinely new capability this reconciliation adds: neither prior review
had an automated-response story. SOARCA's CACAO playbook engine (Apache-2.0, safely
embeddable) turns KTOS from *evidence + detection* into *evidence + detection +
standardized, auditable response* — a hard requirement for the incident-response gaps
flagged in both reviews (auto-revoke, kill switch by action class, tenant notification).

---

## 4. What to Leverage — Per Repository, Concretely

### 4.1 PQC-Khepra-MCP → the KTOS security kernel

Leverage (promote to KTOS core, with the P0 fixes from the prior review applied first):

- `pkg/mcp` admission chain (manifest pinning → provenance envelope → RBAC/injection
  guard → risk classifier → sandbox → output guard → DAG attestation) as the normative
  MCP state machine, fail-closed.
- `pkg/dag` + `pkg/attest` as the canonical evidence store — **with the fail-open
  fallback removed for production**: add `KHEPRA_AUDIT_FAIL_MODE=fail_closed` per the
  prior review's §5.2 decision, defaulting to fail-closed in `sovereign-prod` and
  `ironbank-prod` profiles.
- `pkg/stig`, `pkg/compliance`, `pkg/poam`, `pkg/emass`, `pkg/sbom` as the compliance
  engine behind the khepra-trust-os console (replacing the console's direct external
  STIG Viewer calls over time).
- `pkg/llm` Ollama client as the *only* provider adapter enabled in sovereign profiles.
- `cmd/gateway` as the DEMARC edge, upgraded per §5 defaults.

Do **not** leverage as-is:

- `pkg/llm/byok.go` direct OpenRouter calls and static-HTML browser→provider paths —
  build-tag `dev` only, excluded from all `*-prod` profiles (prior review §5.1).
- The 75-package surface wholesale. KTOS v1 imports the eight plane-owning package
  clusters only; the long tail (`agi`, `ising`, `lorentz`, `phantom`, `scorpion`, etc.)
  stays out of the TRL10 boundary until each earns its own control + guard + evidence.

### 4.2 khepra-trust-os → the KTOS product shell and tenant system of record

Leverage:

- The Supabase multi-tenant schema (`tenants`, `memberships`, `agents`, `sessions`,
  `aeos`, `aeo_links`, `findings`, `controls`, `rulepacks`) with RLS as the **relational
  projection** of the Go DAG — the console reads this projection; the Go DAG remains the
  cryptographic source of truth. Reconciliation rule: *every row in `aeos` must carry
  the content hash of a node in the signed DAG; a nightly CI job re-verifies the
  projection against the DAG and fails on drift* (a new TRL10 guard).
- `requireSupabaseAuth` middleware, dynamic service-role isolation, and the
  evidence-recording pattern in `src/lib/console/{stig,smithery,aeos}.functions.ts`.
- The HMAC + `timingSafeEqual` ingress at `/api/public/aeo` as the starting point for
  the tenant-bound ingress (upgraded per its review's P0: per-tenant keys, nonce +
  timestamp replay defense, tenant binding).

Fix before TRL10 (from its review, now assigned owners):

- Tenant selection via `.limit(1)` membership → explicit tenant context (owner: console).
- `getSessionDag` tenant metadata under-scoping → join on session's `tenant_id`.
- Demo endpoint: env-gated, edge rate-limited, origin-restricted; `ip_prefix` replaced
  with keyed-HMAC truncation.
- Empty `PQC-Khepra-MCP/` directory → replaced by the API contract in §5.1 (the console
  never vendors the Go tree; it speaks to it over the gateway).

### 4.3 Adinkhepra-ASAF → the sovereign deployment profile and the TRL10 method itself

Leverage:

- `docker-compose.asaf.yml` as the base of the KTOS `sovereign-prod` profile
  (asaf-api + UI + ollama + khepra-mcp + host daemon over Unix socket).
- FIPS 140-3 build recipe (`GOEXPERIMENT=boringcrypto`) for all Go binaries in
  `sovereign-prod` / `ironbank-prod`.
- **`scripts/sovereignty_boundary_guard.sh` + `sovereignty_allowlist.txt` as the
  template for the entire KTOS guard suite** (§7). Its control-vs-data-plane
  deny-by-default model (vendor hosts may carry telemetry/licensing/docs; never Hub,
  Fleet, customer DAG, findings, or vaults) is adopted verbatim as KTOS policy.
- The two-profile commercial split (SaaS Profile A / Sovereign Profile B) as the KTOS
  packaging model: khepra-trust-os console *is* Profile A's surface; the ASAF compose
  stack *is* Profile B's.
- `compliance-graph` UI components (enrollment wizard, policy editor, staging gate,
  evidence export) — port into the khepra-trust-os console rather than maintaining a
  second operator UI.

### 4.4 SOARCA-spartan → the response plane (Apache-2.0, embed freely)

Leverage:

- CACAO v2 playbook ingest/validate/execute engine (`pkg/core/decomposer`, `executors`)
  as the KTOS remediation engine. KTOS findings and LLM-gateway `block` decisions become
  playbook **triggers**; playbook steps execute through SOARCA capabilities.
- `pkg/core/capability/openc2` as the standardized actuator for the kill-switch classes
  the PQC review demanded (`llm.chat`, `llm.code`, `mcp.exec`, `remediation.write`) —
  kill switches become OpenC2 commands, not bespoke flags.
- `ssh`, `http`, `powershell`, `manual` capabilities for remediation reach; `manual`
  capability implements the human-approval gate for `require_approval` LLM policy
  decisions.
- Reporter API → emits execution evidence into the KTOS DAG so every automated response
  is itself attested (playbook hash, step results, approver identity).

Integration constraints:

- SOARCA runs as a **separate service inside the trust boundary**, called only by the
  control plane; it never receives raw LLM output — only validated, schema-checked
  playbook invocations.
- Apache-2.0 obligations (NOTICE preservation) are trivially compatible with
  proprietary KTOS distribution. Track the fork's divergence from upstream COSSAS to
  keep security patches mergeable.

### 4.5 worldmonitor → pattern donor (license-gated for code)

**License wall:** worldmonitor is AGPL-3.0. Copying its code into proprietary KTOS
components would obligate source disclosure of those components. Until/unless a
different licensing arrangement exists, KTOS leverages worldmonitor at two levels:

1. **Patterns (always safe — reimplement, don't copy):**
   - Docs-accuracy CI gate (`docs:check` — generated stats as source of truth) →
     adopt as the KTOS "claims match code" guard (§7, G-7).
   - Seed/cache freshness envelope + stampede protection + edge rate limiting →
     reimplement in the KTOS gateway (fixes the console's "naive in-memory rate limit").
   - HMAC-signed MCP grant flow → informs the per-tenant ingress key design.
   - Local-first ML (ONNX in workers, no data egress) → validates the sovereign
     LLM-plane approach; a future on-prem triage model can follow this pattern.
   - Variant-by-hostname builds → pattern for KTOS edition gating (demo/SaaS/sovereign).
   - Tauri desktop packaging with bundled sidecar → pattern for a future KTOS operator
     desktop (relevant to air-gapped facilities without browsers-to-cloud).
2. **Arm's-length service (safe with AGPL compliance):** if KTOS wants worldmonitor's
   live geopolitical/infrastructure feed as a threat-context panel, run worldmonitor as
   a **separate AGPL-compliant service** (its own deployment, source offered per AGPL)
   and consume its API from the console. No linking, no code mixing.

**Decision required (flagged, not made here):** whether spectralplasma/worldmonitor's
ownership overlaps enough with KTOS's to permit dual-licensing. Until answered in an
ADR, the license wall above is the operative policy and a CI guard (G-6) enforces it.

### 4.6 Satellite-Open-Source → reference only

Contains no code — a curated bibliography of SATCOM simulators (OpenSAND, Celestial,
FLoRaSat, skyfield, ITU-Rpy…) and datasets. Reconciliation outcome: **out of the TRL10
boundary.** It seeds a future `ARCH-0xx-space-segment` study (e.g., DDIL/air-gap comms
validation for sovereign deployments, LEO-hosted evidence relay) but contributes zero
components today, and no KTOS claim may reference satellite capability.

---

## 5. Integration Architecture

### 5.1 The one diagram

```text
                    ┌────────────────────────────────────────────────┐
                    │        OPERATOR EXPERIENCE (khepra-trust-os)   │
                    │  TanStack console · Supabase auth · RLS        │
                    │  AEO graph views · compliance dashboards       │
                    │  (ASAF compliance-graph components ported in)  │
                    └───────────────┬────────────────────────────────┘
                                    │ authenticated server functions
                                    │ tenant_id + trace_id on every call
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                 GATEWAY / EDGE (PQC cmd/gateway)                     │
│  mTLS+JWT · WAF · anomaly · per-tenant quotas · request envelope     │
│  (rate-limit & freshness patterns reimplemented from worldmonitor)   │
└──────┬───────────────────┬───────────────────────┬───────────────────┘
       │                   │                       │
       ▼                   ▼                       ▼
┌──────────────┐   ┌───────────────┐   ┌────────────────────────────┐
│ MCP CONTROL  │   │  LLM GATEWAY  │   │  RESPONSE PLANE            │
│ (pkg/mcp)    │   │  (new svc)    │   │  (SOARCA-spartan)          │
│ manifest pin │   │ classify →    │   │  CACAO v2 playbooks        │
│ RBAC/inject  │   │ redact →      │   │  OpenC2 kill switches      │
│ risk sandbox │   │ allow-listed  │   │  manual-approval capability│
│ output guard │   │ providers     │   │  ssh/http/ps remediation   │
│ 72 ASAF tools│   │ (Ollama-first)│   │                            │
└──────┬───────┘   └──────┬────────┘   └──────────┬─────────────────┘
       │                  │                       │
       └──────────────────┴───────────┬───────────┘
                                      ▼
              ┌────────────────────────────────────────────┐
              │  SOVEREIGN DATA PLANE (pkg/dag + attest)   │
              │  signed content-addressed DAG (truth)      │
              │  fail-closed persistence in prod           │
              │  ──projection──▶ Supabase aeos/aeo_links   │
              │  nightly drift guard (G-3)                 │
              └────────────────────────────────────────────┘

  Deployment profiles (ASAF-owned): dev · edge-demo · saas-prod ·
  sovereign-prod (compose+FIPS+air-gap) · ironbank-prod
```

The empty `khepra-trust-os/PQC-Khepra-MCP/` directory is deleted; in its place the
console gains a typed client for the gateway API. The console **never** links Go code
and never holds provider keys.

### 5.2 Shared contracts

The three JSON contracts from the PQC review (request envelope, LLM policy decision,
tool execution policy) are adopted unchanged as KTOS-wide normative interfaces, with
one addition each:

- **Request envelope** gains `"profile": "dev|edge-demo|saas-prod|sovereign-prod|ironbank-prod"`
  so policy engines can refuse dev-posture requests in prod.
- **LLM policy decision** gains `"playbook_ref"` — a `block`/`require_approval`
  decision may name the CACAO playbook that handles it.
- **Tool execution policy** gains `"kill_switch_class"` binding each tool to one of
  `llm.chat | llm.code | mcp.exec | remediation.write`, actuated via OpenC2.

Retention: LLM prompts/completions ≤ 30 days in all prod profiles (overriding the
gateway's 90-day default), per the secure-integration requirements both reviews cite.

---

## 6. Reconciled Gap Register

Merging both reviews' findings, deduplicated, with the cross-repo resolution:

| # | Gap (from reviews) | Resolution via reconciliation | Owner repo |
|---|---|---|---|
| R1 | No mandatory LLM gateway; direct OpenRouter/browser calls | New `LLMGateway` service; `byok.go` + static HTML dev-tagged out of prod | PQC-Khepra-MCP |
| R2 | DAG persistence fails open | `KHEPRA_AUDIT_FAIL_MODE`, fail-closed in prod profiles | PQC-Khepra-MCP |
| R3 | Dev vs prod security defaults mixed | Named profiles owned by deployment plane; profile in request envelope | ASAF |
| R4 | Console ingress: global secret, no replay defense, no tenant binding | Per-tenant keys + nonce/timestamp; pattern from worldmonitor MCP-grant HMAC | khepra-trust-os |
| R5 | Naive in-memory rate limiting on public demo | Gateway-level quotas (worldmonitor edge patterns, reimplemented) | PQC gateway |
| R6 | Ambiguous `.limit(1)` tenant selection | Explicit tenant context required by envelope contract | khepra-trust-os |
| R7 | No kill switch / IR automation | OpenC2 + CACAO playbooks via SOARCA; kill_switch_class per tool | SOARCA-spartan |
| R8 | No formal control mapping / evidence schema | `#CONTROL:` convention + compliance event schema; SOARCA reporter + console attestations both emit it | all |
| R9 | Floating dependency ranges, no SBOM in CI | Lockfile-enforced installs; `pkg/sbom` generates SBOM for every repo's release | PQC + all |
| R10 | Two operator UIs (PQC Next.js `src/` + console) + ASAF UI | Console is the single operator surface; PQC UI demoted to legacy/dev; ASAF components ported | khepra-trust-os |
| R11 | Compliance claims outpace evidence (FIPS/ML-DSA/CUI) | TRL10 rule (§1): claim ⇒ control + guard + evidence, else removed from materials | all |
| R12 | No tests for redaction/egress/injection/sandbox/cost | Test plan from PQC review §8 becomes the shared conformance suite run by every repo's CI | all |

---

## 7. The TRL10 Guard Suite (CI-enforced, all repos)

Generalizing `sovereignty_boundary_guard.sh` into a family of guards. Each is a script
+ CI job that exits non-zero on violation; each maps to a `#CONTROL:` ID.

| Guard | Enforces | Modeled on |
|---|---|---|
| G-1 `sovereignty_boundary_guard` | No customer data-plane defaults to vendor hosts (existing, extended to all six repos) | ASAF (exists) |
| G-2 `egress_guard` | Prod builds contain no direct provider clients; sandbox/gateway egress allow-list only | PQC review §5.1 |
| G-3 `projection_drift_guard` | Supabase `aeos` rows ⇔ signed DAG nodes; hash mismatch fails nightly | new |
| G-4 `profile_posture_guard` | `*-prod` profiles: mTLS on, PQC sigs on, fail-closed audit, retention ≤ 30d | PQC review §5.3 |
| G-5 `secret_scope_guard` | No service-role/provider keys in client bundles; no env-file provider keys | console review |
| G-6 `license_boundary_guard` | No AGPL (worldmonitor) source in proprietary trees; SOARCA NOTICE intact | §4.5 |
| G-7 `claims_match_code_guard` | Doc/marketing claims (FIPS, CMMC, tool counts) regenerate from code; drift fails | worldmonitor `docs:check` |
| G-8 `injection_corpus_guard` | Nightly red-team prompt corpus vs MCP + LLM gateway; regression fails | PQC review P2 |

---

## 8. Roadmap to TRL10

**P0 — converge (make the planes real):**
build `LLMGateway`; apply R1–R6; delete the empty vendored directory and stand up the
console→gateway API contract; wire console STIG/Smithery evidence through the Go DAG
projection; land G-1/G-2/G-5 in every repo's CI.

**P1 — respond and prove:**
embed SOARCA (triggers from findings + policy decisions; OpenC2 kill switches; manual
approval capability); ship the shared conformance test suite (R12); land G-3/G-4/G-6;
SBOM + lockfile enforcement everywhere (R9); port ASAF compliance-graph components into
the console (R10).

**P2 — accredit:**
`#CONTROL:` sweep and NIST 800-53 / CMMC L2 / SOC 2 / ISO 27001 mapping (R8, R11);
G-7/G-8 online; ASAF `sovereign-prod` compose promoted to the packaged KTOS Profile B
with FIPS binaries and an installer; write the ARCH-000…009 document set from the PQC
review §9, each section referencing the guard that enforces it.

**Exit criterion (TRL10):** the ARCH document set, the guard suite, and the conformance
tests are all green in CI across all six repos, and every externally stated claim
resolves to a `#CONTROL:` ID with a passing guard and a DAG evidence trail.

---

## 9. Explicit Non-Goals of This Reconciliation

- No satellite/SATCOM capability is claimed (Satellite-Open-Source is a reading list).
- No worldmonitor code is copied into proprietary trees pending the licensing ADR.
- The PQC long-tail packages (`agi`, `ising`, `lorentz`, `phantom`, `scorpion`, …)
  remain outside the TRL10 boundary until individually promoted.
- The PQC Next.js UI and static HTML consoles are legacy/dev surfaces, not product.
