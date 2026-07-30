# KHEPRA Trust OS (KTOS) — MEMORY.md

> Last Updated: 2026-07-27
> Maintainer: Souhimbou Doh Kone (SecRed Knowledge Inc. / NouchiX)

---

## 1. System Architecture

**KHEPRA Trust OS** is the authoritative landing zone and cryptographic control & proof plane for autonomous AI systems.

- **`core/aeo`**: AI Evidence Object (`khepra-aeo/1.0`) — ML-DSA-65 content-addressed signed forensic records, DAG anchor store, forensic replay engine.
- **`core/citizenship`**: Agent Passports (`khepra-passport/1.0`) — portable agent identity credentials earned by verifiable history.
- **`core/enforce`**: Privileged Enforcement Plane — PDP/PEP decision engine providing 5 graduated containment postures (`PostureNormal` .. `PostureLocked`) and 6 interposition decisions (`Allow`, `Constrain`, `RequireApproval`, `Deny`, `Quarantine`, `Lock`).
- **`core/aidiscovery`**: Shadow AI Asset Discovery & Governance Policy Evaluator — signature catalog (15+ AI models/gateways), HTTP discovery probes, and deterministic policy evaluation.
- **`core/cmd/ktos-mcp`**: Stdio MCP server exposing 13 native tools for AI agents and orchestrators (`agent_register`, `aeo_record`, `aeo_verify`, `ledger_replay`, `trust_score`, `passport_issue`, `passport_verify`, `dual_anchor`, `ledger_stats`, `scan_shadow_ai`, `attest_ai_policy`, `linux_hardening_check`, `stig_live_query`).

---

## 2. Licensing Tiers

| Tier | Price | Scope |
|---|---|---|
| Community | $0 | 30+ Core Open-Source Tools (`pqc_stig`, `nist_map`, `owasp_agent_assess`, `linux_hardening_check`, `stig_live_query`) |
| Sovereign | $299/mo | Shadow AI discovery, AI Policy Evaluator, AEO evidence graph, Agent Passports, air-gap support |
| Pharaoh | $2,999/mo | Privileged Enforcement Daemon interposition, FIPS 140-3 PQC paths, multi-tenant fleet governance |

---

## 3. Active Architecture Specs & Audits

- `docs/architecture/KHEPRA_AUTONOMOUS_DATA_LOOP_AND_AGENTPACKS.md`: Railway-style infrastructure adaptation, `agentpack.yaml` spec, and Autonomous Governance Data Loop.
- `docs/architecture/DUAL_MCP_ARCHITECTURE.md`: Topology and dependency rules between `PQC-Khepra-MCP` and `khepra-trust-os`.
- `docs/architecture/TOOL_SURVEY_AND_MIGRATION_AUDIT.md`: Complete audit of all 85 tools in `PQC-Khepra-MCP` and 5-plane migration roadmap into `core/`.
- `docs/architecture/LINUX_HARDENING_AND_STIGVIEWER_INTEGRATION.md`: Synthesis of Trimstray Practical Hardening & DISA STIG Viewer API v2.
- `docs/architecture/LICENSING_ARCHITECTURE.md`: ML-DSA-65 signed license validation and Sacred Runes key encoding.
- `deploy/mcp-deployment-config.json`: Cross-platform configuration for Windows, Linux, macOS, and Sovereign Unix.
