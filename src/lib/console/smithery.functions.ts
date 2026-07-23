import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EVIDENCE_SESSION_REF = "smithery-mcp";
const DEFAULT_MCP_URL = "https://server.smithery.ai/skone/pqc-khepra-mcp";
const DEFAULT_MCP_NAME = "pqc-khepra-mcp";

type Verdict = "ok" | "error";

function requireEnv() {
  const apiKey = process.env.SMITHERY_API_KEY;
  const namespace = process.env.SMITHERY_NAMESPACE;
  if (!apiKey) throw new Error("SMITHERY_API_KEY not configured");
  if (!namespace)
    throw new Error(
      "SMITHERY_NAMESPACE not configured — set it to your Smithery namespace (org/user slug)",
    );
  return { apiKey, namespace };
}

async function getSmithery() {
  const { apiKey } = requireEnv();
  const mod = await import("@smithery/api");
  const Smithery = mod.default;
  return new Smithery({ apiKey });
}

async function getTenantId(
  context: {
    supabase: {
      from: (t: string) => {
        select: (c: string) => {
          eq: (col: string, v: string) => {
            limit: (n: number) => {
              maybeSingle: () => Promise<{ data: { tenant_id: string } | null }>;
            };
          };
        };
      };
    };
  },
  userId: string,
) {
  const { data } = await context.supabase
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!data?.tenant_id) throw new Error("no tenant membership");
  return data.tenant_id;
}

async function ensureSession(tenantId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing } = await supabaseAdmin
    .from("sessions")
    .select("id, intent")
    .eq("tenant_id", tenantId)
    .eq("session_ref", EVIDENCE_SESSION_REF)
    .maybeSingle();
  if (existing) return { sessionId: existing.id as string, intent: (existing.intent ?? {}) as Record<string, unknown> };
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .insert({
      tenant_id: tenantId,
      session_ref: EVIDENCE_SESSION_REF,
      intent: { source: "smithery.ai", purpose: "MCP tool invocation + attestation" } as never,
    })
    .select("id, intent")
    .single();
  if (error || !data) throw new Error(error?.message ?? "session create failed");
  return { sessionId: data.id as string, intent: (data.intent ?? {}) as Record<string, unknown> };
}

async function updateSessionIntent(sessionId: string, intent: Record<string, unknown>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("sessions").update({ intent: intent as never }).eq("id", sessionId);
}

