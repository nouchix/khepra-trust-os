# ADR-012 — ASAF Plane Migration into `core`, and the Quantum-Classical State Ledger

**Date:** 2026-07-25
**Status:** Proposed (answers the "where is the ASAF plane / how does it connect" question and sequences the production-grade migration)
**Builds on:** ARCH-010 (public/private split), ADR-011 (quantum governance seam)

---

## 1. Where things actually are today (the honest map)

The ASAF plane is currently **triplicated across three Go modules** that do not
import each other:

| Module | Path | What it holds |
|---|---|---|
| `github.com/EtherVerseCodeMate/giza-cyber-shield` | `pkg/asaf/{daemon,client,connector,fleet,hub,policy,scanner}` + `drift.go` `recorder.go` `wrapper.go` | **The actuator.** The real ASAF System Daemon (Execute → symbol auth → staging → approval → attest), drift monitor, ops catalog, privileged exec, plus fleet connectors (nmap/ssh/winrm/csv) and the hub. |
| `github.com/nouchix/PQC-Khepra-MCP` | `pkg/asaf/{stargate,fleet,policy,scanner}` + `drift.go` `recorder.go` `wrapper.go` | **The API surface.** Stargate HTTP handlers (Imhotep remediation, KASA, scan, fleet) + an overlapping copy of drift/recorder/policy/scanner. |
| `github.com/nouchix/khepra-trust-os/core` | `aeo, citizenship, mcp, adinkra, dag, forensics, quantum, pqcsuite, cmd/ktos-mcp` | **The trust plane + new governance seams.** No ASAF daemon yet. |

**Overlap (the split-brain):** `drift.go`, `recorder.go`, `wrapper.go`,
`fleet/`, `policy/`, `scanner/`, `asaf_test.go` exist in **both** giza and PQC.
`adinkra` (the PQC primitives) is copied in **all three** modules.

**How they connect today: they don't.** Three modules, three `adinkra` copies,
no import path from the daemon to `core`. `core/quantum.GuardChange` and
`core/pqcsuite` (ADR-011) are seams **nobody calls yet** — by design, waiting for
this migration.

That is the problem. Triplicated security-critical code (drift detection, the
recorder, PQC primitives) drifts out of sync; a fix in one copy silently leaves
the other two vulnerable — the exact class of bug ADR-011 already caught once
(the Eban-only symbol regression). It also means the daemon's real invariants
**cannot be tested in `core` CI**, which is the only module that builds and tests
offline.

## 2. Target: one plane in `core`, one source of truth

Per ARCH-010, the ASAF/remediation plane migrates into `core`. Target layout:

```
core/
  adinkra/      ← the ONE PQC primitive set (collapse the 3 copies)
  dag/          ← the ONE evidence store
  quantum/      ← governance seam (landed, ADR-011)
  pqcsuite/     ← hybrid PQC signatures (landed, ADR-011)
  asaf/
    daemon/     ← actuator: Execute(), ops_catalog, privileged, staging, drift_monitor
    fleet/      ← fleet registry + connectors (nmap/ssh/winrm/csv)
    policy/     ← egress boundary guard + policy compiler
    api/        ← stargate handlers (Imhotep/KASA/scan/fleet), formerly PQC pkg/asaf/stargate
```

The daemon imports `core/quantum`, `core/pqcsuite`, `core/dag`, `core/adinkra`
directly — no copies. Everything builds and tests **offline in one module**.

## 3. How the pieces connect after migration

```
ChangeRequest (agent, ML-DSA+Ed25519 hybrid signed)
      │
core/asaf/daemon.Execute()
      ├─ pqcsuite.Verify        ← hybrid signature (core/pqcsuite)
      ├─ ops_catalog + 4-symbol authorization   (classical invariants, unchanged)
      ├─ staging (mirror container) + human approval
      ├─ quantum.GuardChange(ctx, req.QuantumProfile)   ← core/quantum, fail-closed
      │     └─ Validator adapter → open-source quantum backend (§5)
      ├─ privileged exec (no shell)
      └─ commit attestation → core/dag        ← classical + quantum context hash, hybrid-signed
                                    │
                          the one attested ledger  →  Trust Graph (the moat, §6)
```

Two things become true that aren't today:
- The daemon's classical invariants run in `core` CI (offline, every PR).
- Every actuation — classical host change **and** quantum-classical state change —
  lands as one hybrid-signed node in one DAG.

## 4. The differentiated value it unlocks: reading quantum-classical state change

The daemon already **reads and attests classical state transitions**: the drift
monitor watches STIG-critical host state (FIPS mode, ASLR, `sshd_config`, audit
rules) and signs a `DRIFT_DETECTED` node on any change. Wiring the ADR-011 gate in
extends that same discipline to **quantum-classical state**:

- A `QuantumContext` (framework, backend, circuit hash, expected syndrome,
  calibration profiles) describes a change on a quantum device or a compiled
  circuit about to run.
- `GuardChange` delegates the physics to a real backend (§5), records the
  verdict, and attests the transition — verified or denied — into the same DAG.

