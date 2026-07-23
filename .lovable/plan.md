
# KHEPRA Trust OS Fabric — Stargate v1 (Console rebased on DAG Viewer)

Evolve this Lovable project from a marketing site into the **Trust Console** for the fabric on Lovable Cloud. The console shell is rebased on `docs/dag-viewer.html` from `PQC-Khepra-MCP` — same operator-cockpit chrome (classification banner, mono metadata, node legend, 288 px left-detail panel, live 3D DAG canvas, session-ref footer). Marketing site stays as-is on the top-level routes; the console lives entirely under `_authenticated/console/*` with the DAG-viewer aesthetic.

## What we take from `dag-viewer.html`

Structural (verbatim in spirit, ported to React + Tailwind tokens):

- **Classification banner** (top strip, red) — tenant classification label.
- **Header** — NouchiX shield + product badge (AdinKhepra gold / SouHimBou cyan), live indicator, tabs, stats badge (`<n> tools · <n> findings · <n> sigs`).
- **Search bar** — mono, `>` prefix, filters over the current view.
- **View tabs** — Timeline · Agents · Findings · Controls · Rulepacks · Replay.
- **Left panel (288 px)** — selected-entity detail: badge, timestamp, description, framework, signature box, linked-node list, impact/ROI callouts.
- **Center canvas** — 3D force graph for Timeline (nodes = AEOs/agents/findings/controls/attestations; links = DAG parent-hashes). Other tabs swap the canvas (table, chart, replay viewer).
- **Legend, watermark, graph hint, footer** — session ref, CMMC / PQC-STIG badges.

Design tokens (imported into `src/styles.css`, scoped to `.console-shell` so the marketing pages stay on their current palette):

```css
--nx-navy #050c16  --nx-blue #1a9fe8  --nx-blue-glow rgba(26,159,232,.25)
--ak-gold #e5a54b  --sb-cyan #06b6d4
--cat1 #cc2a36  --cat2 #f97316  --cat3 #22c55e
--console-mono 'JetBrains Mono'  --console-sans 'Space Grotesk'
```

Node color/legend map matches the viewer 1:1: prompt `#818cf8`, tool `ak-gold`, finding CAT_I `#cc2a36`, CAT_II `#f97316`, control satisfied `#22c55e`, attestation `sb-cyan`.

## Scope (in)

1. **Enable Lovable Cloud** — Postgres, Auth, RLS, storage.
2. **Multi-tenant + RBAC** — tenants, memberships, roles (`operator | auditor | admin`), `has_role` + `has_tenant_role` SECURITY DEFINER.
3. **Trust Fabric schema** — agents, sessions, aeos (typed: `aeo.exec.v1`, `aeo.attest.v1`, `aeo.replay.v1`, `aeo.rulepack.v1`, `aeo.finding.v1`), findings, rulepacks, controls (STIG/NIST/CMMC catalog seed), aeo_control_links (many-to-many for control mapping). RLS by tenant + role.
4. **Auth** — email/password + Google via `lovable.auth.signInWithOAuth`; managed `_authenticated/` gate; session-aware nav; tenant switcher in console header.
5. **Console shell** at `_authenticated/console/route.tsx` — classification banner, header, search, tabs, 288 px left detail panel, center canvas slot, footer with session ref. Reusable `<ConsoleShell selected={...} onSelect={...}>` layout.
6. **Views** (each is a `_authenticated/console/<name>.tsx` that renders inside the shell):
   - **Timeline (default)** — 3D DAG of the current session's AEOs using `3d-force-graph` (dynamic import behind `<ClientOnly>`, SSR-safe). Nodes/links driven by `aeos.parent_hash` + `aeo_control_links`. Click → left panel populates.
   - **Agents** — registry table (DID · class · capabilities · trust score ring · last seen). Row-click populates left panel with agent detail.
   - **Findings** — CAT-I/II/III inbox with adjudicate action (writes an audited `aeo.finding.adjudication.v1`).
   - **Controls** — STIG/NIST/CMMC catalog with satisfied/failing status per tenant.
   - **Rulepacks** — generation-graph view of spec 10 lineage; active pack badge; rollback stub.
   - **Replay** — session picker + Mahalanobis / innovation series chart (Recharts), verdict badge (spec 09).
7. **Ingress endpoint** — `POST /api/public/aeo` with HMAC-SHA256 over raw body (`KHEPRA_INGRESS_SECRET`), Zod validation, `supabaseAdmin` insert. PQC `sig` field stored verbatim; spec-08 verification is out of scope for v1.
8. **Seed migration** — 1 demo tenant + demo user membership, 3 agents (adinkhepra-scanner, souhimbou-recorder, orchestrator), 1 replayable session, ~25 AEOs mirroring the dag-viewer demo JSON (prompt → tools → findings → controls → attestations), 1 rulepack lineage of 3 generations, 4 findings including one CAT-I breach.
9. **Nav rework** — public site nav gains a session-aware `Console` / `Sign in` affordance; `SiteFooter` untouched.

## Scope (out — explicit)

- No PQC signature verification on ingress (spec 08 stays in `PQC-Khepra-MCP`).
- No immudb / OpenZiti / DID resolver integration.
- No live Kalman / EARO computation — v1 renders what the fabric emits.
- No billing / marketplace wiring.
- Marketing routes (index, protocol, asaf, products.*, trust-network, connectors, developers, docs, pricing, roadmap, about, contact, asaf) untouched.

