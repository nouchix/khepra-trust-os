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

**CI-1 — `cancel-in-progress` was cancelling `main` verification. FIXED
2026-07-28.** The workflow shipped with `cancel-in-progress: true` unconditionally.
Within a day it cost exactly what this workflow exists to provide: PR #18 merged at
04:24:41, a dependabot PR merged 16 seconds later, and the newer push **cancelled
the #18 merge run**. A commit landed on `main` with its verification killed
mid-flight — a silent hole in the evidence chain the TRL10 claim rests on, since a
guard that is cancelled cannot fail loudly. Now
`cancel-in-progress: ${{ github.event_name == 'pull_request' }}`: superseding is
correct on a PR (the newer commit replaces the old one, and nothing is claimed
about the old one), but on `main` each commit is a distinct artifact whose
green-ness is asserted independently.

**SC-1 — `core/go.sum` did not exist. CLOSED 2026-07-28.** The module vendors its
dependencies (`core/vendor/`), which is what makes offline/air-gapped builds work.
But vendor mode consults `vendor/modules.txt`, **not** `go.sum`, so the vendored
bytes had no local cryptographic record of what they should hash to, and nothing
noticed because nothing ran `go mod verify`.

The `supply-chain` job generated it on its first successful run — against the Go
checksum transparency log (`GOSUMDB=sum.golang.org`), which is the actual
upstream-authenticity control. It is now committed: 4 modules, 8 hashes. The
`go.sum must be committed` step is **blocking**, so it cannot silently disappear
again.

**SC-2 — the committed vendor tree does not match `go mod vendor` output. REAL,
OPEN. (Briefly and wrongly marked "withdrawn" — see the correction below.)**

The mechanism is now known exactly, from the first CI run whose diagnostic
survived long enough to print it:

```
--- a/core/go.mod
-go 1.24.0
+go 1.25.0
...
462 files changed, 2 insertions(+), 239870 deletions(-)
```

Two things happen when `go mod vendor` runs:

1. **It rewrites the go directive** from `1.24.0` to `1.25.0`, because
   `golang.org/x/sys v0.46.0` requires `go >= 1.25.0` and the toolchain raises the
   main module's directive to satisfy it.
2. **It prunes 462 files / ~240k lines** of vendored code that nothing reaches.
   Verified against the source: `core/` imports **nothing** from
   `golang.org/x/sys` directly, and only two circl packages
   (`kem/kyber/kyber1024`, `sign/mldsa/mldsa65`). But the committed tree carries
   `x/sys/unix`, `x/sys/windows`, `windows/svc/{debug,eventlog,mgr}`,
   `windows/registry`, `plan9`, `execabs`, and circl's `x25519`/`x448` — none of
   which are reachable. The committed tree is **over-vendored**, most likely
   inherited from a source repo where the ASAF daemon *did* use `x/sys/unix` and
   `windows/svc`.

The pruning is correct behaviour, not damage: a vendor directory is supposed to
contain exactly what the build imports. Removing ~240k lines of unreachable
third-party code is a supply-chain *improvement* — smaller SBOM, smaller audit
surface, less to review for a FIPS/ATO story.

### Correction: why this was briefly marked "withdrawn"

I marked SC-2 withdrawn on the strength of a run that reported success and
uploaded no drift artifact. **That reasoning was wrong, and the cause was a bug in
the check itself.** The diagnostic piped `git diff` into `head -200`; under
`pipefail`, `head` closing the pipe sent SIGPIPE to `git diff`, killing the step
with exit **141** — *before* the line that writes `/tmp/vendor-drift.diff`. With
`continue-on-error` masking the failure, the job showed `conclusion: success` and
produced no artifact. I read "no artifact" as "no drift," twice.

Two durable lessons, both now encoded in the workflow:

- **Never pipe an evidence-producing command into a truncating pager.** Write the
  artifact first, then read the file. A diagnostic that destroys its own evidence
  is worse than no diagnostic, because it reports success.
- **`continue-on-error` steps report `conclusion: success` in the Actions API
  regardless of what the command did.** Job status alone cannot distinguish
  "passed" from "failed but tolerated." Only the log or the artifact can.

### Resolution — needs a decision

- **(a) Accept upstream (recommended).** Set `go 1.25.0`, run `go mod vendor`,
  commit the pruned tree, and raise the toolchain floor in `GO_VERSION` (CI) and
  `GO_IMAGE` (`core/Dockerfile`) to 1.25.x. This is the upstream-correct answer
  *and* it deletes ~240k lines of unreachable vendored code.
- **(b) Hold the floor at 1.24.** Pin `golang.org/x/sys` to its last
  `go 1.24`-compatible release and re-vendor. Keeps the toolchain where it is,
  but keeps us on an older dependency for no benefit — `x/sys` is not on the
  evidence path, and nothing in `core` imports it directly.

**(a) is the right call.** I previously recommended (b); that was based on the
mistaken belief that the toolchain floor was the only issue. Now that the
over-vendoring is visible, (a) fixes both at once.

Neither can be executed in the authoring environment — `go mod vendor` needs the
module proxy, which is blocked there by egress policy — so the step ships
**report-only** and uploads the complete diff plus a `--stat` summary as the
`core-supply-chain` artifact. Applying that artifact and deleting one
`continue-on-error` line closes SC-2.

