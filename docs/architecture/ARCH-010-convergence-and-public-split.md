# ARCH-010 — Convergence on khepra-trust-os and the Public/Private Split

**Date:** 2026-07-24
**Status:** Recommended — awaiting owner sign-off on §3 disposition table
**Supersedes:** the plane-ownership column of `KTOS-TRL10-RECONCILIATION.md` §3 where
it conflicts (ownership of Go planes moves from PQC-Khepra-MCP to this repo).

## 1. Decision

- **`nouchix/khepra-trust-os` (private)** is the authoritative landing zone: the KTOS
  product monorepo. Console, Go planes (`core/`), deployment profiles (`deploy/`),
  guard suite (`ops/guards/`), and architecture docs all converge here.
- **`nouchix/PQC-Khepra-MCP` (public)** becomes the open-source face: the post-quantum
  MCP server kernel only, positioned for open-source and national-security
  contribution branding.

This is the right split, with three conditions (§4) that must hold before the public
repo carries that branding safely.

## 2. Why this split works

- **IP boundary = repo boundary.** Everything monetized (billing, licensing, KMS,
  compliance engines, sovereign profiles) sits behind one private repo with one
  access-control story — simpler for CMMC/audit scoping than policing a mixed repo.
- **The public artifact is the credible one.** An MCP server with manifest pinning,
  injection guards, risk-classed sandboxing, and PQC attestation is genuinely novel
  open-source material. A 75-package everything-repo is not reviewable by outside
  contributors; a focused kernel is — and external security review of the kernel
  *strengthens* the private product built on it.
- **The dependency direction is clean.** Private `core/` imports the public kernel as
  a normal Go module (`go.mod` require on tagged releases). The public repo never
  imports anything private. One-way dependency, no leakage path.

## 3. Disposition of the current PQC-Khepra-MCP tree

| Disposition | Contents | Destination |
|---|---|---|
| **Stays public (the kernel)** | `pkg/mcp`, `cmd/khepra-mcp`, `pkg/crypto` (PQC primitives), `pkg/types`, `pkg/util` (kernel-needed subset), manifest tooling (`gen_manifest.go`, `cmd/manifest-gen`, `mcp-registry.json`), `llms-install.md`, security/MCP docs, `Dockerfile.mcp` | PQC-Khepra-MCP, re-scoped |
| **Moves private (product planes)** | `cmd/gateway` + `pkg/gateway`; `pkg/dag`, `pkg/attest`, `pkg/audit`, `pkg/evidence`, `pkg/logging`; `pkg/stig(s)`, `pkg/compliance`, `pkg/poam`, `pkg/emass`, `pkg/sbom`, `pkg/intel`, `pkg/ert`, `pkg/risk`, `pkg/ir`; `pkg/llm` | `khepra-trust-os/core/` per `core/README.md` order |
| **Moves private (commercial/sensitive)** | `pkg/billing`, `pkg/license`, `pkg/kms`, `pkg/pki`, `cmd/issue-license`, `cmd/licensemock`, `cmd/service-token`, `cmd/keygen`, `cmd/root-keygen`, `cmd/root-ceremony`, `aws-govcloud/`, Iron Bank Dockerfiles, `MEMORY.md` | `khepra-trust-os/core/commercial/` + `deploy/` |
| **Moves private or is deleted (long tail)** | `pkg/agi`, `pkg/ising`, `pkg/lorentz`, `pkg/phantom`, `pkg/scorpion`, `pkg/ouroboros`, `pkg/nkyinkyim`, etc. — outside the TRL10 boundary | archive branch in private repo; delete from public |
| **Demoted, then deleted** | PQC Next.js UI (`src/`), static HTML consoles, browser→OpenRouter paths | console (this repo) is the only operator surface |

**Sizing note:** the public kernel keeps roughly 5 of 75 packages. That is the point —
the public repo's credibility comes from being small enough to audit.

## 4. Three conditions before the public repo carries the branding

