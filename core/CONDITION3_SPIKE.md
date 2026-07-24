# Condition-3 Spike — Make the MCP Kernel Compile Standalone

**Tracking issue:** [nouchix/PQC-Khepra-MCP#60](https://github.com/nouchix/PQC-Khepra-MCP/issues/60)
**Status source:** `core/EXTRACTION_STATUS.md` (condition 3 = the only open gate)
**Plan context:** `docs/architecture/ARCH-010-convergence-and-public-split.md` §4.3

This is the authoritative copy of the spike instructions; the tracking issue
mirrors it for assignment and closure. The work executes in `PQC-Khepra-MCP`
(kernel seam + public side) with paired private implementations landing here in
`core/`.

## Environment (hard requirement)
`PQC-Khepra-MCP/go.mod` pins **Go 1.26.4**. Run only where `go version` shows
1.26.x with the toolchain resolvable — the environment that produced
`EXTRACTION_STATUS.md` had 1.24.7 with the toolchain proxy blocked and could not
compile. Branch: `claude/khepra-trust-os-architecture-hgsd6s` from latest `main`;
every commit buildable; no force-push to shared history.

## The invariant
Kernel = `pkg/mcp`, `pkg/crypto`, `pkg/types`, `cmd/khepra-mcp`,
`cmd/manifest-gen`. It may import only kernel packages + stdlib + third-party —
never `dag, attest, adinkra, license, flight, logging, sekhem, gateway, config,
agi`. Mechanism: **dependency inversion** — kernel defines interfaces, private
`core/` supplies impls, kernel ships no-op/OSS defaults.

## Blocker inventory (re-run `extract_kernel.sh --verify`; trust fresh output)
| Private pkg | Hits | Seam |
|---|---|---|
| `pkg/adinkra` | 8 | Signer + `pkg/attestenvelope` split (see Step 3) |
| `pkg/dag` | 5 | `Attestor` |
| `pkg/license` | 4 | `LicenseChecker` (default allow-all/OSS) |
| `pkg/sekhem` | 2 | assembly-time wiring in `cmd` |
| `pkg/flight` | 2 | `FlightRecorder` (no-op default) |
| `pkg/logging` | 1 | `Logger` (slog default) |
| `pkg/gateway` | 1 | narrow iface or push to `cmd` |
| `pkg/config` | 1 | assembly-only |
| `pkg/agi` | 1 | assembly-only |

Exact call sites are in `core/EXTRACTION_STATUS.md` and issue #60.

## Step 1 — `pkg/mcp/kernelports` (the seam)
Kernel-side, zero product imports. Interfaces `Attestor`, `LicenseChecker`,
`FlightRecorder`, `Logger`, `Signer` + no-op/OSS defaults, bundled in a `Deps`
struct with `Defaults()`. Derive each interface's method set from what the real
call sites actually use. Unit-test defaults; commit alone (builds with nothing
else changed). Full signatures in issue #60 Step 1.

## Step 2 — Rewire `pkg/mcp` call sites
`router.go`, `chain.go`, `dag_bridge.go`, `transport_http.go`,
`signed_audit_log.go`, `manifest_store.go`. Replace concrete import+type with the
interface; inject via constructor/struct field (no globals; nil → no-op).
Behavior-preserving only. Gate: `go build ./pkg/mcp/... && go test ./pkg/mcp/...`
pass; `grep -rE 'PQC-Khepra-MCP/pkg/(dag|license|flight|logging|gateway|sekhem)'
pkg/mcp` empty outside `_test.go`.

## Step 3 — Resolve `pkg/adinkra` (both mechanisms)
- **3a. Crypto backends → private.** Move `pkg/crypto/backend_hsm.go` and
  `backend_premium.go` (both import adinkra, both paid-tier) into `core/crypto/`.
  Keep a public baseline software backend selected via `kernelports.Signer`.
- **3b. Type-split.** Extract envelope structs + pure verify into public
  `pkg/attestenvelope`; leave signing/key-custody in private `core/adinkra`.
  Never move key handling or ceremony logic public.
Gate: `grep -rE 'PQC-Khepra-MCP/pkg/adinkra' pkg/ cmd/` empty in keep-list.

## Step 4 — Split the binary
- Public `cmd/khepra-mcp` wires `kernelports.Defaults()` (runnable OSS server).
- Private `core/cmd/khepra-mcp` constructs production `Deps` (real dag/license/
  flight/HSM-signer/sekhem/gateway) and injects into the same `pkg/mcp`
  constructor — the sovereign/commercial build.
- `cmd/manifest-gen`: repoint at `pkg/attestenvelope` or drop the adinkra dep.

## Step 5 — Extraction allow-list + verify green
Add `pkg/attestenvelope` and `pkg/mcp/kernelports` to `KEEP_PATHS` in
`extract_kernel.sh`; keep `FORBIDDEN_IMPORT_RE` listing all private packages.
Loop `extract_kernel.sh` → `--verify` (exit 0) → `go build ./... && go test ./...`
in `/tmp/kernel`. Only extend `KEEP_PATHS` for genuinely kernel-scoped deps.

## Acceptance (all must hold)
1. `go build ./... && go test ./...` pass in `PQC-Khepra-MCP` on branch.
2. `extract_kernel.sh --verify /tmp/kernel` exits 0.
3. `/tmp/kernel` builds+tests; no private-plane imports remain.
4. Public `cmd/khepra-mcp` boots on `Defaults()` and round-trips a tool call
   (integration test).
5. Private-assembly build has identical attestation/audit/license behavior.

## Do NOT
- Weaken/delete `.github/workflows/` security scans to get green (pre-existing
  failures resolve when the public repo is created from the extraction).
- Move private key material, license-signing keys, ceremony logic, or deployment
  internals into the public tree. Unsure → private.
- Create the public repo or flip visibility. Green extraction is the deliverable;
  repo creation + fresh-history publish (from `/tmp/kernel`, never this repo's
  history) is a human step, after the two leaked credentials are rotated.
- Rewrite published history or force-push shared branches.

## Deliverable
PR in `PQC-Khepra-MCP` (kernelports, rewired sites, adinkra split, binary split)
+ paired private impls in `core/`. Paste passing `--verify` + `go build` output
in the PR body; flip condition 3 to ✅ in `core/EXTRACTION_STATUS.md`; close #60.
