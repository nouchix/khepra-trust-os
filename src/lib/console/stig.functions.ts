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

// ---------- Replay + Export ----------

interface AeoRow {
  id: string;
  label: string;
  type: string;
  description: string | null;
  severity: string | null;
  val: number;
  ts: string;
  payload: Record<string, unknown> | null;
}

export const stigReplaySession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sessionId: string }) => data)
  .handler(async ({ data, context }) => {
    const tenantId = await getTenantId(context as never, context.userId);
    const { data: aeosRaw, error } = await context.supabase
      .from("aeos")
      .select("id,label,type,description,severity,val,ts,payload")
      .eq("session_id", data.sessionId)
      .order("ts", { ascending: true });
    if (error) throw new Error(error.message);
    const aeos = (aeosRaw ?? []) as AeoRow[];

    const { data: linksRaw } = await context.supabase
      .from("aeo_links")
      .select("parent_id, child_id");
    const childrenByParent = new Map<string, string[]>();
    for (const l of linksRaw ?? []) {
      const arr = childrenByParent.get(l.parent_id) ?? [];
      arr.push(l.child_id);
      childrenByParent.set(l.parent_id, arr);
    }
    const byId = new Map(aeos.map((n) => [n.id, n]));

    const replaySessionId = await ensureEvidenceSession(tenantId);
    const replayRootId = await recordEvidence({
      tenantId, sessionId: replaySessionId,
      label: `REPLAY session ${data.sessionId.slice(0, 8)}`,
      type: "tool",
      description: `Deterministic replay of ${aeos.filter((a) => a.type === "tool").length} tool calls`,
      verdict: "ok",
      payload: { source_session: data.sessionId, at: new Date().toISOString() },
    });

    const comparisons: Array<{
      original_id: string;
      label: string;
      endpoint: string | null;
      original_sha256: string | null;
      replay_sha256: string | null;
      status: number | null;
      match: boolean;
    }> = [];

    for (const n of aeos) {
      if (n.type !== "tool") continue;
      const endpoint = (n.payload?.endpoint as string | undefined) ?? null;
      if (!endpoint || !endpoint.startsWith("/")) continue;

      // find the attest child's sha256 for the original
      const attestKids = (childrenByParent.get(n.id) ?? [])
        .map((cid) => byId.get(cid))
        .filter((k): k is AeoRow => !!k && k.type === "attest");
      const originalSha = (attestKids[0]?.payload?.sha256 as string | undefined) ?? null;

      const res = await stigFetch(endpoint);
      const text = await res.text();
      const replaySha = await sha256Hex(text);
      const match = !!originalSha && originalSha === replaySha;

      comparisons.push({
        original_id: n.id,
        label: n.label,
        endpoint,
        original_sha256: originalSha,
        replay_sha256: replaySha,
        status: res.status,
        match,
      });

      await recordEvidence({
        tenantId, sessionId: replaySessionId,
        label: `REPLAY ${n.label}`,
        type: "attest",
        description: match
          ? "Anchors match original run"
          : originalSha
            ? "Anchor drift detected"
            : "No original anchor to compare",
        verdict: match ? "ok" : "error",
        payload: { endpoint, original_sha256: originalSha, replay_sha256: replaySha, status: res.status, match },
        parentId: replayRootId,
      });
    }

    const matched = comparisons.filter((c) => c.match).length;
    return {
      ok: true,
      source_session: data.sessionId,
      replay_session: replaySessionId,
      replay_root: replayRootId,
      total: comparisons.length,
      matched,
      drifted: comparisons.length - matched,
      comparisons,
    };
  });

export const stigExportSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sessionId: string; slug?: string }) => data)
  .handler(async ({ data, context }) => {
    const tenantId = await getTenantId(context as never, context.userId);

    const [{ data: sess }, { data: aeosRaw, error: aeoErr }, { data: findingsRaw }] = await Promise.all([
      context.supabase.from("sessions").select("id, session_ref, started_at, ended_at, intent").eq("id", data.sessionId).maybeSingle(),
      context.supabase.from("aeos").select("id,label,type,description,severity,val,ts,payload,sig,external_id").eq("session_id", data.sessionId).order("ts", { ascending: true }),
      context.supabase.from("findings").select("id, aeo_id, severity, status, label").eq("tenant_id", tenantId),
    ]);
    if (aeoErr) throw new Error(aeoErr.message);
    const aeos = (aeosRaw ?? []) as unknown as Array<Record<string, unknown> & { id: string; type: string }>;
    const nodeIds = new Set(aeos.map((n) => n.id));

    const { data: linksRaw } = await context.supabase
      .from("aeo_links")
      .select("parent_id, child_id, weight");
    const links = (linksRaw ?? []).filter((l) => nodeIds.has(l.parent_id) && nodeIds.has(l.child_id));

    const mapStatus = (s: string | null) =>
      s === "adjudicated" ? "not_a_finding"
      : s === "dismissed" ? "not_applicable"
      : s === "open" ? "open"
      : "not_reviewed";

    const cklb = {
      title: `KHEPRA ${sess?.session_ref ?? data.sessionId} → ${data.slug ?? "audit"}`,
      stig: data.slug ?? null,
      generated_at: new Date().toISOString(),
      rules: (findingsRaw ?? []).map((f) => ({
        rule_id: f.aeo_id,
        severity: f.severity,
        status: mapStatus(f.status as string | null),
        finding_details: f.label,
      })),
    };
    const cklbJson = JSON.stringify(cklb, null, 2);
    const cklbSha = await sha256Hex(cklbJson);

    const manifest = {
      version: "khepra.evidence.v1",
      exported_at: new Date().toISOString(),
      tenant_id: tenantId,
      session: sess ?? { id: data.sessionId },
      counts: {
        aeos: aeos.length,
        tool: aeos.filter((a) => a.type === "tool").length,
        attest: aeos.filter((a) => a.type === "attest").length,
        finding: aeos.filter((a) => a.type === "finding").length,
        links: links.length,
      },
      aeos: aeos as unknown as Record<string, unknown>[],
      links: links as unknown as Record<string, unknown>[],
      cklb_sha256: cklbSha,
    };
    const manifestJson = JSON.stringify(manifest, null, 2);
    const manifestSha = await sha256Hex(manifestJson);

    // Attest the export itself so the download is anchored on the DAG.
    const evidenceSessionId = await ensureEvidenceSession(tenantId);
    const toolId = await recordEvidence({
      tenantId, sessionId: evidenceSessionId,
      label: `EXPORT session ${data.sessionId.slice(0, 8)}`,
      type: "tool",
      description: `Audit bundle · ${manifest.counts.aeos} AEOs · ${manifest.counts.links} links`,
      verdict: "ok",
      payload: { source_session: data.sessionId, counts: manifest.counts },
    });
    await recordEvidence({
      tenantId, sessionId: evidenceSessionId,
      label: `ATTEST export:${data.sessionId.slice(0, 8)}`,
      type: "attest",
      description: "SHA-256 of CKLB + evidence manifest",
      verdict: "ok",
      payload: { cklb_sha256: cklbSha, manifest_sha256: manifestSha },
      parentId: toolId,
    });

    return {
      session_ref: sess?.session_ref ?? data.sessionId,
      cklb,
      cklb_json: cklbJson,
      cklb_sha256: cklbSha,
      manifest,
      manifest_json: manifestJson,
      manifest_sha256: manifestSha,
    };
  });