## Data model

```text
tenants(id, slug, name, classification, created_at)
memberships(tenant_id, user_id, role)      -- operator|auditor|admin
user_roles(user_id, role app_role)         -- global (system)
agents(id, tenant_id, did, display_name, class, capabilities jsonb,
       trust_score numeric, last_seen_at, created_at)
sessions(id, tenant_id, agent_id, started_at, ended_at, intent jsonb, session_ref text)
aeos(id, tenant_id, session_id, agent_id,
     type text,       -- aeo.exec.v1 | aeo.attest.v1 | aeo.replay.v1 | aeo.rulepack.v1 | aeo.finding.v1
     label text, description text, severity text,       -- CAT_I|CAT_II|CAT_III|null
     verdict text,    -- ok|warn|breach|null
     hash text, parent_hash text,
     payload jsonb, sig jsonb, ts timestamptz)
aeo_links(parent_id, child_id, weight int)             -- DAG edges
controls(id, framework, code, title, description)      -- STIG/NIST/CMMC catalog
aeo_control_links(aeo_id, control_id, tenant_id)
rulepacks(id, tenant_id, generation int, parent_id, active bool,
          weights jsonb, metrics jsonb, aeo_id)
findings(id, tenant_id, aeo_id, severity, status,      -- open|adjudicated|dismissed
         impact_usd numeric, remediation_usd numeric, roi_text text,
         adjudicated_by, adjudicated_at, label)
```

All tables: `GRANT SELECT,INSERT,UPDATE,DELETE ... TO authenticated; GRANT ALL ... TO service_role; ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. RLS: `tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid())`. Adjudication writes gated by `has_tenant_role(auth.uid(), tenant_id, 'operator')`.

## Technical layout

```text
supabase/migrations/20260723_stargate_v1.sql        -- enums, tables, GRANTS, RLS, has_role, seed

src/styles.css                                       -- adds .console-shell scoped tokens
src/components/console/
  ConsoleShell.tsx           -- classification banner + header + tabs + left panel slot + footer
  LeftDetailPanel.tsx        -- typed renderer for prompt/tool/finding/control/attest/agent
  NodeBadge.tsx  TrustScoreRing.tsx  SignatureBox.tsx
  DagCanvas.tsx              -- <ClientOnly> wrapper; dynamic import of 3d-force-graph
  ReplayChart.tsx            -- Recharts Mahalanobis series
  FindingsTable.tsx  AgentsTable.tsx  RulepackGraph.tsx  ControlsGrid.tsx

src/lib/console/
  aeos.functions.ts          -- listSessionAeos, listAeoDag, getAeo (requireSupabaseAuth)
  agents.functions.ts        -- listAgents, getAgent
  findings.functions.ts      -- listFindings, adjudicateFinding
  rulepacks.functions.ts     -- listRulepacks
  replay.functions.ts        -- getReplaySeries
  controls.functions.ts      -- listControls

src/routes/
  auth.tsx                                         -- email/password + Google
  api/public/aeo.ts                                -- HMAC ingress
  _authenticated/console/route.tsx                 -- ConsoleShell layout (tenant switcher)
  _authenticated/console/index.tsx                 -- redirect to /console/timeline
  _authenticated/console/timeline.tsx              -- DagCanvas
  _authenticated/console/agents.tsx                -- AgentsTable
  _authenticated/console/agents.$id.tsx
  _authenticated/console/findings.tsx
  _authenticated/console/controls.tsx
  _authenticated/console/rulepacks.tsx
  _authenticated/console/replay.tsx                -- session picker + ReplayChart
```

Runtime rules already in the stack apply: `requireSupabaseAuth` on every console server fn; `supabaseAdmin` only inside the ingress handler via dynamic import; Google sign-in through `lovable.auth.signInWithOAuth`; managed `_authenticated/route.tsx` gate; `onAuthStateChange` filtered to identity transitions in `__root.tsx`. Server functions return DAG data pre-shaped for `3d-force-graph` (`{nodes:[{id,label,type,val,severity,...}], links:[{source,target,w}]}`).

3D force-graph loads via `bun add 3d-force-graph`, dynamically imported inside `DagCanvas.tsx` under `<ClientOnly>` so SSR never touches it.

## Deliverables checklist

- [ ] Cloud enabled, migration applied with GRANTS + RLS + demo seed.
- [ ] `/auth` works for email/password + Google; session drives `SiteNav`.
- [ ] `/console` renders the DAG-viewer chrome with the seeded demo session end-to-end.
- [ ] Click a node → left panel matches the viewer's fields (badge, ts, desc, signature, linked-node list, impact/ROI on findings).
- [ ] `POST /api/public/aeo` accepts a valid HMAC-signed AEO and rejects an invalid one (curl-verified).
- [ ] Head metadata unique per new route; sitemap updated.
- [ ] Typecheck / build clean.

## Follow-ups (v1.1+, not this sprint)

- Enforce spec-08 PQC (ML-DSA-65) signature verification on ingress.
- Wire immudb inclusion proofs into the signature box on the left panel.
- Live SSE stream from `PQC-Khepra-MCP` into the DAG (viewer's `ingestLiveEvent` port).
- Rulepack rollback wired to the fabric's policy engine.
- Federated trust graph across tenants.
