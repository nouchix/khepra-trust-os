import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { getMyTenant } from "@/lib/console/tenant.functions";
import {
  smitheryEnsureConnection,
  smitheryListTools,
  smitheryCallTool,
} from "@/lib/console/smithery.functions";

export const Route = createFileRoute("/_authenticated/console/mcp")({
  head: () => ({
    meta: [
      { title: "MCP Fabric · KHEPRA Stargate" },
      { name: "description", content: "Invoke PQC-Khepra MCP tools via Smithery and record cryptographic evidence." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: McpPage,
});

const mono: React.CSSProperties = { fontFamily: "var(--font-mono, ui-monospace)" };
const card: React.CSSProperties = {
  background: "var(--nx-bg2)",
  border: "1px solid var(--nx-border)",
  borderRadius: 6,
  padding: 16,
};
const btn: React.CSSProperties = {
  padding: "6px 12px",
  border: "1px solid var(--nx-border2)",
  borderRadius: 4,
  background: "var(--nx-bg3)",
  color: "var(--nx-blue)",
  fontSize: 11,
  letterSpacing: 1.2,
  cursor: "pointer",
  ...mono,
};

function McpPage() {
  const tenantFn = useServerFn(getMyTenant);
  const ensureFn = useServerFn(smitheryEnsureConnection);
  const listFn = useServerFn(smitheryListTools);
  const callFn = useServerFn(smitheryCallTool);

  const tenantQ = useQuery({ queryKey: ["tenant"], queryFn: () => tenantFn({}) });

  const ensure = useMutation({ mutationFn: () => ensureFn({ data: {} }) });
  const list = useMutation({ mutationFn: () => listFn({ data: {} }) });

  const [toolName, setToolName] = useState("threat_model");
  const [argsText, setArgsText] = useState("{}");
  const [parseErr, setParseErr] = useState<string | null>(null);
  const call = useMutation({
    mutationFn: async () => {
      let args: Record<string, unknown> = {};
      try {
        args = argsText.trim() ? (JSON.parse(argsText) as Record<string, unknown>) : {};
        setParseErr(null);
      } catch (e) {
        setParseErr(e instanceof Error ? e.message : "invalid JSON");
        throw e;
      }
      return callFn({ data: { toolName, args } });
    },
  });

  const tenant = tenantQ.data
    ? { name: tenantQ.data.name, classification: tenantQ.data.classification, role: tenantQ.data.role }
    : null;

  const conn = ensure.data;
  const tools = list.data?.tools ?? [];

  return (
    <ConsoleShell
      tenant={tenant}
      sessionRef="smithery-mcp"
      leftPanel={
        <div className="flex flex-col gap-3" style={{ ...mono, fontSize: 11, color: "var(--nx-text2)" }}>
          <div>
            <div style={{ color: "var(--ak-gold)", letterSpacing: 1.5, fontSize: 10 }}>SERVER</div>
            <div style={{ color: "var(--nx-text)", marginTop: 4 }}>pqc-khepra-mcp</div>
            <div style={{ fontSize: 10, marginTop: 2 }}>server.smithery.ai/skone/pqc-khepra-mcp</div>
          </div>
          <div>
            <div style={{ color: "var(--ak-gold)", letterSpacing: 1.5, fontSize: 10 }}>CONNECTION</div>
            <div style={{ color: "var(--nx-text)", marginTop: 4, wordBreak: "break-all" }}>
              {conn?.connectionId ?? "—"}
            </div>
            <div style={{ fontSize: 10, marginTop: 2 }}>state: {conn?.status ?? "not opened"}</div>
          </div>
          <div>
            <div style={{ color: "var(--ak-gold)", letterSpacing: 1.5, fontSize: 10 }}>EVIDENCE</div>
            <div style={{ fontSize: 10, marginTop: 4, lineHeight: 1.5 }}>
              Every connect / list / call emits an AEO tool node plus a SHA-256 attest anchor into session{" "}
              <span style={{ color: "var(--nx-blue)" }}>smithery-mcp</span>. Open <b>Timeline</b> to view the DAG.
            </div>
          </div>
        </div>
      }
    >
      <div style={{ padding: 20, overflowY: "auto", height: "100%", color: "var(--nx-text)" }}>
        <div className="flex items-center gap-3 mb-4">
          <h1 style={{ ...mono, fontSize: 18, letterSpacing: 2, color: "var(--nx-blue)" }}>MCP FABRIC · SMITHERY</h1>
          <span style={{ ...mono, fontSize: 10, color: "var(--nx-muted)" }}>
            PQC-Khepra tools · Type-checked invocation · Cryptographic replay
          </span>
        </div>

        <section style={{ ...card, marginBottom: 16 }}>
          <div className="flex items-center gap-3 mb-3">
            <h2 style={{ ...mono, fontSize: 11, letterSpacing: 1.5, color: "var(--ak-gold)" }}>1 · OPEN CONNECTION</h2>
          </div>
          <div className="flex items-center gap-3">
            <button style={btn} disabled={ensure.isPending} onClick={() => ensure.mutate()}>
              {ensure.isPending ? "OPENING…" : conn ? "REFRESH CONNECTION" : "CONNECT MCP"}
            </button>
            {conn && (
              <span style={{ ...mono, fontSize: 11, color: conn.status === "connected" ? "var(--cat3, #22c55e)" : "var(--ak-gold)" }}>
                {conn.reused ? "reused" : "created"} · {conn.status} · {conn.mcpUrl}
              </span>
            )}
            {ensure.error && (
              <span style={{ ...mono, fontSize: 11, color: "var(--cat1, #ff6b7a)" }}>
                {(ensure.error as Error).message}
              </span>
            )}
          </div>
        </section>

        <section style={{ ...card, marginBottom: 16 }}>
          <div className="flex items-center gap-3 mb-3">
            <h2 style={{ ...mono, fontSize: 11, letterSpacing: 1.5, color: "var(--ak-gold)" }}>2 · DISCOVER TOOLS</h2>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <button style={btn} disabled={list.isPending} onClick={() => list.mutate()}>
              {list.isPending ? "LISTING…" : "LIST TOOLS"}
            </button>
            {list.error && (
              <span style={{ ...mono, fontSize: 11, color: "var(--cat1, #ff6b7a)" }}>
                {(list.error as Error).message}
              </span>
            )}
          </div>
          {tools.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
              {tools.map((t, i) => {
                const name = (t as { name?: string }).name ?? `tool-${i}`;
                const desc = (t as { description?: string; title?: string }).description ?? (t as { title?: string }).title ?? "";
                return (
                  <>
                    <button
                      key={`n-${i}`}
                      style={{ ...btn, textAlign: "left", color: "var(--nx-text)" }}
                      onClick={() => setToolName(name)}
                    >
                      {name}
                    </button>
                    <div key={`d-${i}`} style={{ ...mono, fontSize: 11, color: "var(--nx-text2)", padding: "6px 0" }}>
                      {desc}
                    </div>
                  </>
                );
              })}
            </div>
          )}
        </section>

        <section style={{ ...card }}>
          <div className="flex items-center gap-3 mb-3">
            <h2 style={{ ...mono, fontSize: 11, letterSpacing: 1.5, color: "var(--ak-gold)" }}>3 · INVOKE TOOL</h2>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <label style={{ ...mono, fontSize: 10, color: "var(--nx-muted)" }}>TOOL</label>
            <input
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              style={{ ...mono, background: "var(--nx-bg3)", border: "1px solid var(--nx-border2)", color: "var(--nx-text)", padding: "4px 8px", borderRadius: 4, fontSize: 12, minWidth: 220 }}
            />
            <button style={btn} disabled={call.isPending || !toolName} onClick={() => call.mutate()}>
              {call.isPending ? "INVOKING…" : "INVOKE"}
            </button>
          </div>
          <label style={{ ...mono, fontSize: 10, color: "var(--nx-muted)", display: "block", marginBottom: 4 }}>
            ARGS (JSON)
          </label>
          <textarea
            value={argsText}
            onChange={(e) => setArgsText(e.target.value)}
            rows={4}
            style={{ ...mono, width: "100%", background: "var(--nx-bg3)", border: "1px solid var(--nx-border2)", color: "var(--nx-text)", padding: 8, borderRadius: 4, fontSize: 12 }}
          />
          {parseErr && <div style={{ ...mono, fontSize: 11, color: "var(--cat1, #ff6b7a)", marginTop: 4 }}>JSON error: {parseErr}</div>}
          {call.error && !parseErr && (
            <div style={{ ...mono, fontSize: 11, color: "var(--cat1, #ff6b7a)", marginTop: 8 }}>
              {(call.error as Error).message}
            </div>
          )}
          {call.data && (
            <div style={{ marginTop: 12 }}>
              <div className="flex items-center gap-3 mb-2">
                <span style={{ ...mono, fontSize: 10, color: call.data.verdict === "ok" ? "var(--cat3, #22c55e)" : "var(--cat1, #ff6b7a)", letterSpacing: 1.5 }}>
                  {call.data.verdict?.toUpperCase()}
                </span>
                <span style={{ ...mono, fontSize: 10, color: "var(--nx-muted)" }}>
                  {call.data.durationMs}ms · sha256:{" "}
                  <span style={{ color: "var(--nx-blue)" }}>{call.data.responseSha256?.slice(0, 16)}…</span>
                </span>
              </div>
              <pre
                style={{
                  ...mono,
                  background: "var(--nx-bg3)",
                  border: "1px solid var(--nx-border2)",
                  color: "var(--nx-text)",
                  padding: 10,
                  borderRadius: 4,
                  fontSize: 11,
                  maxHeight: 320,
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {JSON.stringify(call.data.response ?? { error: call.data.error }, null, 2)}
              </pre>
            </div>
          )}
        </section>
      </div>
    </ConsoleShell>
  );
}