import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Public, read-only demo bridge for the KHEPRA Trust OS.
// Exposes a whitelisted subset of MCP-style tools without auth so visitors can
// exercise the fabric end-to-end and land in the Console with a pre-seeded
// session on `demo` tenant / session_ref = `public-demo`.
//
// Tools whitelisted:
//   - list_controls        → returns the canned CMMC control catalog
//   - khepra_query_stig    → proxies GET stigviewer.com/api/v1/stigs/{id}
//
// Every call records evidence (tool + attest AEO) so the visitor sees a real
// DAG when they sign up and open /console/timeline.

const STIG_BASE = "https://www.stigviewer.com/api/v1";
const TENANT_SLUG = "demo";
const SESSION_REF = "public-demo";

const BodySchema = z.object({
  tool: z.enum(["list_controls", "khepra_query_stig"]),
  args: z.record(z.string(), z.unknown()).optional().default({}),
});

// Naive in-memory rate limit per Worker instance (best-effort; not a security
// control). External abuse protection is layered at the edge.
const HITS: Map<string, { n: number; ts: number }> = new Map();
const RATE_LIMIT = 30; // requests
const RATE_WINDOW_MS = 60_000;

function rateLimit(ip: string) {
  const now = Date.now();
  const cur = HITS.get(ip);
  if (!cur || now - cur.ts > RATE_WINDOW_MS) {
    HITS.set(ip, { n: 1, ts: now });
    return true;
  }
  cur.n += 1;
  return cur.n <= RATE_LIMIT;
}

async function sha256Hex(input: string) {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const CONTROLS_CATALOG = [
  { id: "AC.L2-3.1.1", family: "Access Control", title: "Limit system access to authorized users", level: 2 },
  { id: "AC.L2-3.1.2", family: "Access Control", title: "Limit access to authorized transactions and functions", level: 2 },
  { id: "AU.L2-3.3.1", family: "Audit & Accountability", title: "Create and retain system audit logs", level: 2 },
  { id: "AU.L2-3.3.2", family: "Audit & Accountability", title: "Ensure actions of individual users are uniquely traced", level: 2 },
  { id: "IA.L2-3.5.3", family: "Identification & Authentication", title: "Multi-factor authentication for privileged accounts", level: 2 },
  { id: "SC.L2-3.13.11", family: "System & Communications", title: "FIPS-validated cryptography for CUI at rest", level: 2 },
  { id: "SI.L2-3.14.1", family: "System & Information Integrity", title: "Identify, report, and correct system flaws timely", level: 2 },
];

export const Route = createFileRoute("/api/public/demo")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "content-type",
          },
        }),
      POST: async ({ request }) => {
        const cors = { "Access-Control-Allow-Origin": "*" };
        const ip =
          request.headers.get("cf-connecting-ip") ??
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          "unknown";
        if (!rateLimit(ip)) {
          return Response.json(
            { error: "rate_limited", retry_after_ms: RATE_WINDOW_MS },
            { status: 429, headers: cors },
          );
        }

        let body: z.infer<typeof BodySchema>;
        try {
          body = BodySchema.parse(await request.json());
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "invalid body" },
            { status: 400, headers: cors },
          );
        }

        const startedAt = Date.now();
        let result: unknown;
        let verdict: "ok" | "error" = "ok";
        let errorMessage: string | null = null;

        try {
          if (body.tool === "list_controls") {
            const family = typeof body.args?.family === "string" ? body.args.family : null;
            result = {
              tool: "list_controls",
              framework: "CMMC 2.0",
              controls: family
                ? CONTROLS_CATALOG.filter((c) =>
                    c.family.toLowerCase().includes(family.toLowerCase()),
                  )
                : CONTROLS_CATALOG,
            };
          } else {
            // khepra_query_stig
            const stigId =
              typeof body.args?.stig_id === "string"
                ? body.args.stig_id
                : "application_security_and_development";
            const token = process.env.STIGVIEWER_API_TOKEN;
            if (!token) throw new Error("STIGVIEWER_API_TOKEN not configured");
            const res = await fetch(`${STIG_BASE}/stigs/${encodeURIComponent(stigId)}`, {
              headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            });
            const text = await res.text();
            let parsed: unknown;
            try {
              parsed = JSON.parse(text);
            } catch {
              parsed = { raw: text.slice(0, 4000) };
            }
            if (!res.ok) {
              verdict = "error";
              errorMessage = `stigviewer ${res.status}`;
            }
            result = { tool: "khepra_query_stig", stig_id: stigId, status: res.status, data: parsed };
          }
        } catch (e) {
          verdict = "error";
          errorMessage = e instanceof Error ? e.message : String(e);
          result = { tool: body.tool, error: errorMessage };
        }

        const durationMs = Date.now() - startedAt;
        const serialized = JSON.stringify(result);
        const responseSha256 = await sha256Hex(serialized);

        // Seed evidence on the DAG so /console/timeline shows this call.
        let sessionRef: string | null = null;
        let toolAeoId: string | null = null;
        let attestAeoId: string | null = null;
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: tenant } = await supabaseAdmin
            .from("tenants")
            .select("id")
            .eq("slug", TENANT_SLUG)
            .maybeSingle();
          if (tenant) {
            const { data: sess } = await supabaseAdmin
              .from("sessions")
              .upsert(
                {
                  tenant_id: tenant.id,
                  session_ref: SESSION_REF,
                  intent: {
                    source: "public-demo",
                    purpose: "read-only pre-sales demo",
                  } as never,
                },
                { onConflict: "tenant_id,session_ref" },
              )
              .select("id")
              .maybeSingle();
            if (sess) {
              sessionRef = SESSION_REF;
              const toolId = crypto.randomUUID();
              const attestId = crypto.randomUUID();
              const toolExt = `demo:${body.tool}:${toolId.slice(0, 8)}`;
              const attestExt = `demo:${body.tool}:attest:${attestId.slice(0, 8)}`;
              await supabaseAdmin.from("aeos").insert([
                {
                  id: toolId,
                  tenant_id: tenant.id,
                  session_id: sess.id,
                  external_id: toolExt,
                  label: `demo ${body.tool}`,
                  type: "tool",
                  description: `Public demo invocation of ${body.tool} (${durationMs}ms)`,
                  verdict,
                  val: 6,
                  payload: { tool: body.tool, args: body.args, ip_prefix: ip.slice(0, 8) } as never,
                  ts: new Date().toISOString(),
                } as never,
                {
                  id: attestId,
                  tenant_id: tenant.id,
                  session_id: sess.id,
                  external_id: attestExt,
                  label: `attest ${body.tool}`,
                  type: "attest",
                  description: `SHA-256 anchor for ${body.tool} response`,
                  verdict,
                  val: 6,
                  payload: {
                    tool: body.tool,
                    responseSha256,
                    bytes: serialized.length,
                    error: errorMessage,
                  } as never,
                  ts: new Date().toISOString(),
                } as never,
              ] as never);
              await supabaseAdmin.from("aeo_links").insert({
                tenant_id: tenant.id,
                parent_id: toolId,
                child_id: attestId,
                weight: 1,
              } as never);
              toolAeoId = toolId;
              attestAeoId = attestId;
            }
          }
        } catch {
          // Evidence recording is best-effort for the public demo.
        }

        return Response.json(
          {
            verdict,
            durationMs,
            responseSha256,
            error: errorMessage,
            result,
            evidence: {
              tenant: TENANT_SLUG,
              sessionRef,
              toolAeoId,
              attestAeoId,
            },
          },
          { status: 200, headers: cors },
        );
      },
    },
  },
});