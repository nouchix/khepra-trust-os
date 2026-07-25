# ADR-011 — Quantum-Classical Governed Actuation

**Date:** 2026-07-25
**Status:** Accepted (seam landed: `core/quantum`, tests green)
**Context repos:** `khepra-trust-os/core` · ASAF daemon (`giza-cyber-shield/pkg/asaf/daemon`)

## Context

The ASAF System Daemon governs privileged *classical* (POSIX) state changes:
signed ChangeRequest → symbol authorization → staged → approved → executed →
attested. A proposal asked us to extend it into a "cryptographically governed
actuator for quantum-classical state changes," integrating NVIDIA Ising
(QEC decoding), NVIDIA Quantum-Calibration, ProjectQ / CUDA-Q (compilation),
Quasar-UniNA/EVOVAQ (variational loops), and Pasqal's Quantum Evolution Kernel
(neutral-atom similarity).

The direction is right. The first draft was not, and the difference is the whole
point of KHEPRA, so it is worth stating explicitly.

## Decision

**KHEPRA governs and attests quantum-classical actuation. It does not perform the
physics.** The daemon delegates every quantum judgment — syndrome density,
calibration stability, circuit validity, optimizer convergence — to a real
backend adapter, records the backend's verdict and the content hash of the exact
context it governed, and **fails closed** when nothing verified it.

Two rules make this honest rather than theater:

1. **No simulated physics in the trust boundary.** The daemon MUST NOT inspect
   syndrome data, transmon frequencies, or circuit internals itself. A rejected
   first draft did this with `strings.Contains(expectedSyndrome,
   "density_overflow_critical")` — string-matching a magic word and calling it
   QEC. That violates KHEPRA's TRL10 invariant (*a claim = an implemented control
   + a guard that fails loudly + signed evidence*; an assertion is not a control)
   and would fail the first serious review. Physics lives in the backend.
2. **Unverified is recorded as unverified, never silently passed.** With no
   backend attached, the default validator reports `verified=false`, and the gate
   denies under the default `FailClosed` policy. An operator may opt into
   `AllowUnverified` for emulator/dev work — and the attestation still records
   `verified=false`, so the audit trail never lies.

## The seam (landed)

`core/quantum` (real, `go test ./quantum/` green):

- `QuantumContext` — the attested description of a quantum-classical change
  (framework, backend target, circuit hash, expected syndrome, optimizer, vibe
  calibration profiles). All fields opaque to KHEPRA; content-addressed via
  `adinkra.Hash` for the DAG.
- `Validator` interface — implemented **out of process** by a backend adapter
  (`Framework()`, `Validate(ctx, QuantumContext) (Verdict, error)`). Adapters are
  network clients to the real systems: an NVIDIA Ising-decoding NIM, the
  Quantum-Calibration agent, a CUDA-Q / ProjectQ runner, a Pasqal QEK service.
- `Unattached` — the honest default: verifies nothing, says so.
- `Registry` — framework → adapter.
- `Gate.Evaluate` — deny-by-default governance decision; produces an
  `Attestation` (context hash + verdict + policy + allow/deny) the daemon commits
  to the DAG **whether it allows or denies** (a denial is evidence too).
- `Policy` — `FailClosed` (default) | `AllowUnverified` (dev, records the truth).

This is the same dependency-inversion pattern as the MCP `kernelports` seam and
the public-demo evidence gateway: the trusted core defines the interface, real
backends implement it, and the honest default never fakes capability it lacks.

## How it wires into the ASAF daemon

A new gate in `Execute()`, **after** the classical symbol/staging/approval gates
and **before** privileged execution:

```
… → symbol auth → staging passed → human approved
   → if req.QuantumProfile != nil:
        att := quantumGate.Evaluate(ctx, *req.QuantumProfile)
        commit att to DAG (allow or deny)
        if att.Decision == "deny": reject
   → execute → attest execution (with quantum context hash linked)
```

The execution DAG node references the quantum attestation's `ContextHash`, so the
evidence chain is: agent identity → intent → change request → approval → quantum
verdict → execution → drift watch. One ledger, classical and quantum.

## What we deliberately did NOT do

- **No vendored quantum SDKs in the daemon.** NVIDIA Ising / Pasqal QEK / CUDA-Q
  are GPU/QPU-bound, heavy, and not sovereign-air-gap-friendly to embed. They run
  as their own services; KHEPRA calls them. This keeps the daemon a small,
  auditable, FIPS-buildable Go binary.
- **No security regressions.** The proposal's draft dropped the deny-by-default
  ops catalog and reduced four-symbol authorization to an Eban-only kernel check
  (the exact bug fixed in the real daemon on 2026-07-01) and replaced real Docker
  staging with `time.Sleep`. None of that is adopted. The classical invariants
  stand unchanged; the quantum gate is purely additive.

## Crypto-agility roadmap (hybrid PQC)

The proposal also asked for a multi-standard PQC suite (ML-DSA-65 + SLH-DSA
belt-and-suspenders, ML-KEM-768). Current honest state:

- **Today:** the daemon and `core/adinkra` sign/verify with **ML-DSA-65**
  (FIPS 204) and key-exchange with **Kyber-1024** — real, vendored (CIRCL 1.6.4),
  offline-buildable.
- **Next:** add **SLH-DSA** (FIPS 205, stateless hash-based) as a second,
  algorithm-independent signature so a lattice break doesn't sink attestation.
  This needs CIRCL re-vendored with `sign/slhdsa` (not present in 1.6.4 offline).
  It lands behind a `SignatureSuite` abstraction (algorithm registry, "require all
  present algorithms to verify"), reported honestly — a build without SLH-DSA
  reports one active algorithm, not a fake second signature.
- **KEM:** migrate `kyber1024` → standardized `ML-KEM-1024` when the vendored
  CIRCL exposes it under the FIPS 203 name.

This is sequenced, not faked: we ship ML-DSA-65 now and add SLH-DSA when it can
actually compile, rather than importing a package that does not exist.

## Consequences

- KHEPRA can position as a governance/attestation control plane for hybrid
  quantum-classical infrastructure **without** claiming to be a QPU or decoder —
  a claim it can defend in a technical review or a DIB assessment.
- Backend adapters (NVIDIA Ising, Pasqal QEK, CUDA-Q, ProjectQ, EVOVAQ) are
  independent, swappable, and out-of-scope for the daemon's attack surface.
- Every quantum-classical actuation is deny-by-default, attested, and offline
  verifiable — consistent with the rest of the Trust OS.

## Follow-ups

- Backend adapter contract (gRPC/NIM) spec + one reference adapter (a CUDA-Q
  emulator client) behind the `Validator` interface.
- Wire `Gate.Evaluate` into the ASAF daemon `Execute()` and extend the execution
  DAG node with `quantum_context_hash`.
- SLH-DSA hybrid signature suite once CIRCL is re-vendored.