async function recordEvidence(opts: {
  tenantId: string;
  sessionId: string;
  label: string;
  type: "tool" | "attest" | "finding";
  description: string;
  verdict: Verdict;
  payload: Record<string, unknown>;
  parentId?: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const id = crypto.randomUUID();
  const external_id = `smithery:${opts.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}:${id.slice(0, 8)}`;
  const { error } = await supabaseAdmin.from("aeos").insert({
    id,
    tenant_id: opts.tenantId,
    session_id: opts.sessionId,
    external_id,
    label: opts.label,
    type: opts.type,
    description: opts.description,
    verdict: opts.verdict,
    val: opts.type === "finding" ? 10 : 6,
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

async function sha256Hex(input: string) {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Create or reuse a Smithery MCP connection for this tenant. */
export const smitheryEnsureConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { mcpUrl?: string; name?: string } = {}) => data)
  .handler(async ({ data, context }) => {
    const { namespace } = requireEnv();
    const tenantId = await getTenantId(context as never, context.userId);
    const { sessionId, intent } = await ensureSession(tenantId);

    const mcpUrl = data.mcpUrl ?? DEFAULT_MCP_URL;
    const name = data.name ?? DEFAULT_MCP_NAME;

    const existingId = typeof intent.connectionId === "string" ? intent.connectionId : null;
    const smithery = await getSmithery();

    if (existingId) {
      try {
        const conn = await smithery.connections.get(existingId, { namespace });
        return { connectionId: conn.connectionId, status: conn.status?.state ?? "unknown", reused: true, mcpUrl: conn.mcpUrl };
      } catch {
        // fall through and re-create
      }
    }

    let connectionId: string;
    let status: string;
    let effectiveUrl: string | null;
    try {
      const conn = await smithery.connections.create(namespace, { mcpUrl, name });
      connectionId = conn.connectionId;
      status = conn.status?.state ?? "unknown";
      effectiveUrl = conn.mcpUrl;
    } catch (e) {
      await recordEvidence({
        tenantId, sessionId,
        label: `connect ${name}`,
        type: "attest",
        description: `Failed to open MCP connection to ${mcpUrl}`,
        verdict: "error",
        payload: { namespace, mcpUrl, error: e instanceof Error ? e.message : String(e) },
      });
      throw e;
    }

    await updateSessionIntent(sessionId, { ...intent, connectionId, mcpUrl: effectiveUrl, namespace, name });
    await recordEvidence({
      tenantId, sessionId,
      label: `connect ${name}`,
      type: "attest",
      description: `Opened Smithery MCP connection to ${effectiveUrl ?? mcpUrl}`,
      verdict: "ok",
      payload: { namespace, connectionId, mcpUrl: effectiveUrl, status },
    });
    return { connectionId, status, reused: false, mcpUrl: effectiveUrl };
  });

/** List tools exposed by the tenant's MCP connection. */
export const smitheryListTools = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown = {}) => data as Record<string, never>)
  .handler(async ({ context }) => {
    const { namespace } = requireEnv();
    const tenantId = await getTenantId(context as never, context.userId);
    const { sessionId, intent } = await ensureSession(tenantId);
    const connectionId = typeof intent.connectionId === "string" ? intent.connectionId : null;
    if (!connectionId) throw new Error("No MCP connection yet — call smitheryEnsureConnection first");

    const smithery = await getSmithery();
    const list = await smithery.connections.tools.list(connectionId, { namespace });
    const rawTools = (list as { tools?: unknown[] }).tools ?? [];
    const tools = JSON.parse(JSON.stringify(rawTools)) as Array<Record<string, unknown>>;
    await recordEvidence({
      tenantId, sessionId,
      label: "list tools",
      type: "tool",
      description: `Discovered ${tools.length} MCP tools from ${DEFAULT_MCP_NAME}`,
      verdict: "ok",
      payload: { connectionId, count: tools.length, names: tools.map((t) => (t as { name?: string }).name).filter(Boolean) },
    });
    return { tools };
  });

/** Invoke a Smithery MCP tool and record the invocation on the DAG. */
export const smitheryCallTool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { toolName: string; args?: Record<string, unknown> }) => data)
  .handler(async ({ data, context }) => {
    if (!data?.toolName) throw new Error("toolName required");
    const { namespace } = requireEnv();
    const tenantId = await getTenantId(context as never, context.userId);
    const { sessionId, intent } = await ensureSession(tenantId);
    const connectionId = typeof intent.connectionId === "string" ? intent.connectionId : null;
    if (!connectionId) throw new Error("No MCP connection yet — call smitheryEnsureConnection first");

    const smithery = await getSmithery();
    const startedAt = Date.now();
    let response: unknown;
    let verdict: Verdict = "ok";
    let errorMessage: string | null = null;
    try {
      response = await smithery.connections.tools.call(data.toolName, {
        namespace,
        connectionId,
        body: data.args ?? {},
      } as never);
    } catch (e) {
      verdict = "error";
      errorMessage = e instanceof Error ? e.message : String(e);
    }
    const durationMs = Date.now() - startedAt;
    const serialized = JSON.stringify(response ?? { error: errorMessage });
    const safeResponse = (response == null ? null : JSON.parse(serialized)) as Record<string, unknown> | null;
    const responseSha256 = await sha256Hex(serialized);

    const toolId = await recordEvidence({
      tenantId, sessionId,
      label: `tool ${data.toolName}`,
      type: "tool",
      description: `Invoked ${data.toolName} (${durationMs}ms)`,
      verdict,
      payload: { toolName: data.toolName, args: data.args ?? {}, durationMs, connectionId },
    });
    await recordEvidence({
      tenantId, sessionId,
      label: `attest ${data.toolName}`,
      type: "attest",
      description: `SHA-256 anchor for ${data.toolName} response`,
      verdict,
      payload: { toolName: data.toolName, responseSha256, bytes: serialized.length, error: errorMessage },
      parentId: toolId,
    });

    return {
      verdict,
      durationMs,
      responseSha256,
      response: safeResponse,
      error: errorMessage,
    };
  });