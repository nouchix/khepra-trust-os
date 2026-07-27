# ARCH-014 — Production Release Topology

**Date:** 2026-07-27
**Status:** Accepted (implemented and CI-enforced in this change)
**Builds on:** ARCH-010 (the split decision), ARCH-013 (public/private boundary), ADR-012 (ASAF migration)
**Enforced by:** guard G-2 (`ops/guards/module_boundary_guard.sh`), CI jobs `core-verify`, `supply-chain`, `image`, `deploy-manifests`

## 1. The question this answers

> *"Now that there is separation between trust-os and the PQC-MCP repo, how do we
> ship this production release? Do we have an import module of the MCP repo in
> khepra-trust-os? Which is the production deployment repo for the official
> release?"*

Three answers, in order:

1. **We did have an "import module" — an accidental, broken, and dangerous one.**
2. **`khepra-trust-os` is the production deployment repo.**
3. **The public kernel is consumed as a pinned artifact, never as source.**

## 2. What we found (the reason this document exists)

`khepra-trust-os` tracked `PQC-Khepra-MCP` on `main` as a **git submodule
gitlink**:

```
$ git ls-files -s PQC-Khepra-MCP
160000 ea4c044649c978c0394d8ce6ad6be94a4998c4ce 0	PQC-Khepra-MCP
```

Mode `160000` is a gitlink. But there was **no `.gitmodules` file**, so there was
no URL and nothing could resolve it. Introduced by commit `6008b36` ("Changes") —
a stray `git add` of a sibling clone, not a decision.

Four consequences, escalating:

| | Consequence |
|---|---|
| 1 | A fresh clone gets an empty directory and a permanently dirty tree. |
| 2 | `git submodule update --init` fails; CI with `submodules: true` fails. |
| 3 | The pin was 5 commits stale (`ea4c044`, 2026-07-11). |
| 4 | **The pin predates `871fe42` "Remove live credentials" (2026-07-24).** The pinned commit still contains both leaked secrets — the MCP bearer token and the STIG Viewer integrity key. |

Row 4 is the actual hazard. The obvious "fix" — adding a `.gitmodules` so the
submodule resolves — would have **resurrected two credentials we had just
removed**, inside the private repo, where nobody would think to look for them.

It survived for two weeks because **nothing checked**. That is the failure this
document and guard G-2 exist to prevent, and it is a concrete instance of the
project's own TRL10 rule: a boundary asserted in prose is not a control.

**Resolution:** the gitlink is deleted (`git rm --cached PQC-Khepra-MCP`), and
G-2 fails CI if any gitlink is ever tracked in this repo again.

## 3. The topology

```
  PQC-Khepra-MCP (public)                khepra-trust-os (private)
  ─────────────────────────              ──────────────────────────────
  source of the MCP kernel               THE PRODUCT + THE DEPLOYMENT
  Apache-2.0 (proposed)                  proprietary
  72 kernel tools                        core/ (enforcement, DFIR, evidence)
  unmodified NIST primitives             deploy/profiles/*
                                         ops/guards/* (assurance)
        │                                         │
        │  builds & publishes                     │  consumes
        ▼                                         ▼
  ghcr.io/nouchix/pqc-khepra-mcp  ──────►  KHEPRA_MCP_IMAGE=...@sha256:...
       (container image, digest-pinned)
```

**The rule: khepra-trust-os builds what it owns and consumes everything else as a
pinned image.**

There is exactly **one** dependency from private → public, and it is an
**artifact** dependency: the `khepra-mcp` service in
`deploy/profiles/sovereign/docker-compose.yml`. No submodule. No Go import. No
`replace` directive.

### Why not a Go module dependency?

Both directions are illegal, for different reasons:

- **private → public (importing the kernel as a module):** re-imports the public
  repo's git history into the private repo's dependency graph, including anything
  scrubbed from it — exactly the row-4 hazard above, in a form `go mod` would
  refresh automatically. It also couples the private release cadence to public
  tags.
