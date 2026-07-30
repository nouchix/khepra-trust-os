<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# KHEPRA Trust OS (KTOS) — agent rules

You are working in the **KTOS product monorepo**: the trust layer for autonomous
AI systems. KTOS gives every agent a cryptographic identity, a behavioral
fingerprint, and an immutable history of actions — the first digital
citizenship protocol for AI agents. "Trust me" becomes "Prove it."

## Trajectory (read before making structural changes)

Per `docs/architecture/ARCH-010-convergence-and-public-split.md`:

- **This repo (private)** is the authoritative landing zone. Console (`src/`),
  Go planes (`core/`), deployment profiles (`deploy/`), guard suite
  (`ops/guards/`), and architecture docs all converge here.
- **`nouchix/PQC-Khepra-MCP` (public)** is being re-scoped to the open-source
  post-quantum MCP kernel only (~5 of 75 packages). Everything monetized or
  compliance-scoped moves here, one plane per PR, per `core/README.md`.
- **Dependency direction is one-way:** private `core/` may import the public
  kernel as a tagged Go module. The public repo never imports anything here.

## The trust layer (landed)

`core/` is a self-contained Go module (`github.com/nouchix/khepra-trust-os/core`,
vendored deps, builds offline — `cd core && go vet ./... && go test ./...`):

- **`core/aeo`** — AI Evidence Object (`khepra-aeo/1.0`): every agent action
  becomes a content-addressed, ML-DSA-65 signed forensic artifact carrying
  agent DID, pre-execution intent hash, tool calls, observations, behavioral
  fingerprint, and a parent-event hash chain. Ledger enforces the chain,
  anchors into the KHEPRA DAG, and supports forensic replay (the
  "anti-action": history is valid only if every transition re-verifies from
  evidence). Trust scoring: integrity 50% / behavioral consistency 30% /
  intent coverage 20%. CMMC bridge maps verified AEOs to AU/SI/IR practices.
- **`core/citizenship`** — Agent Passport (`khepra-passport/1.0`):
  registrar-signed credential composing identity + verified history +
  behavioral baseline + trust standing. Citizenship is earned by record, not
  asserted: no passport without a fully replayed, verified chain.
- **`core/enforce`** — Privileged Enforcement Plane: PDP/PEP decision engine providing 5 graduated containment postures (`PostureNormal`, `PostureElevated`, `PostureRestricted`, `PostureQuarantined`, `PostureLocked`) and interposition gating (`Allow`, `Constrain`, `RequireApproval`, `Deny`, `Quarantine`, `Lock`).
- **`core/aidiscovery`** — Shadow AI Asset Discovery & Governance Policy Evaluator: signature catalog (15+ AI models/ rts), HTTP discovery probes, and deterministic policy evaluation citing specific AI-GOV rules. Exposed as native MCP tools `scan_shadow_ai` and `attest_ai_policy`.
- **`core/adinkra` / `core/dag` / `core/forensics`** — PQC primitives, anchor store, and host collector.
- Specs: `docs/architecture/DUAL_MCP_ARCHITECTURE.md` & `docs/architecture/LICENSING_ARCHITECTURE.md`.

## Rules for agents working here

1. **Evidence discipline is the product.** Never fabricate compliance data,
   attestations, test results, or evidence records — not in code, fixtures,
   demos, or docs. If a value cannot be derived from real state, it must be
   clearly labeled synthetic. This repo exists to make "prove it" possible;
   an agent that fakes evidence here defeats the product.
2. **Keep `core/` green and self-contained.** Migrations bring their tests and
   keep them green; `core/go.mod` gets no replace-directives pointing at the
   public repo; new deps get vendored so offline/CI builds keep working.
3. **Respect the sovereignty boundary.** CI runs
   `ops/guards/sovereignty_boundary_guard.sh` (G-1): no shipped client may
   default a CUI data-plane URL (Hub, Fleet, DAG, findings) to a
   NouchiX-operated vendor host. Control-plane endpoints (telemetry,
   licensing) are allowed; data-plane is not. Public demo surfaces must be in
   `ops/guards/sovereignty_allowlist.txt` marked DEMO/SYNTHETIC.
4. **Public/private split hygiene.** Nothing commercial, customer-scoped, or
   compliance-engine-related goes to the public repo; the public kernel never
   gains an import on this repo. When a plane finishes migrating, remove it
   from the public repo in a paired PR (see `core/README.md`, rule 3).
5. **Branch discipline.** `main` is the Lovable-connected branch: keep it in a
   working state and never rewrite its published history. Feature work goes
   through PRs; the guard suite must be green before merge.
6. **Frontend** (`src/`) is the KTOS console (TanStack Start + React +
   Tailwind, built with Lovable). UI work syncs with Lovable — keep changes
   compatible with its editor round-trip.