*Not affected:* the offline build. Vendor mode does not re-check dependency go
directives and happily builds from an over-vendored tree, which is why
`core-verify` builds, vets and passes all tests on Go 1.24.7 with `GOPROXY=off`.
SC-2 is a provenance gap, not a broken build.

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

**DM-1 — the hosted demo surfaces' TRL10 conditions are unverified.** §6.1 moves
demonstrations off local stubs and onto `gateway.souhimbou.ai` and
`mcp.souhimbou.ai`. The G-1 allowlist already records what those endpoints must
have — input guard, "no CUI" banner, isolated demo DAG, blocked real-target and
credential submission, tier-gated authenticated scans — but G-1 only checks that a
vendor-hosted demo surface is *acknowledged*, not that those controls exist. So
removing the local simulation improved the shipped binaries and shifted the
exposure to a hosted endpoint whose guarantees nothing in CI currently tests. That
is a net improvement (a customer-run binary no longer opens sockets), but it is not
a closed loop. Verifying those five conditions is the follow-up.

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

## 6.1 No simulation in shipped binaries

**Decision: `ktos-aiscan --demo` and its stub-service harness are deleted. Demos
run against a real deployed service.**

The removed code (~95 lines: `setupDemo`, `newStub`, `stub`, `splitURL`) started
stub HTTP servers on `127.0.0.1` pretending to be Ollama and Jupyter, then
"discovered" them. Four reasons it had to go, in order of severity:

1. **It never exercised the shipped detection.** `setupDemo` built its *own*
   `Scanner` with a two-signature pack synthesized from the stubs' ephemeral
   ports, bypassing the real 15-signature pack entirely. A green demo proved
   nothing about whether the product detects anything.
2. **It made a read-only scanner open listening sockets.** The tool's stated
   guarantee is *"never authenticates, never writes, never exploits."* Shipping
   `net.Listen` inside it contradicted that in the binary an MSP runs on a client
   network. The doc comment now also promises **never LISTENS**, and there is no
   longer any code that could break that promise.
3. **It hardcoded a named customer** ("Groff NetWorks AI Governance Policy") into
   the shipped binary.
4. **It panicked on listen failure** — an unrecoverable crash path in a release
   artifact, reachable on any port-exhausted or restricted host.

It also cost two CI cycles. `ktos-aiscan` exits **3** on policy violations by
design (so it can gate a pipeline like a linter), and the demo deliberately
planted a violating service — so 3 was the *passing* result, which the first smoke
test got backwards. The local pre-commit check had piped the demo through `head`,
so the pipeline returned `head`'s status and the real exit code was never
observed. That is the general hazard the user named: **a simulation generates its
own bugs, and they are bugs about the simulation, not about the product.**

### What replaced it

- **In the binaries:** nothing. `--targets` is now required; a missing target is a
  usage error (exit 2). Exit 3 on violations is unchanged — that is real product
  behaviour, not demo scaffolding.
- **In CI:** the smoke test exercises the two real, deterministic, network-free
  paths — `--print-policy` must emit valid policy JSON, and no `--targets` must
  exit 2. It also asserts `--demo` is **still rejected**, so the simulation cannot
  silently return. Scanner behaviour is covered by the `aidiscovery` unit tests,
  where `httptest` fixtures legitimately belong: a fixture inside a test is scoped
  to the test, whereas a fixture inside `main` ships to customers.
- **In the container:** the default `CMD` is `ktos-aiscan --print-policy`, not a
  demo.
- **For demonstrations:** the two external surfaces already allowlisted by guard
  G-1 in `ops/guards/sovereignty_allowlist.txt`:

  | Host | Class | Purpose |
  |---|---|---|
  | `gateway.souhimbou.ai` | `demo-discovery` / `DEMO` | public eval scan (`ASAF_ALLOW_EVAL_WITHOUT_LICENSE=true`) |
  | `mcp.souhimbou.ai` | `demo-discovery` / `DEMO` | public MCP tool endpoint (`KHEPRA_DAG_SEED_DEMO=true`) |

  Both carry pre-existing TRL10 conditions in the allowlist that this decision now
  depends on: input guard, a "no CUI" banner, an isolated demo DAG, and — for the
  eval scan — blocking real-target/credential submission and tier-gating
  authenticated scans. **Those conditions are not verified by this change.** Moving
  the demo surface off the laptop and onto a hosted endpoint makes them load-bearing
  rather than aspirational; see gap DM-1 in §7.

### What was deliberately NOT deleted

`ktos-enforce --demo` and `mcp.RunDemo` stay. They are not simulations: neither
opens a socket, fabricates a service, or substitutes a synthetic pack. They drive
the real `enforce` and `mcp` packages in-process and print the real rulings and
AEOs, and `RunDemo` is covered by `TestDemoRuns`. Deleting them would remove
genuine coverage and the only offline way to exercise the enforcement plane, which
is not what "clean" means here. If the intent is that these move to the hosted
surface too, that is a separate, larger change — the MCP demo in particular is
what `mcp.souhimbou.ai` would serve.

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
