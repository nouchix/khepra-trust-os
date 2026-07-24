# ASAF Compliance-Graph UI — staged port

Source: `Adinkhepra-ASAF@28b332f` `src/app/compliance-graph/` (Next.js App Router).
Target: this repo's TanStack Start console (`src/routes/`, `src/components/`).

These five components are staged here **outside the build** (`tsconfig.json` only
includes `src/**`) so the console keeps compiling while they are adapted. Do not
import from `ports/` in `src/` — move each file in as it is converted.

| File | Role | Conversion work |
|---|---|---|
| `page.tsx` | Compliance-graph shell (search, node list, detail pane) | Next.js page → TanStack route (`src/routes/_authenticated/compliance-graph.tsx`); `next/link` → `@tanstack/react-router` `Link`; `next/script` → route `head()`/loader |
| `enrollment-wizard.tsx` | Tenant/agent enrollment flow | Wire submit to console server functions (`agents.functions.ts` / `tenant.functions.ts`) instead of ASAF REST API |
| `policy-editor.tsx` | Rulepack/policy editing | Back with `rulepacks.functions.ts`; add Zod schema on save |
| `staging-gate.tsx` | Promote-to-prod approval gate | Emit an AEO attestation node on approve/deny (approver identity, hash) |
| `evidence-export.tsx` | Evidence bundle download (JSON/PDF) | Point at `aeos.functions.ts` projection; include DAG node hashes in export manifest |

Shared conversions for all files:

- `lucide-react` is already a console dependency — icon imports carry over as-is.
- All data fetching must go through authenticated server functions
  (`requireSupabaseAuth`), never direct `fetch` to an API host — the ASAF originals
  call `NEXT_PUBLIC_ASAF_API_URL`, which would violate the console's no-direct-egress
  posture and guard G-2.
- Tailwind class names carry over; verify against this repo's theme tokens.

Delete this directory once all five files live under `src/` and the compliance-graph
route renders from console data.
