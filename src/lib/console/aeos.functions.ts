import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { DagPayload, DagNode, NodeType, Severity } from "./types";

export const listSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sessions")
      .select("id, session_ref, started_at, ended_at, intent")
      .order("started_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getSessionDag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sessionId: string }) => data)
  .handler(async ({ data, context }) => {
    const [{ data: aeos, error: aeosErr }, { data: links, error: linkErr }, { data: sess, error: sessErr }, { data: tenant }] =
      await Promise.all([
        context.supabase.from("aeos").select("id,label,type,description,severity,val,ts,payload,sig").eq("session_id", data.sessionId),
        context.supabase.from("aeo_links").select("parent_id, child_id, weight").order("parent_id"),
        context.supabase.from("sessions").select("session_ref, tenant_id").eq("id", data.sessionId).maybeSingle(),
        context.supabase.from("tenants").select("name, classification").limit(1).maybeSingle(),
      ]);
    if (aeosErr) throw new Error(aeosErr.message);
    if (linkErr) throw new Error(linkErr.message);
    if (sessErr) throw new Error(sessErr.message);

    const nodeIds = new Set((aeos ?? []).map((n) => n.id));
    const nodes = (aeos ?? []).map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type as NodeType,
      description: n.description,
      severity: (n.severity ?? null) as Severity,
      val: n.val,
      ts: n.ts,
      payload: n.payload ?? {},
      sig: (n.sig ?? null) as DagNode["sig"],
    }));
    const scopedLinks = (links ?? [])
      .filter((l) => nodeIds.has(l.parent_id) && nodeIds.has(l.child_id))
      .map((l) => ({ source: l.parent_id, target: l.child_id, w: l.weight }));

    const tool_calls = nodes.filter((n) => n.type === "tool").length;
    const findings = nodes.filter((n) => n.type === "finding").length;
    const attestations = nodes.filter((n) => n.type === "attest").length;
    const controls = nodes.filter((n) => n.type === "control").length;

    return {
      meta: {
        session_ref: sess?.session_ref ?? "unknown",
        tenant: tenant?.name ?? "",
        classification: tenant?.classification ?? "UNCLASSIFIED",
        tool_calls,
        findings,
        attestations,
        controls,
      },
      nodes,
      links: scopedLinks,
    };
  });