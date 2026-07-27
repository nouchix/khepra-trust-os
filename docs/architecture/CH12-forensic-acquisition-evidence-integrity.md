# Chapter 12 — Forensic Acquisition & Evidence Integrity

**Date:** 2026-07-25
**Status:** SPECIFICATION (planning; no code changes yet)
**Grounds:** the privileged ASAF daemon (ADR-012), the signed DAG, ADR-011 quantum
seam, `core/pqcsuite`. Reframes "quantum" work as **process forensics** (ADR-012 §3).

**Audit-grade is set by people outside our control:** opposing experts, C3PAO
assessors, and Federal Rules of Evidence **902(14)**. Every claim below is written
to survive that bar, not to sound good internally.

## 12.0 The two claims that lead the chapter

Both are novel, defensible, and directly monetizable — and both are *properties of
the resident attesting daemon*, which no cloud EDR can match:

1. **Cryptographically attested pre-incident baseline.** The drift monitor polls a
   signed baseline every 60s, so at hour zero of an incident we already hold a
   timestamped, tamper-evident record of last-known-good state. "What changed?" —
   the hardest, most-contested part of IR — collapses to a diff against signed
   history. *Precondition (state honestly): this holds only where the daemon was
   deployed and baselining before the incident; the spec must not imply
   retroactive baselines.*
2. **The tool's own footprint is already in evidence.** The daemon is resident and
   attesting *before* the incident, so its acquisition footprint (driver load, page
   allocation, process-table mutation) was baselined and every acquisition action
   enters the same signed chain. Observer effect becomes an **attested artifact**
   instead of an after-the-fact caveat.

## 12.1 Volatility-ordered acquisition (RFC 3227) — SPECIFIED

Collection MUST follow order of volatility. The quantum-process evidence does **not**
get its own tier — it distributes across the existing model, which is more honest and
a better story (extending one acquisition discipline to a new substrate):

| Tier | Classical artifacts | Quantum-process artifacts (ADR-012 §3) |
|---|---|---|
| 1 · most volatile | CPU/registers, RAM, live processes, network state | **QEC syndrome stream** (classical time series a decoder consumes) |
| 2 | kernel/module state, calibration-sensitive config | **device calibration epoch / drift parameters** (QCTX-2) |
| 3 | disk, file hashes, package/unit state | **circuit hash, code-structure spec, classical shadows** (QCTX-1) |

## 12.2 Manifest schema + sign-at-source — SPECIFIED

Each acquisition emits a manifest: per-artifact SHA-256, size, tier, acquisition
method, and the daemon identity. **The daemon on the target host computes hashes and
applies the signature *before anything leaves the box*.** The manifest authenticates
to the **host**, not the network path — so a compromised collector, a MITM on the
SSH session, or a tampering hub is *detected*, not assumed away. This is the
difference between "remote collection" and "remote collection an examiner defends on
the stand."

## 12.3 Preservation interlock — the EIGHTH invariant — **DECISION NEEDED (load-bearing)**

The daemon does **both** remediation and acquisition, and in DFIR those are
adversaries: remediation destroys evidence (containment-before-eradication exists for
exactly this reason). Unresolved, this is the single finding an opposing expert uses
to attack *every* acquisition: *"the same privileged agent that collected this also
had authority to modify the system, with no interlock."*

**The fix falls out of the DAG.** Add an eighth Execute() invariant:

> Any `ChangeRequest` targeting an asset in `INVESTIGATION_ACTIVE` state is **refused**
> unless an acquisition AEO for that asset exists **and is named as a parent** of the
> remediation AEO.

That makes evidence preservation **cryptographically prior** to remediation, provable
from the graph alone — and yields the demo line *"the ledger proves we collected
before we touched it."* It changes the daemon's Execute path, so it must be **designed
now, before the actuator ships** — cheap now, expensive to retrofit.

**Second-order sub-decisions the interlock forces (do not skip):**
- **Who sets/clears `INVESTIGATION_ACTIVE`?** That transition must itself be an
  authorized, symbol-gated, attested change — otherwise an attacker who can *clear*
  it re-enables evidence destruction, and one who can *set* it has a remediation
  DoS. Clearing SHOULD require the acquisition AEO to already exist.
- **Break-glass:** an active-containment case where remediation must precede full
  acquisition needs an explicit, dual-approved, attested override path — not a silent
  bypass.

## 12.4 Chain of custody as graph traversal + clock-independent ordering — SPECIFIED

