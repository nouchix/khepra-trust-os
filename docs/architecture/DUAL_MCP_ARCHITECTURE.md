# Dual-MCP Architecture: Open-Source Kernel vs. Private Sovereign Landing Zone

This document specifies the architectural model, dependency boundaries, and operational relationship between **`PQC-Khepra-MCP`** (Public Open-Source Repository) and **`khepra-trust-os`** (Private Authoritative Monorepo).

---

## 1. Architectural Topology

```mermaid
flowchart TD
    subgraph Public Repo ["PQC-Khepra-MCP (Public OSS / National Security Contribution)"]
        direction TB
        PQC_KERN["PQC Cryptographic Primitives (ML-DSA-65, Kyber-1024)"]
        STIG_PUB["Public PQC STIG & OWASP Assessment Tools"]
        PQC_MCP["pqc-khepra-mcp (Public MCP Kernel Server)"]
    end

    subgraph Private Repo ["khepra-trust-os (Private Commercial / Authoritative Landing Zone)"]
        direction TB
        subgraph Core Plane ["core/ Go Module"]
            AEO["core/aeo (AI Evidence Object & Forensic Chain)"]
            PASSPORT["core/citizenship (Agent Passports)"]
            ENFORCE["core/enforce (Privileged Enforcement Daemon PDP/PEP)"]
            DISCOVERY["core/aidiscovery (Shadow AI Discovery & Policy Engine)"]
            COMPLIANCE["core/compliance (CMMC / NIST SP 800-171 Engine)"]
            COMMERCIAL["core/commercial (Licensing & Sovereign Keys)"]
            KTOS_MCP["core/cmd/ktos-mcp (KTOS Trust Plane MCP Server)"]
        end
    end

    %% One-Way Dependency
    Core Plane -- "Go Module Import (One-Way)" --> PQC_KERN
    KTOS_MCP -- "Exposes 11+ Trust & Control Tools" --> MCP_CLIENTS["MCP Clients (Claude, Cursor, Antigravity)"]
    PQC_MCP -- "Exposes 12 Public Tools" --> MCP_CLIENTS

    style Public Repo fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff
    style Private Repo fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff
    style Core Plane fill:#1e1e2e,stroke:#a78bfa,stroke-width:1px,color:#fff
```

---

## 2. Repo Boundaries & Strict Rules

1. **One-Way Dependency Rule**:
   - `khepra-trust-os/core` may import public packages from `github.com/nouchix/PQC-Khepra-MCP`.
   - `PQC-Khepra-MCP` **NEVER** imports anything from `khepra-trust-os`.
2. **Open-Source Scope (`PQC-Khepra-MCP`)**:
   - Post-Quantum Cryptographic primitives (`pkg/adinkra`).
   - World's First DoD PQC STIG (`pqc_stig`).
   - Basic STIG/NIST lookup tools & OWASP agent vulnerability assessment.
   - Standard MCP stdio transport handler.
3. **Private Commercial Scope (`khepra-trust-os`)**:
   - AI Evidence Objects (`core/aeo`) & Genesis-to-Tip forensic replay chain.
   - Agent Citizenship & Passports (`core/citizenship`).
   - Privileged Enforcement Daemon PDP/PEP (`core/enforce`).
   - Shadow AI Asset Discovery & Policy Evaluator (`core/aidiscovery`).
   - Automated CMMC/NIST SP 800-171 system security plan export (`core/compliance`).
   - Sacred Runes ML-DSA-65 signed licensing manager (`core/commercial`).

---

## 3. Co-Existence & Deployment

Both MCP servers can run concurrently or independently:

- **`pqc-khepra-mcp`**: Provides base cryptographic validation and public compliance tools (`ert_scan`, `pqc_stig`, `owasp_agent_assess`).
- **`ktos-mcp`**: Provides the complete security, control, attestation, and enforcement surface (`agent_register`, `aeo_record`, `trust_score`, `passport_issue`, `scan_shadow_ai`, `attest_ai_policy`, `dual_anchor`).

Refer to [`deploy/mcp-deployment-config.json`](../../deploy/mcp-deployment-config.json) for OS-specific execution declarations.
