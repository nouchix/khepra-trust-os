import { createFileRoute } from "@tanstack/react-router";
import { createHmac } from "crypto";
import { buildScenario, type FabricBundle, type Scenario } from "@/lib/fabric-demo";

// KHEPRA Trust Fabric — public evidence gateway.
//
// Philosophy (Residual Intelligence / Digital Citizenship): the browser is
// UNTRUSTED. It does not build, hash, or sign evidence — it only renders what
// this gateway returns. The pipeline here is the trust boundary:
//
//   request → validate → build fabric (server) → canonicalize → hash → sign → AEO bundle
//
// The scenario is produced server-side by the in-process Trust OS Fabric
// (real SHA-256 hash chains). When a sovereign MCP endpoint is configured
// (KHEPRA_MCP_ENDPOINT + KHEPRA_MCP_TOKEN, default https://mcp.souhimbou.ai),
// the gateway also proves liveness against it and attributes the source — but it
// NEVER lets an unreachable endpoint blank the demo: it falls back to the
// in-process gateway. No token ever reaches the browser.

const CORS = { "Access-Control-Allow-Origin": "*" };
const DEFAULT_MCP_ENDPOINT = "https://mcp.souhimbou.ai";

// Deterministic canonical form so the signature is reproducible from the bundle.
function canonical(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`)
    .join(",")}}`;
}

function sign(scenario: Scenario): string {
  // Demo salt when no ingress secret is set — clearly not a production key, but
  // enough to demonstrate that the browser cannot forge the server's signature.
  const secret = process.env.KHEPRA_INGRESS_SECRET ?? "khepra-public-demo-gateway";
  const body = canonical({ steps: scenario.steps, totals: scenario.totals, algorithm: scenario.algorithm });
  return createHmac("sha256", secret).update(body).digest("hex");
}

// Best-effort liveness probe against the sovereign MCP server (JSON-RPC 2.0
// Streamable HTTP, as the console/dag-viewer clients speak it). Returns the
// attributed source; never throws.
async function probeLiveSource(): Promise<string> {
  const token = process.env.KHEPRA_MCP_TOKEN;
  if (!token) return "khepra-evidence-gateway";
  const endpoint = process.env.KHEPRA_MCP_ENDPOINT ?? DEFAULT_MCP_ENDPOINT;
  try {
    const res = await fetch(`${endpoint}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: { name: "ledger_stats", arguments: {} },
      }),
      signal: AbortSignal.timeout(4000),
    });
    return res.ok ? "mcp.souhimbou.ai" : "khepra-evidence-gateway";
  } catch {
    return "khepra-evidence-gateway";
  }
}

async function bundle(): Promise<FabricBundle> {
  const scenario = await buildScenario();
  const source = await probeLiveSource();
  return {
    ...scenario,
    source,
    signature: sign(scenario),
    signedAt: new Date().toISOString(),
  };
}

export const Route = createFileRoute("/api/public/fabric")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            ...CORS,
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "content-type",
          },
        }),
      GET: async () => {
        try {
          return Response.json(await bundle(), { status: 200, headers: CORS });
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "gateway error" },
            { status: 500, headers: CORS },
          );
        }
      },
    },
  },
});
