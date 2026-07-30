# KHEPRA Licensing Architecture & Monetization Model

This document outlines the licensing enforcement mechanism, tier structure, cryptographic validation, and customer distribution model for KHEPRA Trust OS & PQC-Khepra-MCP.

---

## 1. Commercial Tier Model

| Tier | Customer Name | Target Audience | Price | Key Features |
|---|---|---|---|---|
| **Community** | `Community` | Developers & Open-Source Users | **$0** (Free, Apache 2.0) | `pqc_stig`, local asset discovery, OWASP agent assessment, NIST SP 800-53 baseline lookup, `agent_record`. |
| **Sovereign** | `Sovereign` | MSPs (Groff NetWorks), SMBs, Pilots | **$299/mo** | `scan_shadow_ai` (subnet/enterprise CIDRs), `attest_ai_policy`, signed AEO evidence graph, Agent Passports, CMMC/POAM export, zero-egress air-gap support. |
| **Pharaoh** | `Pharaoh` | Enterprise, DoD, SCIF, GovCloud | **$2,999/mo** | Privileged Enforcement Daemon interposition (`Deny`/`Quarantine`/`Lock`), FIPS 140-3 PQC path (`GOEXPERIMENT=boringcrypto`), multi-tenant fleet governance, automated System Security Plan (SSP) generation. |

---

## 2. Cryptographic Validation & Sacred Runes Encoding

1. **Cryptographic Signature**:
   - Every `KhepraLicense` artifact is signed under NouchiX's pinned Master Key using **ML-DSA-65 (NIST FIPS 204)**.
   - Validation occurs strictly **offline** — zero network egress is required, making it 100% air-gap and SCIF compatible.
2. **Sacred Runes Encoding**:
   - Customer-facing license keys (`KHEPRA_LICENSE_KEY`) are cosmetically encoded via Sacred Runes (`adinkra.NewMerkaba`) for brand identity.
   - The encoding is reversible and non-confidential, while cryptographic trust rests entirely on the ML-DSA-65 signature check against the pinned Master Public Key.
3. **Graceful Fallback**:
   - Unlicensed or expired servers automatically drop back to **Community Tier** rather than crashing, ensuring service continuity for non-commercial capabilities while enforcing commercial gates on premium features.

---

## 3. API-Key Format

KHEPRA licenses are delivered as a single string compatible with `.env` files and industry-standard secret management tooling.

### Format

```
kphr_{tier}_{base64url-encoded signed payload}
```

| Segment | Values | Purpose |
|---|---|---|
| `kphr` | fixed | Product prefix — caught by gitleaks, TruffleHog, GitHub push protection |
| `{tier}` | `com` · `sov` · `pha` | Tier at a glance (Community · Sovereign · Pharaoh) |
| `{payload}` | base64url (no padding) | The signed `.adinkhepra` JSON payload, self-contained offline |

### Examples

```
KHEPRA_LICENSE_KEY=kphr_com_eyJ...   # Community (free)
KHEPRA_LICENSE_KEY=kphr_sov_eyJ...   # Sovereign ($299/mo)
KHEPRA_LICENSE_KEY=kphr_pha_eyJ...   # Pharaoh ($2,999/mo)
```

### Bootstrap Priority

The validator resolves licenses in this order at startup:

1. `KHEPRA_LICENSE_KEY` — API-key format (connected and air-gap environments)
2. `KHEPRA_LICENSE_PATH` — file-based `.adinkhepra` (SCIF / classified delivery only)
3. **Community tier fallback** — no license present, non-commercial features only

### Scanner Registration

`.gitleaks.toml` is included in both repos with a rule that catches `kphr_(com|sov|pha)_...` patterns, preventing real license keys from being committed. Placeholder values (`kphr_sov_your-license-key-here`) are allowlisted.

To enable GitHub Advanced Security push protection for `kphr_` patterns, submit a custom secret-scanning pattern at your organization's security settings.

---

## 4. Delivery Flow

| Customer type | What they receive | How they configure it |
|---|---|---|
| Connected (SaaS/on-prem with internet) | `kphr_sov_...` string via email | `KHEPRA_LICENSE_KEY=kphr_sov_...` in `.env` |
| Air-gap (no email, media transfer OK) | `license.adinkhepra` file on USB/media | `KHEPRA_LICENSE_PATH=/etc/khepra/license.adinkhepra` |
| SCIF (classified, no network/media from internet) | `.adinkhepra` via admin-generated offline license | `KHEPRA_LICENSE_PATH=...` (Pharaoh tier only) |
