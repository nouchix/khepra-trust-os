# ADR-012 — ASAF Plane Migration into `core`, and Quantum-Process Forensics

**Date:** 2026-07-25
**Status:** Proposed — v2, amended after review (items 1–6 below incorporated)
**Builds on:** ARCH-010 (public/private split), ADR-011 (quantum governance seam)
**Companion:** ARCH-013 (public/private boundary — the delineation this migration must honor)

> **v2 changelog:** split the quantum control into QCTX-1 (circuit validation) and
> QCTX-2 (device attestation); generalized both under the External Attestor Model;
> promoted the four collapse-time canonicalization *decisions* from implicit to
> recorded; corrected the sequencing (governance seam shipped before actuator);
> constrained the simulator sidecar (SBOM/Iron Bank); reframed "quantum state
> attestation" → **quantum-process forensics**; scoped the Adinkra/supersymmetry
> mathematics to code-structure attestation and representation language only —
> **not** quantum resistance, **not** state reading.

---

## 1. Where the ASAF plane is today (verified)

Triplicated across three Go modules that do not import each other:

| Module | Path | Role |
|---|---|---|
| `giza-cyber-shield` | `pkg/asaf/{daemon,client,connector,fleet,hub,policy,scanner}` + `drift.go` `recorder.go` `wrapper.go` | **Actuator** — the real daemon (Execute → symbol → staging → approval → attest), drift monitor, ops catalog, privileged exec, fleet connectors. |
| `PQC-Khepra-MCP` | `pkg/asaf/{stargate,fleet,policy,scanner}` + `drift.go` `recorder.go` `wrapper.go` | **API** — stargate handlers (Imhotep/KASA/scan/fleet) + overlapping drift/recorder/policy/scanner copy. |
| `khepra-trust-os/core` | `aeo, citizenship, mcp, adinkra, dag, forensics, quantum, pqcsuite, cmd/ktos-mcp` | **Trust plane + governance seams** — no daemon. |

**Split-brain (verified):** `drift.go`, `recorder.go`, `wrapper.go`, `fleet/`,
`policy/`, `scanner/`, `asaf_test.go` exist in **both** giza and PQC; `adinkra`
(PQC primitives) is copied in **all three** modules. Nothing imports `core`;
`core/quantum.GuardChange` and `core/pqcsuite` are seams **not yet called**.

**Why this is the priority (item 1):** three copies of security-critical code
(drift, recorder, and the PQC primitives) is the highest-severity finding.
ADR-011 already caught the Eban-only symbol regression — that is the split-brain
risk materializing once, not a hypothetical. An invariant that can't be
continuously tested isn't an invariant; today the daemon's invariants run in no
offline CI at all.

## 2. Target and connection

Migrate into `core/asaf/{daemon,fleet,policy,api}` importing the single
`core/adinkra` + `core/dag` + `core/quantum` + `core/pqcsuite`. After migration
`Execute()` verifies with `pqcsuite` (hybrid), gates with `quantum.GuardChange`
(fail-closed), and commits classical **and** quantum-process evidence as
hybrid-signed nodes in one `core/dag`. Everything builds and tests offline in one
module — the first time the actuator's invariants are continuously verified.

## 3. Reframe (item 2 + the correction): quantum-**process** forensics, not state attestation

**The wall, stated plainly:** you cannot read a quantum state. No-cloning forbids
copying an unknown state; measurement collapses it; full tomography of *n* qubits
costs ~4ⁿ destructive measurements. Any spec promising to "read" or "attest
quantum state" fails on physics, not engineering. **Rename the capability to
quantum-process forensics: attesting the *classical evidence surface* a quantum
computation emits.** The technical anchor is *classical shadows* (Huang–Kueng–
Preskill 2020) plus the syndrome/decoder record — all classical bytes, all
signable, all replayable in offline CI.

### 3.1 Split the control in two (do NOT write "verifies quantum contexts")

