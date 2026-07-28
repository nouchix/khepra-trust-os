# ARCH-013 — Public / Private Boundary

**Date:** 2026-07-25
**Status:** Reference (the delineation the ASAF migration and all future work must honor)
**Builds on:** ARCH-010 (the split decision), ADR-012 (ASAF migration), ADR-011 (quantum seam)

The one rule: **IP boundary = repo boundary.**

- **Public — `PQC-Khepra-MCP`:** the small, auditable open-source **MCP kernel**
  plus **unmodified NIST crypto primitives**. Its whole value is that an outside
  reviewer (a prime, a NIST reviewer, a contributor) can read all of it in an
  afternoon and find nothing surprising. Credibility and distribution engine.
- **Private — `khepra-trust-os` (`core/`):** the **product** — actuation,
  forensics, the External Attestor Model, governance, compliance engines,
  deployment profiles, and the trust-graph **moat**.

If a component is a monetized capability, customer-facing evidence logic, or the
compounding data asset → **private**. If it is a generic protocol surface or a
standard cryptographic primitive an auditor must be able to trust → **public**.

## Component delineation

| Component | Repo | Why |
|---|---|---|
| MCP server / router / manifest tooling (`pkg/mcp`, `cmd/khepra-mcp`) | **Public** | The auditable kernel; the free-distribution wedge (drops into any MCP client). |
| NIST PQC primitives — ML-KEM-768, ML-DSA-65, SLH-DSA (CIRCL-backed) | **Public** | Standard algorithms; publishing them is a *trust* asset, not IP leakage. An auditor must see the crypto is unmodified. |
| `QuantumContext` schema + `Validator` interface (the contract) | **Public (optional)** | A contract, like MCP itself — publishable to invite backend adapters. Carries no secrets. |
| Adinkra **symbolic layer** (domain separation, KDF `info`, semantic binding) | **Private** | Product governance logic. Sits **outside** the FIPS module (§ crypto boundary). The ontology is a differentiator. |
| ASAF actuator daemon (`core/asaf`) — Execute, ops catalog, staging, privileged exec | **Private** | The remediation product; the security-critical invariants. |
| Drift monitor, DFIR acquisition, manifests, preservation interlock (Ch.12) | **Private** | The forensic evidence engine; customer/CUI-adjacent. |
| External Attestor Model + registry (human / device / assessor / harness) | **Private** | Governance IP; the QCTX-2 device-attestation path. |
| Trust graph / signed DAG ledger | **Private** | **The moat** — the compounding, unforgeable data asset (SDS v2.0 §2.3). |
| Quantum code-structure attestation (supersymmetry / CSS) | **Private (research)** | Annex Q; novel claim, not shippable, not a resistance claim. |
| Compliance engines (STIG/CMMC/POA&M), sovereign deploy profiles, guard suite | **Private** | Product + assurance. |
| Tool-validation **methodology** (Daubert/CFTT), not the code | **Publishable doc** | Publishing the *methodology* (not the private impl) shapes the CFTT category and supports Daubert. Positioning, not code release. |

## The crypto boundary (the part that protects the patent and the ATO)

Two things called "Adinkra" must never be conflated (see ADR-012 §3.3):

1. **Quantum resistance is 100% the unmodified NIST primitives.** ML-KEM /
   ML-DSA / SLH-DSA do all of the hardness work. They live in the **public**
   kernel precisely so their fidelity is auditable. Supersymmetry contributes
   **zero** cryptographic hardness and must never appear in a resistance claim.
2. **The Adinkra symbolic layer sits OUTSIDE the FIPS-validated module.** Its
   only cryptographic roles are domain separation, semantic binding, and HKDF
   `info`-based derivation hierarchy — all *feeding* unmodified primitives, never
   modifying polynomial coefficients or noise distributions (which would void the
   security reduction and forfeit BoringCrypto validation). This keeps it an SSP
   / key-management assessment item, not new crypto requiring FIPS re-validation.

Practical consequence for the layout: the **primitive** code is public-eligible;
the **symbolic layer that wraps it** is private product logic. When `adinkra` is
single-sourced during the ASAF migration (ADR-012 Step 1), split it: the generic
NIST-primitive wrappers can surface in the public kernel; the symbol-taxonomy,
domain-separation, and derivation logic stay in private `core`.

## What this means for the ASAF migration specifically

- The daemon, its invariants, the DFIR acquisition engine, the External Attestor
  Model, and QCTX-1/QCTX-2 all land in **private `core/asaf`**.
- The `QuantumContext`/`Validator` **contract** may be mirrored into the public
  kernel to invite third-party quantum-backend adapters — but the **Gate**, the
  attestation, and the ledger stay private.
- The **tool-validation methodology** (Ch.12 §12.7) is drafted for **publication**
  as a standalone methodology paper; the known-answer corpus harness stays private.