1. **History scrub, not just tree scrub.** Making the repo public exposes *all git
   history*. Before (or as part of) re-scoping: run secret scanning across full
   history (`gitleaks`/`trufflehog` + GitHub secret scanning); if commercial code,
   customer references, or any credential ever landed in history, publish from a
   **fresh-history repo** (filter-repo extract of the kernel paths) rather than
   trying to redact in place. The private repo keeps the full history; the public
   one starts from the extraction. (`adinkhepra_master*.pub` are public keys — fine
   to keep — but verify no private counterparts or license-signing material ever
   committed.)
2. **License + contribution posture chosen deliberately.** Recommend **Apache-2.0**
   for the kernel (patent grant matters for a patent-pending portfolio — it clarifies
   what contributors receive and keeps DoD/prime consumption friction-free), plus a
   DCO or CLA so external contributions can flow into the private product legally.
   The current LICENSE and the patent-pending claims must be reconciled before
   contribution branding goes up.
3. **The kernel must stand alone.** `pkg/mcp` must compile and pass tests without any
   moved-private package. Where it currently imports a private-bound package (e.g.,
   DAG attestation), define a kernel-side **interface** (`Attestor`, `AuditSink`,
   `LicenseChecker`) with an in-repo no-op/local implementation; the private `core/`
   provides the production implementations. This is also just good architecture —
   it is what makes the kernel adoptable by outsiders who don't run KTOS.

## 5. Migration sequence (maps to reconciliation P0–P2)

1. **Land the landing zone** (this PR): `core/`, `ops/guards/`, `deploy/profiles/`,
   `ports/asaf/`, guard CI.
2. **Kernel extraction spike:** get `pkg/mcp` + `cmd/khepra-mcp` compiling behind
   interfaces (condition 3). Nothing moves until this is green.
3. **Plane migrations 1–5** per `core/README.md`, each a paired PR (add private /
   remove public), guards green on both sides.
4. **History decision:** run the scans (condition 1); choose in-place vs
   fresh-history publication for the public repo.
5. **Re-scope the public repo:** new README positioning the kernel, license +
   DCO/CLA (condition 2), `SECURITY.md` with disclosure policy, contribution guide.
6. **Console adoption:** delete the empty `PQC-Khepra-MCP/` placeholder directory
   here; console talks to `core/gateway` per the reconciliation contract; port
   `ports/asaf/compliance-graph/` into `src/` per its PORTING.md.

## 6. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Lovable sync: this repo is Lovable-connected; large non-web trees (`core/` Go) ride along in its history | Keep the branch buildable at every commit (Lovable rule); Go code is inert to the Vite build (`tsconfig` includes `src/**` only). If sync friction appears, `core/` can become a git submodule later without changing the architecture |
| Public history leak (condition 1 skipped under time pressure) | Guard G-5 extended: CI secret-scan job on the public repo blocks the visibility flip; fresh-history extraction is the default unless scans are provably clean |
| Kernel/private interface drift | Public kernel releases are tagged; private `core/` pins tags; a contract-test job in this repo runs the kernel's conformance tests against `core/` implementations |
| Split-brain during migration (both repos have a package) | Paired-PR rule: a plane is either public or private, never both; `ops/guards/` gains a `split_brain_guard` checking package lists against the §3 table |

## 7. What lands in this PR

- `ops/guards/sovereignty_boundary_guard.sh` + allowlist (ported from
  Adinkhepra-ASAF@28b332f, paths adapted, runs green here) + CI workflow — guard
  G-1 is now *enforced* in this repo, per the TRL10 definition.
- `deploy/profiles/sovereign/docker-compose.yml` — Profile B base, ported from ASAF
  with hardcoded Supabase build args converted to required env vars.
- `ports/asaf/compliance-graph/` — the five ASAF UI components staged outside the
  build with a conversion checklist (`PORTING.md`).
- `core/README.md` — the Go landing zone contract and migration order.
- This document.