- **public → private (kernel importing `core/`):** destroys the split. ARCH-010
  §4 condition 3 requires the kernel to compile **standalone** behind interfaces;
  ARCH-013 forbids it. This is what the `kernelports` spike (PQC issue #60) is
  for.

`core/go.mod` therefore requires exactly two things, and G-2 keeps it that way:

```
require (
	github.com/cloudflare/circl v1.6.4
	golang.org/x/sys v0.46.0
)
```

Cross-boundary coupling is a **protocol**, not a link. The canonical example
already exists: KASA lives in the public repo and drives private enforcement by
POSTing HMAC-authenticated `ThreatSignal`s to `core/enforce.SignalIntake` — see
the header comment in `core/enforce/intake.go`, which states the same three
reasons at the code site.

## 4. The two MCP servers are two planes, not a duplication

This was genuinely ambiguous and is now decided.

| | `ktos-mcp` | `khepra-mcp` |
|---|---|---|
| Repo | khepra-trust-os (private) | PQC-Khepra-MCP (public) |
| Tools | **9** | **72** |
| Plane | **Evidence / trust fabric** | **Kernel operations** |
| Surface | AEO record/verify, ledger replay, trust score, agent passports, dual-anchor determinism | scanning, compliance, reporting, ops tooling |
| Risk class | all 9 are `read_only` | mixed |
| Transport | stdio | stdio + HTTP/SSE (:8765) |

They do not overlap. `ktos-mcp` answers *"what did this agent do, and can you
prove it?"*; `khepra-mcp` answers *"scan/assess/report on this environment."* A
sovereign deployment runs both, side by side, writing into the same DAG.

**Decision:** keep both, and stop describing either as "the" KHEPRA MCP server.
Public docs say **"the KHEPRA MCP kernel (72 tools)"**; private/product docs say
**"the KTOS trust-fabric server (9 evidence tools)."**

Verified, not assumed: all 9 tools are registered in `core/mcp/tools.go` and the
server completes `initialize` + `tools/list` over stdio (CI job `core-verify`
drives it on every PR).

## 5. How a release is cut

1. **Public kernel** — tag `PQC-Khepra-MCP`, its workflow builds and pushes
   `ghcr.io/nouchix/pqc-khepra-mcp`, and **records the digest**.
2. **Private core** — tag `khepra-trust-os`. Its workflow builds
   `core/Dockerfile` → `ktos-core` and records that digest.
3. **Resolve every consumed digest** into `deploy/profiles/sovereign/.env`
   (`ASAF_API_IMAGE`, `ASAF_UI_IMAGE`, `KHEPRA_MCP_IMAGE`, `OLLAMA_IMAGE`).
   Digest, not tag:
   ```
   crane digest ghcr.io/nouchix/pqc-khepra-mcp:v0.1.0
   ```
4. **The release manifest** is the private tag plus that set of digests. That
   tuple is the thing an evidence chain is rooted in: given a replayed AEO, you
   can name the exact bytes that produced it.

**The official release artifact is a tag in `khepra-trust-os` that pins a set of
image digests.** Nothing crosses as source.

### Fail-closed pins

Every consumed image is declared `${VAR:?message}`. Compose **refuses to start**
when a pin is missing, rather than silently resolving `:latest`. An unpinned
deployment cannot produce replayable evidence, because you cannot later say which
bytes ran. `deploy/profiles/sovereign/.env.example` documents all four, and CI
asserts both that the profile resolves with pins supplied *and* that it fails
without them.

## 6. What this change fixed

| Defect | State before | Now |
|---|---|---|
| Stray submodule gitlink pinning a commit with live credentials | on `main`, unnoticed 2 weeks | deleted; G-2 blocks recurrence |
| CI never built or tested `core/` | 1 job (G-1 only); **91 tests never ran on a PR** | `core-verify`: gofmt, vet, build, `test -race`, static-link check, binary smoke tests |
| No Dockerfile anywhere in the repo | `core/` had no deployment representation | `core/Dockerfile` — 3 static binaries on `scratch`, non-root, offline build |
| Sovereign profile referenced `Dockerfile.adinkhepra` / `Dockerfile.dashboard`, which have never existed here | `docker compose build` could not work | consumed as pinned images; G-2 check 3 blocks unresolvable build contexts |
| 4 images pinned `:latest` | unknowable deployed bytes | fail-closed digest pins + `.env.example` |
| Two MCP servers, no stated relationship | ambiguous product story | §4 above |
| `gofmt` violation in `core/pqcsuite` | nothing checked formatting | fixed; CI checks |

## 7. Open gaps (stated, not hidden)

**SC-1 — `core/go.sum` does not exist.** The module vendors its dependencies
(`core/vendor/`), which is what makes offline/air-gapped builds work — verified:
`GOPROXY=off go build ./...` succeeds. But vendor mode consults
`vendor/modules.txt`, **not** `go.sum`, so the vendored bytes currently have no
local cryptographic record of what they should hash to. Nothing caught this
because nothing ran `go mod verify`.
*Closing control (this change):* the `supply-chain` CI job re-resolves from the
module proxy, runs `go mod verify`, re-runs `go mod vendor`, and fails if the
committed tree differs — proving `vendor/` matches upstream bit-for-bit. It
uploads the generated `go.sum` as an artifact and warns that it is uncommitted.
*Remaining step:* commit that `go.sum` and flip the warning to an error. It could
not be generated in the authoring environment (the module proxy is blocked there
by egress policy), which is precisely why it is a CI job.

**SV-1 — the sovereign UI is still built against cloud Supabase.** `asaf-ui`
needs `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` at *build* time because
`/AuthCallback` initializes the Supabase client at module scope. Moving the build
out of this compose file (§6) relocated that problem to the UI's own repo; it did
not solve it. An air-gapped site still ships an image built against a cloud
project. Pre-existing (flagged 2026-06-30), unchanged by this work, and a real
gap in the sovereignty claim.

**RL-1 — no release workflow yet.** §5 describes the procedure; no
`.github/workflows/release.yml` implements it. Today CI *builds* the core image
(`image` job) but never pushes it, and digest resolution is manual. Until that
workflow exists, §5 is a runbook, not a control.

**DP-1 — no systemd unit for `asaf-daemon`.** Unchanged from the ported profile:
the privileged daemon runs on bare metal, not in compose, and no unit file exists
in any repo. Same family of gap as "no real installer bundle."

**Not claimed:** the `core/Dockerfile` image build is **unverified locally** —
there is no Docker daemon in the authoring environment. What *was* verified is
the exact build it performs: `CGO_ENABLED=0 GOFLAGS=-mod=vendor GOPROXY=off go
build -trimpath -ldflags "-s -w"` produces three statically linked binaries
(6.2M / 3.4M / 2.7M), and all three run — `ktos-aiscan --demo`, `ktos-enforce
--demo`, and `ktos-mcp` answering `initialize` + `tools/list` over stdio. The
`image` CI job is what proves the container layer, and it must go green before
this is described as a shippable image.

## 8. Guard G-2

`ops/guards/module_boundary_guard.sh` — three checks, deny-by-default:

1. **No source coupling to the public repo**: no gitlink (mode 160000), no
   checked-in `PQC-Khepra-MCP/` tree, no `require`/`replace` in `core/go.mod`, no
   Go import of the public module path.
2. **No floating image tags in `deploy/`**: `:latest` and bare untagged names
   fail. Two pin forms are legitimate — `${VAR:?...}` for a consumed artifact,
   `${VAR:-tag}` for an image built from this repo (its bytes are fixed by the git
   commit). *Stated limit:* this proves references are not floating, not that they
   are digests; digest resolution is a release-workflow step (§5), not something a
   static check can establish.
3. **No unsatisfiable build contexts**: a `build:` stanza may only name a
   Dockerfile that exists in this repo.

Negative-tested: the guard exits 1 on a synthetic gitlink, a `:latest` image, and
a missing Dockerfile, and 0 on the current tree. (The first version of check 3
silently passed everything because bash regex is POSIX ERE and `\S` never
matches — noted inline in the script so it is not reintroduced.)

## 9. Consequences

- `khepra-trust-os` is the release repo. Release engineering, deploy profiles, and
  the guard suite live here.
- `PQC-Khepra-MCP` is a **publishing** repo: its output is a container image and
  (later, per ARCH-010 condition 3) a standalone Go module. It never consumes
  private core.
- Adding a submodule to this repo is now a CI failure, not a code-review comment.
- A deployment without digest pins cannot start. This is intended.
- `docs/architecture/ARCH-013` §"Component delineation" is unchanged; this
  document adds *how the boundary is shipped*, not *where it sits*.
