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
   **This is now enforced, not requested** — guard G-2
   (`ops/guards/module_boundary_guard.sh`) fails CI on any gitlink, checked-in
   copy, `require`/`replace`, or Go import of `PQC-Khepra-MCP`. It was added
   after a stray submodule gitlink sat on `main` for two weeks pinning a public
   commit that still contained two live credentials. See
   `docs/architecture/ARCH-014-production-release-topology.md` §2.
5. Keep the build offline. The module is vendored (`core/vendor/`) so it builds
   air-gapped; CI runs `GOPROXY=off GOFLAGS=-mod=vendor`. A new dependency must be
   vendored in the same PR, and `go mod vendor` must reproduce the committed tree
   exactly (CI job `supply-chain`).

## Landed planes

| Plane | Source PRs | Lands as | Status |
|---|---|---|---|
| Digital Citizenship / Trust | PQC-Khepra-MCP#57 (`pkg/aeo`, `pkg/citizenship`), Adinkhepra-ASAF#7 (spec) | `core/aeo/`, `core/citizenship/` + `docs/AEO_TRUST_EXTENSION.md` | ✅ landed, 13 tests green |
| Trust MCP server (MVP) | this repo | `core/mcp/`, `core/cmd/ktos-mcp/` | ✅ landed — stdio MCP server exposing the trust layer as 9 tools; `go run ./cmd/ktos-mcp --demo` |

The MCP server (`core/mcp`) is the pitchable surface: any MCP client drives the
trust layer through it (`agent_register`, `aeo_record`, `trust_score`,
`passport_issue`, `dual_anchor`, …). See
[`docs/MVP_QUICKSTART.md`](../docs/MVP_QUICKSTART.md).

The trust plane carries minimal support copies of `core/adinkra` (ML-DSA-65 /
Kyber-1024 primitives + lattice hash), `core/dag` (content-addressed anchor
store), and `core/forensics` (Imhotep's Eye collector) so `core/go.mod` stays
self-contained per the rules above. When the Sovereign Data plane (order 2)
migrates with history, these copies collapse into it. Dependencies (CIRCL,
x/sys) are vendored so `core` builds offline: `cd core && go vet ./... && go
test ./...`.

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