A local simulator sidecar validates a **circuit**; it cannot attest **physical
device state**. Mapped against the `QuantumContext` struct:

| Control | What it covers | `QuantumContext` fields | Status |
|---|---|---|---|
| **QCTX-1 — Circuit Validation** | Local OSS simulator sidecar (Qiskit Aer / Cirq / PennyLane / IQS): deterministic re-execution against recorded inputs, resource bounds, circuit canonicalization + hash, decoder replay against a recorded syndrome stream, classical-shadow reconstruction. Offline, no external principal. | `CircuitHash`, `Framework`, `Optimizer` | **SPECIFIED, buildable now.** Note statevector scaling limits. |
| **QCTX-2 — Device Attestation** | A **signed assertion from the physical device control plane**: enrolled key, ASAF-issued nonce, expiry, numeric assertions (`logical_error_rate`, `syndrome_density`, `calibration_epoch`), and `LoadedCircuitHash` compared against the committed intent hash. | `ExpectedSyndrome`, `VibeProfiles` (the two self-attested fields) | **RESEARCH.** Not satisfiable by any simulator. |

**The load-bearing sentence for the spec:** deploying QCTX-1 alone against real
hardware validates the circuit and learns *nothing* about the device that ran it.
That gap must be **visible in the spec, not closed by wording.** `ExpectedSyndrome`
and `VibeProfiles` are exactly the fields the honest default (`Unattached`,
ADR-011) refuses to self-verify — QCTX-2 is the only thing that can, and it needs
a real device attestor.

### 3.2 One pattern: the External Attestor Model

QCTX-2 is not special. Human approval, device control-plane attestation, a
third-party C3PAO assessor sign-off, and a validation harness are all instances of
one pattern: **an external principal makes a signed, nonce-bound, expiring
assertion that KHEPRA verifies against an enrolled key and attests into the DAG.**
Build the generalization — one attestor registry, one nonce protocol, one
verification path — not four bespoke mechanisms. `quantum.Validator` becomes one
attestor class under it.

### 3.3 Where Adinkra / supersymmetry actually earns its place (and where it must not appear)

There are **two different things called "Adinkra"** and conflating them breaks the
claim:

- **Akan adinkra symbols** (Eban, Nkyinkyim, Dwennimmen, Fawohodie) — the
  governance ontology. Its cryptographic role is **domain separation** (the symbol
  is bound into the signed message), **semantic binding** (the class travels with
  the AEO into the ledger), and **derivation hierarchy** (symbol as HKDF `info`).
  All of this sits **outside** the FIPS module. It does **not** modify polynomial
  coefficients or noise distributions — doing so would void the ML-DSA/ML-KEM
  security reduction and forfeit BoringCrypto validation.
- **Physics adinkras** (Gates–Faux 2005) — the graph objects whose valid dashings
  correspond to doubly-even self-dual binary codes, which in turn generate
  self-dual **CSS quantum error-correcting codes**. This shared combinatorial
  substrate is real, and it earns its place in exactly **one** place:
  **code-structure attestation** — attesting "the device ran the CSS code it
  claimed, with the transversal logical gate set that code admits." It is also a
  clean **representation language** for the governance DAG (height → privilege
  grade, edge colour → symbol taxonomy).

**Quantum resistance is 100% ML-KEM-768 / ML-DSA-65 / SLH-DSA — unmodified NIST
primitives.** Supersymmetry contributes **zero** hardness and must never appear in
a resistance claim. It contributes code-structure attestation (QCTX-2 research)
and representation elegance. Keep the two stories separate: (1) quantum resistance
= boring, correct, NIST; (2) governed autonomy + process forensics = the moat.

## 4. Collapse-time canonicalization DECISIONS (item 3 — load-bearing)

Collapsing three copies means **choosing** which behavior becomes canonical.
These must be recorded decisions, never "whichever copy we merged from":