So KHEPRA becomes the **one signed ledger of state change for autonomous systems
across both planes**: "the host was hardened, here's the proof" *and* "this
quantum circuit's calibration/syndrome was validated before it ran, here's the
proof." No incumbent records both on one post-quantum ledger. That is the
"reading quantum state change of autonomous systems" capability, made real.

## 5. Quantum validation on open-source, sovereign-first backends

The ADR-011 `RemoteValidator` contract deliberately does **not** require a
proprietary QPU. The open quantum ecosystem gives us sovereign, air-gap-runnable
validators — which is exactly on-brand:

| Adapter (`Validator.Framework()`) | Backend it fronts | Sovereign posture |
|---|---|---|
| `qiskit-aer` | Qiskit + Aer **simulator** (IBM, Apache-2.0) | Runs offline, on the customer's metal — no cloud |
| `cirq` | Cirq NISQ circuit checks (Google, Apache-2.0) | Offline |
| `pennylane` | PennyLane QML / gradient checks (Apache-2.0) | Offline |
| `intel-iqs` | Intel Quantum Simulator (≤40 qubits, multi-node) | Offline, HPC-friendly |
| `oqd` | Open Quantum Design trapped-ion full stack | Open hardware IP |
| `cuda-quantum` / `pasqal-qek` / `nvidia-ising` | GPU/QPU services (proprietary) | Cloud/HPC, optional |

**Design rule (TRL10):** the *reference and default* validators are
**open-source simulators** (Qiskit Aer, Intel IQS) running as a local sidecar the
`RemoteValidator` POSTs to. That means a sovereign/air-gapped deployment can
verify quantum contexts with **zero proprietary dependency and zero egress** —
and it's testable offline, so the control is real, not asserted. Proprietary
NVIDIA/Pasqal backends are opt-in acceleration, never a requirement. This turns
"needs a live QPU" from a blocker into a sovereign advantage.

## 6. The data-loop moat this compounds

Every governed transition — classical drift, remediation, and now quantum-
classical validation — is a hybrid-signed, content-addressed node linked into one
Trust Graph. That graph is the compounding, proprietary, **unforgeable** asset:

- It gets richer with every agent, host, and circuit it governs.
- Trust scores, drift baselines, and behavioral signatures sharpen with volume.
- It cannot be cloned (a competitor can copy code, not a growing signed ledger)
  and cannot be forged (hybrid PQC + content addressing).

"Software isn't the moat; the attested data loop is" (SDS v2.0 §2.3) — and this
migration is what lets the loop span both classical and quantum state change on
one ledger.

## 7. Production-grade TRL10 migration plan

Sequenced so every step is enforced by a guard + tests, not asserted:

1. **Collapse the primitives.** Make `core/adinkra` + `core/dag` the single
   source; delete the giza and PQC copies in paired PRs (ARCH-010 rule 3). Add a
   **duplication guard** (`ops/guards/no_duplicate_primitives`) that fails CI if
   `adinkra`/`dag`/`drift`/`recorder` reappear outside `core`.
2. **Migrate the daemon with history** (`git subtree`/`filter-repo`) → `core/asaf/daemon`,
   keeping its tests. It now builds/tests in `core` CI offline — the first time
   the actuator's invariants are continuously verified.
3. **Wire the seams for real:** Execute() calls `quantum.GuardChange` (fail-closed)
   and signs attestations with `pqcsuite.Suite`. Extend the execution DAG node
   with `quantum_context_hash`. Add `#CONTROL:` annotations on every gate.
4. **Land the open-source quantum validators** (§5) with a Qiskit-Aer / Intel-IQS
   simulator sidecar as the sovereign default; conformance tests use a simulator,
   not a live QPU.
5. **Migrate the API surface** (stargate handlers) → `core/asaf/api`, deleting the
   PQC copy.
6. **Guards + evidence:** sovereignty boundary guard, hybrid-signature conformance
   tests, quantum-gate fail-closed tests, SBOM in CI, `#CONTROL:` → NIST/CMMC map.
7. **Exit criterion (TRL10):** `cd core && go vet ./... && go test ./...` green
   including the daemon; duplication guard green; every actuation (classical +
   quantum) emits a hybrid-signed DAG node; zero primitive copies outside `core`.

## 8. What connects to what — one-line answers

- **Where is the ASAF plane now?** Split across giza (actuator + fleet) and
  PQC-Khepra-MCP (stargate API), with duplicated drift/recorder/policy and three
  `adinkra` copies. Not in `core` yet.
- **What is in `core`?** The trust plane (aeo/citizenship/mcp), the PQC primitives
  (adinkra/dag), and the new governance seams (quantum, pqcsuite) — but no daemon.
- **How do they connect?** Today they don't. After this migration the daemon lives
  in `core/asaf`, imports `core/quantum` + `core/pqcsuite` + `core/dag`, and every
  state change (classical and quantum) is one hybrid-signed node in one ledger.
- **How is it TRL10 + differentiated?** One source of truth (no split-brain),
  offline-testable invariants in `core` CI, sovereign open-source quantum
  validation with no proprietary dependency, and a single attested classical+quantum
  state-change ledger that compounds the data-loop moat.