Custody is a DAG traversal: acquisition AEO → transfer → analysis → retention, each a
signed, parent-linked node. **Timestamps are attacked in every serious proceeding**
(NTP is spoofable; root can write the clock). Parent-child hash linkage establishes a
*relative* ordering that survives clock manipulation entirely — even if every
timestamp is falsified, the chain proves node B was created after node A. Record
**both** wall clock **and** a monotonic counter; treat the **graph edge as the
authoritative ordering**.

## 12.5 Remote acquisition trust model (SSH/WinRM) — IN-DEV

Fleet connectors reach over SSH/WinRM. The sign-at-source property (§12.2) is what
makes remote acquisition defensible: trust is anchored to the host's enrolled key, not
the transport. Connector specifics (session capture, credential handling) are in
development.

## 12.6 Retention policy + dual-signature class — SPECIFIED (with a correction)

Retention horizons: CMMC/DFARS 3–6 years; litigation hold indefinite; classified
incident records 25–50 years. Single-algorithm signing fails *retroactively* — a 2026
acquisition needed in a 2045 proceeding becomes **unauthenticatable**, not merely
suspect, if its one algorithm broke in the interim.

Per-node-class policy:

| Node class | Frequency | Signing |
|---|---|---|
| Acquisition manifest, remediation execution | low | **dual-sign** (retention-grade) |
| High-volume drift polls | ~1/60s | single-sign |

**Engineering correction (important):** the retention hedge requires a **hash-based**
second signature — **SLH-DSA (FIPS 205)**. The current `core/pqcsuite` default is
ML-DSA-65 **+ Ed25519**, which is a *classical-transition* hybrid, **not** a
long-horizon quantum-adversary hedge: Ed25519 falls to Shor even more readily than
lattice, so it does **not** satisfy the 25–50-year requirement. Therefore:
retention-grade dual-signing is **blocked on vendoring SLH-DSA** (ADR-011 roadmap);
until then, retention manifests are dual-signed ML-DSA-65 + Ed25519 **and flagged as
transition-grade**, not retention-grade. Do not claim retention-grade authenticatability
before SLH-DSA lands. (The `pqcsuite.Suite` abstraction already accepts the third
scheme with no gate-logic change.)

## 12.7 Tool validation methodology — SPECIFIED (the Daubert exhibit)

Audit-grade means the *tool* is validated, not just the output. Daubert asks whether
the method is testable, has a known error rate, and operates under controlling
standards. NIST's **CFTT** program publishes forensic-tool test methodologies — and
there is **no** CFTT methodology for continuously-attested acquisition, because it
doesn't exist yet.

This reframes the ADR-012 migration: **collapsing ASAF into `core` so the invariants
run in offline CI is tool-validation infrastructure, not just hygiene.** A reproducible
known-answer test corpus + documented error rates + a **published methodology** turns
the CI green check into a Daubert exhibit and positions KHEPRA to *shape* the CFTT
category. (Per ARCH-013: publish the *methodology*; keep the corpus harness private.)

## 12.8 Standards mapping — SPECIFIED

| Standard | Coverage |
|---|---|
| NIST SP 800-86 | Integrating forensic techniques into IR |
| ISO/IEC 27037 | Identification, collection, acquisition, preservation |
| ISO/IEC 27041 | Assurance / suitability of the investigative method |
| ISO/IEC 27042 | Analysis and interpretation |
| FRE 902(14) | Self-authentication of electronic records via hash + qualified certification |
| CMMC / DFARS 252.204-7012 | Retention horizons, incident reporting (drives §12.6) |

## 12.9 Section maturity (Chapter-0 honesty)

| § | Title | Status |
|---|---|---|
| 12.0 | Pre-incident baseline + observer-effect claims | SPECIFIED (deployment precondition noted) |
| 12.1 | Volatility-ordered acquisition (RFC 3227) | SPECIFIED |
| 12.2 | Manifest schema, sign-at-source | SPECIFIED |
| 12.3 | Preservation interlock (8th invariant) | **DECISION NEEDED** — changes Execute() |
| 12.4 | Custody as graph traversal, clock-independent ordering | SPECIFIED |
| 12.5 | Remote acquisition trust model | IN-DEV |
| 12.6 | Retention + dual-signature class | SPECIFIED; retention-grade **blocked on SLH-DSA** |
| 12.7 | Tool-validation methodology | SPECIFIED |
| 12.8 | Standards mapping | SPECIFIED |

**12.3 cannot be deferred** — it changes the daemon's Execute path and is cheaper to
design before the actuator ships than to retrofit after. It is the one item on this
chapter's critical path into ADR-012 Step 2.