| # | Decision | Recommended canonical answer |
|---|---|---|
| a | **Eban vs drift detection** — one copy exempts Eban from post-state invariant checks | **Backwards — fix it.** Kernel-class ops get *more* scrutiny, not an exemption. Confirm which copy exempts and canonicalize the strict behavior deliberately. |
| b | **Rollback scope** — sysctl only, or files/packages/services/units? | Decide explicitly; a rollback that only reverts sysctl but not package/unit changes is a false safety claim. |
| c | **Staging contract** — what is mirrored, what constitutes pass, how the diff is attested and bound to the production request | Define the pass predicate and the diff→production binding hash; unbound staging is theater. |
| d | **Symbol taxonomy** — reconcile `Nkonsonkonson/Mrammuo/Sepo/NyameNnwu` (the draft) against canonical `Eban/Fawohodie/Nkyinkyim/Dwennimmen` | Extending is fine; extending **silently** breaks the framework-mapping story and weakens claim support. Reconcile and document the full taxonomy. |

Decision (a) already bit us once. The collapse PR is where each of these is chosen
on purpose or inherited by accident — so ADR-012 records them, and the migration
PR must cite this table.

## 5. Sequencing (item 4 — the governance seam shipped before the actuator)

Acknowledged inversion: `core/quantum` and `core/pqcsuite` exist while `core/asaf`
does not. Correct order:

1. **Step 1 — Single-source `adinkra` + `dag`; duplication guard in CI.** ← proceed
   (this is the priority; it retires the triplication).
2. **Step 2 — `core/asaf` daemon + invariants, running in offline `core` CI.**
   Canonicalize the §4 decisions here.
3. **Step 3 — Wire the External Attestor Model; QCTX-1 (circuit validation) behind
   it.** `GuardChange` is first *called* here.
4. **Step 4 — Annex Q / QCTX-2 as RESEARCH only** (device attestation, code-structure).

**Until Step 3, `GuardChange` stays uncalled — mark it a reserved seam in the
code, not dead code.** Unreferenced code in `core` is a diligence smell; either
wire it or annotate it clearly as reserved-pending-Step-3.

## 6. Simulator sidecar constraint (item 5)

A Python scientific stack (Qiskit/Cirq/PennyLane/IQS) inside a zero-egress Go
daemon is a **real SBOM and Iron Bank surface expansion.** The sidecar runs as a
**separate container**, `--network none`, pinned dependencies, with the **SBOM
delta documented before Step 3.** The Go daemon never imports the Python stack; it
speaks to the sidecar over the local `RemoteValidator` HTTP contract only.

## 7. Teardown grid (item 6)

**Hold the mobile stacked view.** First reconcile the grid against Chapter-0
maturity markers: KHEPRA showing solid-gold *native* on rows Chapter 0 marks
`SPECIFIED` (e.g., quantum-process forensics QCTX-1, or capabilities pending the
`core` migration) is an inconsistency a technical reviewer finds in five minutes.
Produce a **maturity-honest** grid (native vs SPECIFIED vs RESEARCH), *then*
re-render — including any mobile view.

## 8. What connects to what — one-line answers

- **Where is the ASAF plane now?** Split across giza (actuator + fleet) and
  PQC-Khepra-MCP (stargate API), drift/recorder/policy duplicated, `adinkra`
  copied in all three modules. Not in `core`.
- **What is in `core`?** Trust plane (aeo/citizenship/mcp), PQC primitives
  (adinkra/dag), governance seams (quantum, pqcsuite) — no daemon.
- **How do they connect?** Today they don't. After migration the daemon lives in
  `core/asaf`, imports the single primitives, and every state change — classical
  and the quantum *process* evidence surface — is one hybrid-signed DAG node.
- **Public vs private?** See ARCH-013. Short version: the unmodified NIST crypto
  and the MCP kernel are public; the actuator, the External Attestor Model, the
  forensics, and the trust-graph moat are private.

Proceed with **Step 1** only. Steps 2–4 gate on their predecessors.
