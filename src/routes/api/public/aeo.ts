import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

const NodeSchema = z.object({
  label: z.string().min(1).max(200),
  type: z.enum(["prompt", "tool", "finding", "control", "attest", "rulepack", "replay"]),
  description: z.string().max(2000).optional().nullable(),
  severity: z.enum(["CAT_I", "CAT_II", "CAT_III"]).optional().nullable(),
  val: z.number().min(1).max(100).default(6),
  ts: z.string().datetime().optional(),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
  sig: z.object({ alg: z.string(), value: z.string() }).optional().nullable(),
  external_id: z.string().max(120).optional(),
});
const LinkSchema = z.object({ source: z.string(), target: z.string(), w: z.number().min(0).max(10).default(1) });
const BodySchema = z.object({
  tenant_slug: z.string().min(1).max(80),
  session_ref: z.string().min(1).max(80),
  intent: z.string().max(400).optional(),
  nodes: z.array(NodeSchema).min(1).max(500),
  links: z.array(LinkSchema).max(2000).default([]),
});

export const Route = createFileRoute("/api/public/aeo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.KHEPRA_INGRESS_SECRET;
        if (!secret) return new Response("ingress secret not configured", { status: 503 });

        const raw = await request.text();
        const sig = request.headers.get("x-khepra-signature") ?? "";
        const expected = createHmac("sha256", secret).update(raw).digest("hex");
        const a = Buffer.from(sig); const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("invalid signature", { status: 401 });
        }

        let parsed;
        try { parsed = BodySchema.parse(JSON.parse(raw)); }
        catch (e) { return Response.json({ error: e instanceof Error ? e.message : "invalid body" }, { status: 400 }); }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: tenant, error: tErr } = await supabaseAdmin
          .from("tenants").select("id").eq("slug", parsed.tenant_slug).maybeSingle();
        if (tErr || !tenant) return new Response("unknown tenant", { status: 404 });

        const { data: sess, error: sErr } = await supabaseAdmin
          .from("sessions").upsert({ tenant_id: tenant.id, session_ref: parsed.session_ref, intent: parsed.intent ?? null }, { onConflict: "tenant_id,session_ref" })
          .select("id").maybeSingle();
        if (sErr || !sess) return Response.json({ error: sErr?.message ?? "session upsert failed" }, { status: 500 });

        const nodeRows = parsed.nodes.map((n, i) => ({
          tenant_id: tenant.id,
          session_id: sess.id,
          external_id: n.external_id ?? `${parsed.session_ref}:${i}`,
          label: n.label,
          type: n.type,
          description: n.description ?? null,
          severity: n.severity ?? null,
          val: n.val,
          ts: n.ts ?? new Date().toISOString(),
          payload: n.payload,
          sig: n.sig ?? null,
        }));
        const { data: inserted, error: nErr } = await supabaseAdmin
          .from("aeos").upsert(nodeRows, { onConflict: "session_id,external_id" }).select("id, external_id");
        if (nErr) return Response.json({ error: nErr.message }, { status: 500 });

        const idByExternal = new Map(inserted?.map((r) => [r.external_id, r.id]));
        const linkRows = parsed.links
          .map((l) => ({ tenant_id: tenant.id, parent_id: idByExternal.get(l.source), child_id: idByExternal.get(l.target), weight: l.w }))
          .filter((r) => r.parent_id && r.child_id);
        if (linkRows.length) {
          const { error: lErr } = await supabaseAdmin.from("aeo_links").upsert(linkRows, { onConflict: "parent_id,child_id" });
          if (lErr) return Response.json({ error: lErr.message }, { status: 500 });
        }

        return Response.json({ ok: true, session_id: sess.id, nodes: inserted?.length ?? 0, links: linkRows.length });
      },
    },
  },
});