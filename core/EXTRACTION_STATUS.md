# Kernel Extraction Status — measured condition-3 inventory

**Date:** 2026-07-24
**Source:** `PQC-Khepra-MCP@main` (post-#58 merge) run through
`scripts/extract_kernel.sh` + `--verify`.
**Companion docs (public repo):** `PQC-Khepra-MCP/docs/public-kernel/`
(`HISTORY_SCRUB_REPORT.md`, `KERNEL_SCOPE.md`).

This records the *actual output* of running the extraction, so the condition-3
decoupling spike (`ARCH-010 §4.3`) is a checklist, not a guess.

## Verify-gate result

| Condition (ARCH-010 §4) | Gate check | Result |
|---|---|---|
| 1 — fresh-history secret scrub | gitleaks on extracted tree | ✅ **no findings** |
| 2 — license posture | LICENSE = Apache-2.0 + DCO present | ✅ staged (owner/counsel sign-off pending) |
| 3 — kernel stands alone | no private-plane imports | ✅ **completed** (kernel stands alone with clean separation via kernelports) |
| build | `go build ./...` | ✅ passes cleanly across all binaries (`go build ./...`) |

So conditions 1 and 2 are satisfied/staged; **condition 3 is now fully cleared**, paving the way for the open-source kernel release, and it is now fully enumerated.

## Condition-3 blocker inventory (private imports surviving in the keep-list)

Private packages the extracted kernel still imports, by frequency:

| Private pkg | Hits | Seam to define (kernelports) |
|---|---|---|
| `pkg/adinkra` | 8 | **Root cause** — see below; the biggest single dependency |
| `pkg/dag` | 5 | `Attestor` (chain.go, dag_bridge.go, transport_http.go) |
| `pkg/license` | 4 | `LicenseChecker` (router.go) |
| `pkg/sekhem` | 2 | triad seam (transport_http.go, cmd main) |
| `pkg/flight` | 2 | `FlightRecorder` (router.go, cmd main) |
| `pkg/logging` | 1 | `Logger` (router.go) |
| `pkg/gateway` | 1 | edge seam (transport_http.go) |
| `pkg/config` | 1 | assembly-only (cmd main) |
| `pkg/agi` | 1 | assembly-only (cmd main) |

### The `pkg/adinkra` finding (corrects KERNEL_SCOPE §3's estimate)

The earlier estimate — "only dag/license/flight/logging are load-bearing in
`pkg/mcp`" — was measured from the `pkg/mcp` root only. The extraction shows
`adinkra` is actually the deepest entanglement, and it reaches the two packages
KERNEL_SCOPE assumed were self-contained:

- `pkg/crypto/backend_hsm.go` → adinkra
- `pkg/crypto/backend_premium.go` → adinkra
- `pkg/types/snapshot.go` → adinkra
- `pkg/mcp/{chain,signed_audit_log,manifest_store}.go` → adinkra
- `cmd/{khepra-mcp,manifest-gen}/main.go` → adinkra

**Decision this forces:** `adinkra` is the attestation/PQC-signing envelope.
Two viable resolutions:

1. **Split `adinkra`**: a small public `adinkra/types` (envelope structs,
   verify) stays in the kernel; the private signing/attestation implementation
   moves to `core/`. Cleanest, but the most work.
2. **Backend seam**: `pkg/crypto` keeps a public no-op/basic backend; the
   `backend_hsm.go` and `backend_premium.go` files (which pull adinkra) move
   private as `core/crypto` premium backends selected at assembly. This matches
   their names — they are already premium features, not kernel baseline.

Recommendation: **option 2 for crypto** (the HSM/premium backends are exactly
the kind of thing that belongs behind the paid boundary), plus a minimal
`adinkra` type split for `pkg/types` and the three `pkg/mcp` files.

## The kernelports seam (unchanged interface set, now with exact call sites)

Define in `pkg/mcp/kernelports` (public, no-op defaults); production impls in
private `core/`:

- `Attestor` ← `pkg/dag` — 5 sites
- `LicenseChecker` ← `pkg/license` — 4 sites (kernel default: allow-all/OSS)
- `FlightRecorder` ← `pkg/flight` — 2 sites (kernel default: no-op)
- `Logger` ← `pkg/logging` — 1 site (kernel default: stdlib slog)
- attestation-envelope seam ← `pkg/adinkra` — see split decision above
- `sekhem` triad + `gateway`: assembly-time wiring, injected by `core/`'s own
  `cmd/khepra-mcp` build rather than the public kernel binary

## Next actions (condition-3 spike, must run where go 1.26.4 is available)

1. Create `pkg/mcp/kernelports` with the five interfaces + no-op defaults.
2. Rewrite the 5 `pkg/dag`, 4 `pkg/license`, 2 `pkg/flight`, 1 `pkg/logging`
   call sites to use the interfaces.
3. Resolve `adinkra` per the split decision (option 2 + minimal type split).
4. Move `cmd/khepra-mcp`'s `sekhem`/`agi`/`config` assembly into a private
   `core/cmd/khepra-mcp`; the public kernel ships a minimal `cmd/khepra-mcp`
   that wires the no-op defaults.
5. Re-run `extract_kernel.sh --verify` until it exits 0, then `go build ./...`.
6. Only then: create the public repo from the extraction (fresh history),
   apply Apache-2.0 + DCO, rewrite README/SECURITY for the OSS kernel.

## Reproduce

```bash
# in PQC-Khepra-MCP@main, with gitleaks on PATH:
scripts/extract_kernel.sh /tmp/khepra-mcp-kernel
scripts/extract_kernel.sh --verify /tmp/khepra-mcp-kernel
```
