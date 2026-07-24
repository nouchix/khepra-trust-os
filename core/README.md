# core/ — Go plane landing zone

This directory is the authoritative landing zone for the Go planes migrating from
`PQC-Khepra-MCP` under the convergence plan
(`docs/architecture/ARCH-010-convergence-and-public-split.md`).

## What lands here (private planes)

Migrate **with history** via `git subtree` (or `git filter-repo` for a per-package
extraction), one plane per PR, in this order:

| Order | Plane | PQC-Khepra-MCP source | Lands as |
|---|---|---|---|
| 1 | Gateway / Edge | `cmd/gateway`, `pkg/gateway` | `core/gateway/` |
| 2 | Sovereign Data | `pkg/dag`, `pkg/attest`, `pkg/audit`, `pkg/evidence`, `pkg/logging` | `core/evidence/` |
| 3 | Compliance Intelligence | `pkg/stig`, `pkg/compliance`, `pkg/poam`, `pkg/emass`, `pkg/sbom`, `pkg/intel`, `pkg/ert`, `pkg/risk`, `pkg/ir` | `core/compliance/` |
| 4 | LLM Gateway (new build) | `pkg/llm` (Ollama adapter only; `byok.go` stays behind a `dev` build tag) | `core/llmgateway/` |
| 5 | Commercial | `pkg/billing`, `pkg/license`, `pkg/kms`, `cmd/issue-license`, `cmd/service-token`, key ceremony cmds | `core/commercial/` |

Each migration PR must:

1. Bring the package's tests with it and keep them green.
2. Add/keep `#CONTROL:` annotations on security-critical paths.
3. Remove the migrated code from the public repo in a paired PR there
   (public repo keeps only the MCP kernel — see ARCH-010 §3).
4. Keep the Go module self-contained: `core/go.mod` (module
   `github.com/nouchix/khepra-trust-os/core`), no replace-directives pointing at
   the public repo once migration of a plane completes.

## What never lands here

- `pkg/mcp`, `cmd/khepra-mcp`, manifest tooling — these remain the **public**
  open-source kernel in PQC-Khepra-MCP.
- worldmonitor code (AGPL-3.0 — patterns only, see reconciliation doc §4.5).
- SOARCA is consumed as a service (Apache-2.0); if vendoring ever becomes
  necessary it goes to `core/third_party/soarca/` with LICENSE and NOTICE intact.

## Example subtree command (plane 1)

```bash
# From khepra-trust-os root, PQC checked out as a sibling:
git subtree add --prefix=core/gateway ../PQC-Khepra-MCP <branch> --squash=false
# then trim to cmd/gateway + pkg/gateway via a follow-up commit, or use
# git-filter-repo on a temporary clone to extract just those paths with history.
```
