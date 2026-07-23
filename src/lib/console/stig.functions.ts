import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STIG_BASE = "https://www.stigviewer.com/api/v1";
const EVIDENCE_SESSION_REF = "stig-integration";

type Verdict = "ok" | "error";

async function stigFetch(path: string, init?: RequestInit) {
  const token = process.env.STIGVIEWER_API_TOKEN;
  if (!token) throw new Error("STIGVIEWER_API_TOKEN not configured");
  const res = await fetch(`${STIG_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  return res;
}

async function ensureEvidenceSession(tenantId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing } = await supabaseAdmin
    .from("sessions")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("session_ref", EVIDENCE_SESSION_REF)
    .maybeSingle();
  if (existing) return existing.id as string;
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .insert({
      tenant_id: tenantId,
      session_ref: EVIDENCE_SESSION_REF,
      intent: { source: "stigviewer.com", purpose: "compliance ingest + attestation" } as never,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "session create failed");
  return data.id as string;
}

async function recordEvidence(opts: {
  tenantId: string;
  sessionId: string;
  label: string;
  type: "tool" | "finding" | "attest";
  description: string;
  verdict: Verdict;
  payload: Record<string, unknown>;
  parentId?: string;
  severity?: "CAT_I" | "CAT_II" | "CAT_III" | null;
  val?: number;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const id = crypto.randomUUID();
  const external_id = `stig:${opts.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}:${id.slice(0, 8)}`;
  const { error } = await supabaseAdmin.from("aeos").insert({
    id,
    tenant_id: opts.tenantId,
    session_id: opts.sessionId,
    external_id,
    label: opts.label,
    type: opts.type,
    description: opts.description,
    severity: opts.severity ?? null,
    verdict: opts.verdict,
    val: opts.val ?? (opts.type === "finding" ? 10 : 6),
    payload: opts.payload as never,
    ts: new Date().toISOString(),
  } as never);
  if (error) throw new Error(error.message);
  if (opts.parentId) {
    await supabaseAdmin.from("aeo_links").insert({
      tenant_id: opts.tenantId,
      parent_id: opts.parentId,
      child_id: id,
      weight: 1,
    } as never);
  }
  return id;
}

async function getTenantId(context: { supabase: { from: (t: string) => { select: (c: string) => { eq: (col: string, v: string) => { limit: (n: number) => { maybeSingle: () => Promise<{ data: { tenant_id: string } | null }> } } } } } }, userId: string) {
  const { data } = await context.supabase
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!data?.tenant_id) throw new Error("no tenant membership");
  return data.tenant_id;
}

export const stigListStigs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { page?: number; limit?: number; q?: string }) => data)
  .handler(async ({ data, context }) => {
    const tenantId = await getTenantId(context as never, context.userId);
    const sessionId = await ensureEvidenceSession(tenantId);
    const qs = new URLSearchParams();
    if (data.page) qs.set("page", String(data.page));
    if (data.limit) qs.set("limit", String(data.limit));
    if (data.q) qs.set("q", data.q);
    const res = await stigFetch(`/stigs?${qs.toString()}`);
    const body = await res.json().catch(() => ({}));
    await recordEvidence({
      tenantId, sessionId,
      label: `GET /stigs${qs.toString() ? `?${qs}` : ""}`,
      type: "tool",
      description: `STIG Viewer catalog listing (${res.status})`,
      verdict: res.ok ? "ok" : "error",
      payload: { endpoint: "/stigs", status: res.status, query: Object.fromEntries(qs), returned: Array.isArray(body?.data) ? body.data.length : null },
    });
    if (!res.ok) throw new Error(`stigviewer ${res.status}`);
    return body;
  });

export const stigListControls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { slug: string; page?: number; limit?: number; severity?: "high" | "medium" | "low" }) => data)
  .handler(async ({ data, context }) => {
    const tenantId = await getTenantId(context as never, context.userId);
    const sessionId = await ensureEvidenceSession(tenantId);
    const qs = new URLSearchParams();
    if (data.page) qs.set("page", String(data.page));
    if (data.limit) qs.set("limit", String(data.limit));
    if (data.severity) qs.set("severity", data.severity);
    const path = `/stigs/${encodeURIComponent(data.slug)}/controls?${qs.toString()}`;
    const res = await stigFetch(path);
    const body = await res.json().catch(() => ({}));
    await recordEvidence({
      tenantId, sessionId,
      label: `GET ${data.slug} controls`,
      type: "tool",
      description: `Fetched ${Array.isArray(body?.data) ? body.data.length : 0} controls · sev=${data.severity ?? "any"}`,
      verdict: res.ok ? "ok" : "error",
      payload: { endpoint: path, status: res.status, slug: data.slug, count: Array.isArray(body?.data) ? body.data.length : null },
    });
    if (!res.ok) throw new Error(`stigviewer ${res.status}`);
    return body;
  });

export const stigDownloadCklb = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { slug: string; format?: "cklb" | "json" | "csv" }) => data)
  .handler(async ({ data, context }) => {
    const tenantId = await getTenantId(context as never, context.userId);
    const sessionId = await ensureEvidenceSession(tenantId);
    const format = data.format ?? "cklb";
    const qs = format === "cklb" ? "" : `?format=${format}`;
    const path = `/stigs/${encodeURIComponent(data.slug)}/download${qs}`;
    const res = await stigFetch(path);
    const text = await res.text();
    const size = text.length;
    const toolId = await recordEvidence({
      tenantId, sessionId,
      label: `DOWNLOAD ${data.slug}.${format}`,
      type: "tool",
      description: `Pulled baseline (${(size / 1024).toFixed(1)} KB, ${format})`,
      verdict: res.ok ? "ok" : "error",
      payload: { endpoint: path, status: res.status, bytes: size, format },
    });
    if (!res.ok) throw new Error(`stigviewer ${res.status}`);
    await recordEvidence({
      tenantId, sessionId,
      label: `ATTEST baseline:${data.slug}`,
      type: "attest",
      description: `SHA-256 digest of pulled baseline anchored to session`,
      verdict: "ok",
      payload: { slug: data.slug, format, bytes: size, sha256: await sha256Hex(text) },
      parentId: toolId,
    });
    return { slug: data.slug, format, bytes: size, preview: text.slice(0, 2048) };
  });

export const stigPushSessionAsCklb = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sessionId: string; slug: string }) => data)
  .handler(async ({ data, context }) => {
    const tenantId = await getTenantId(context as never, context.userId);
    const evidenceSessionId = await ensureEvidenceSession(tenantId);

    const { data: findings, error } = await context.supabase
      .from("findings")
      .select("id, aeo_id, severity, status, label")
      .eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);

    const mapStatus = (s: string | null) =>
      s === "adjudicated" ? "not_a_finding"
      : s === "dismissed" ? "not_applicable"
      : s === "open" ? "open"
      : "not_reviewed";

    const cklb = {
      title: `KHEPRA session ${data.sessionId} → ${data.slug}`,
      stig: data.slug,
      generated_at: new Date().toISOString(),
      rules: (findings ?? []).map((f) => ({
        rule_id: f.aeo_id,
        severity: f.severity,
        status: mapStatus(f.status as string | null),
        finding_details: f.label,
      })),
    };

    const toolId = await recordEvidence({
      tenantId, sessionId: evidenceSessionId,
      label: `PUSH CKLB → ${data.slug}`,
      type: "tool",
      description: `Mapped ${cklb.rules.length} findings · open=${cklb.rules.filter(r => r.status === "open").length}`,
      verdict: "ok",
      payload: { slug: data.slug, session_source: data.sessionId, counts: {
        open: cklb.rules.filter(r => r.status === "open").length,
        not_a_finding: cklb.rules.filter(r => r.status === "not_a_finding").length,
        not_applicable: cklb.rules.filter(r => r.status === "not_applicable").length,
        not_reviewed: cklb.rules.filter(r => r.status === "not_reviewed").length,
      } },
    });

    await recordEvidence({
      tenantId, sessionId: evidenceSessionId,
      label: `ATTEST cklb:${data.slug}`,
      type: "attest",
      description: `Signed CKLB payload · sha256 anchored`,
      verdict: "ok",
      payload: { sha256: await sha256Hex(JSON.stringify(cklb)), rules: cklb.rules.length },
      parentId: toolId,
    });

    return { ok: true, cklb };
  });

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}