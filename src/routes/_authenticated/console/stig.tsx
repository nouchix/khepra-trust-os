import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { getMyTenant } from "@/lib/console/tenant.functions";
import { listSessions } from "@/lib/console/aeos.functions";
import {
  stigListStigs,
  stigListControls,
  stigDownloadCklb,
  stigPushSessionAsCklb,
  stigReplaySession,
  stigExportSession,
} from "@/lib/console/stig.functions";

export const Route = createFileRoute("/_authenticated/console/stig")({
  head: () => ({ meta: [{ title: "STIG · KHEPRA Stargate" }, { name: "robots", content: "noindex" }] }),
  component: StigPage,
});

type Row = Record<string, unknown>;

const cellHead: React.CSSProperties = { textAlign: "left", padding: "6px 8px", fontWeight: 500 };
const cell: React.CSSProperties = { padding: "6px 8px", verticalAlign: "top" };

const STATUS_MAP: Array<{ k: string; cklb: string; note: string; color: string }> = [
  { k: "open", cklb: "open", note: "Unresolved · counts against posture", color: "var(--cat1, #ff6b7a)" },
  { k: "adjudicated", cklb: "not_a_finding", note: "Reviewed & accepted as compliant", color: "var(--nx-blue)" },
  { k: "dismissed", cklb: "not_applicable", note: "Control does not apply to this asset", color: "var(--ak-gold)" },
  { k: "(null / new)", cklb: "not_reviewed", note: "Awaiting analyst adjudication", color: "var(--nx-muted)" },
];

function downloadText(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function StigPage() {
  const tenantFn = useServerFn(getMyTenant);
  const sessionsFn = useServerFn(listSessions);
  const listStigs = useServerFn(stigListStigs);
  const listControls = useServerFn(stigListControls);
  const download = useServerFn(stigDownloadCklb);
  const push = useServerFn(stigPushSessionAsCklb);
  const replay = useServerFn(stigReplaySession);
  const exportFn = useServerFn(stigExportSession);

  const qc = useQueryClient();
  const tenantQ = useQuery({ queryKey: ["tenant"], queryFn: () => tenantFn() });
  const sessionsQ = useQuery({ queryKey: ["sessions"], queryFn: () => sessionsFn() });

  const [slug, setSlug] = useState("microsoft_windows_server_2022");
  const [severity, setSeverity] = useState<"high" | "medium" | "low" | "">("high");
  const [page, setPage] = useState(1);

  const catalogQ = useQuery({
    queryKey: ["stig-catalog"],
    queryFn: () => listStigs({ data: { page: 1, limit: 25 } }),
  });

  const controlsM = useMutation({
    mutationFn: () => listControls({ data: { slug, page, limit: 10, severity: severity || undefined } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const downloadM = useMutation({
    mutationFn: (format: "cklb" | "json" | "csv") => download({ data: { slug, format } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const [pushSessionId, setPushSessionId] = useState<string>("");
  const pushM = useMutation({
    mutationFn: () => push({ data: { sessionId: pushSessionId, slug } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const replayM = useMutation({
    mutationFn: (sessionId: string) => replay({ data: { sessionId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const exportM = useMutation({
    mutationFn: (sessionId: string) => exportFn({ data: { sessionId, slug } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const base = `khepra-${res.session_ref}-${stamp}`;
      downloadText(`${base}.cklb.json`, res.cklb_json);
      downloadText(`${base}.manifest.json`, res.manifest_json);
    },
  });

  const stigSessions = (sessionsQ.data ?? []).filter((s) => s.session_ref === "stig-integration");

  const controlsRows: Row[] = Array.isArray((controlsM.data as { data?: Row[] })?.data)
    ? ((controlsM.data as { data: Row[] }).data)
    : [];
  const catalogRows: Row[] = Array.isArray((catalogQ.data as { data?: Row[] })?.data)
    ? ((catalogQ.data as { data: Row[] }).data)
    : [];

  return (
    <ConsoleShell
      tenant={tenantQ.data ? { name: tenantQ.data.name, classification: tenantQ.data.classification, role: tenantQ.data.role } : null}
      leftPanel={
        <div className="cs-mono" style={{ fontSize: 11, color: "var(--nx-text2)", lineHeight: 1.6 }}>
          <div style={{ color: "var(--nx-blue)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            STIG Viewer Bridge
          </div>
          <p>Every call below emits AEO evidence into the <span style={{ color: "var(--ak-gold)" }}>stig-integration</span> session, viewable on the Timeline.</p>
          <div style={{ marginTop: 12, color: "var(--nx-muted)", fontSize: 10 }}>Endpoint: stigviewer.com/api/v1</div>
          <div style={{ marginTop: 4, color: "var(--nx-muted)", fontSize: 10 }}>Token: STIGVIEWER_API_TOKEN (server-only)</div>
        </div>
      }
    >
      <div className="w-full h-full overflow-auto p-5" style={{ color: "var(--nx-text)" }}>
        {/* Status mapping table */}
        <div className="mb-5 p-3 rounded" style={{ background: "var(--nx-bg2)", border: "1px solid var(--nx-border)" }}>
          <div className="cs-mono uppercase mb-2" style={{ fontSize: 10, letterSpacing: 1.5, color: "var(--ak-gold)" }}>
            Finding status ↔ CKLB mapping
          </div>
          <div className="overflow-auto">
            <table className="cs-mono w-full" style={{ fontSize: 11, color: "var(--nx-text2)", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "var(--nx-muted)", fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase" }}>
                  <th style={cellHead}>KHEPRA finding.status</th>
                  <th style={cellHead}>CKLB status</th>
                  <th style={cellHead}>Semantics</th>
                </tr>
              </thead>
              <tbody>
                {STATUS_MAP.map((r) => (
                  <tr key={r.k} style={{ borderTop: "1px solid var(--nx-border)" }}>
                    <td style={cell}><span style={{ color: r.color }}>{r.k}</span></td>
                    <td style={cell}><span style={{ color: "var(--nx-blue)" }}>{r.cklb}</span></td>
                    <td style={{ ...cell, color: "var(--nx-muted)" }}>{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stig-integration session controls: replay + export */}
        <div className="mb-6 p-3 rounded" style={{ background: "var(--nx-bg2)", border: "1px solid var(--nx-border)" }}>
          <div className="cs-mono uppercase mb-2" style={{ fontSize: 10, letterSpacing: 1.5, color: "var(--ak-gold)" }}>
            stig-integration sessions · replay & audit export
          </div>
          {stigSessions.length === 0 ? (
            <div className="cs-mono" style={{ fontSize: 11, color: "var(--nx-muted)" }}>
              No stig-integration sessions yet — run a fetch or download above to seed evidence.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {stigSessions.map((s) => (
                <div key={s.id} className="flex items-center gap-2 flex-wrap p-2 rounded" style={{ background: "var(--nx-bg3)", border: "1px solid var(--nx-border)" }}>
                  <div className="cs-mono" style={{ fontSize: 11, color: "var(--nx-text)", minWidth: 200 }}>
                    {s.session_ref}
                    <span style={{ color: "var(--nx-muted)", marginLeft: 8, fontSize: 10 }}>{s.id.slice(0, 8)}</span>
                  </div>
                  <button
                    onClick={() => replayM.mutate(s.id)}
                    disabled={replayM.isPending}
                    className="cs-mono uppercase px-3 py-1.5 rounded"
                    style={{ background: "var(--nx-blue-glow)", border: "1px solid var(--nx-blue)", color: "var(--nx-blue)", fontSize: 10, letterSpacing: 1.5 }}
                  >
                    {replayM.isPending && replayM.variables === s.id ? "…" : "One-click replay"}
                  </button>
                  <button
                    onClick={() => exportM.mutate(s.id)}
                    disabled={exportM.isPending}
                    className="cs-mono uppercase px-3 py-1.5 rounded"
                    style={{ background: "var(--nx-bg3)", border: "1px solid var(--ak-gold)", color: "var(--ak-gold)", fontSize: 10, letterSpacing: 1.5 }}
                  >
                    {exportM.isPending && exportM.variables === s.id ? "…" : "Export CKLB + manifest"}
                  </button>
                </div>
              ))}
            </div>
          )}
          {replayM.data && (
            <div className="mt-3 p-2 rounded cs-mono" style={{ background: "var(--nx-bg3)", border: "1px solid var(--nx-border)", fontSize: 10, color: "var(--nx-text2)" }}>
              <div style={{ color: "var(--nx-blue)" }}>
                Replay · matched {replayM.data.matched}/{replayM.data.total} · drift {replayM.data.drifted}
              </div>
              <div style={{ color: "var(--nx-muted)" }}>
                replay session → {replayM.data.replay_session.slice(0, 8)} · root {replayM.data.replay_root.slice(0, 8)}
              </div>
              <pre className="mt-2 overflow-auto" style={{ maxHeight: 220 }}>{JSON.stringify(replayM.data.comparisons, null, 2)}</pre>
            </div>
          )}
          {exportM.data && (
            <div className="mt-3 p-2 rounded cs-mono" style={{ background: "var(--nx-bg3)", border: "1px solid var(--nx-border)", fontSize: 10, color: "var(--nx-text2)" }}>
              <div style={{ color: "var(--ak-gold)" }}>Export downloaded · {exportM.data.session_ref}</div>
              <div>cklb sha256 · {exportM.data.cklb_sha256}</div>
              <div>manifest sha256 · {exportM.data.manifest_sha256}</div>
              <div style={{ color: "var(--nx-muted)" }}>
                aeos {exportM.data.counts.aeos} · tool {exportM.data.counts.tool} · attest {exportM.data.counts.attest} · links {exportM.data.counts.links}
              </div>
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div className="flex flex-wrap items-end gap-3 mb-5">
          <label className="flex flex-col gap-1">
            <span className="cs-mono uppercase" style={{ fontSize: 9, letterSpacing: 1.5, color: "var(--nx-text2)" }}>Slug</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="cs-mono px-2 py-1.5 rounded"
              style={{ background: "var(--nx-bg3)", border: "1px solid var(--nx-border2)", color: "var(--nx-text)", fontSize: 12, minWidth: 340 }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="cs-mono uppercase" style={{ fontSize: 9, letterSpacing: 1.5, color: "var(--nx-text2)" }}>Severity</span>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as typeof severity)}
              className="cs-mono px-2 py-1.5 rounded"
              style={{ background: "var(--nx-bg3)", border: "1px solid var(--nx-border2)", color: "var(--nx-text)", fontSize: 12 }}
            >
              <option value="">any</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="cs-mono uppercase" style={{ fontSize: 9, letterSpacing: 1.5, color: "var(--nx-text2)" }}>Page</span>
            <input
              type="number" min={1} value={page}
              onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))}
              className="cs-mono px-2 py-1.5 rounded" style={{ background: "var(--nx-bg3)", border: "1px solid var(--nx-border2)", color: "var(--nx-text)", fontSize: 12, width: 72 }}
            />
          </label>

          <button onClick={() => controlsM.mutate()} className="cs-mono uppercase px-3 py-1.5 rounded"
            style={{ background: "var(--nx-blue-glow)", border: "1px solid var(--nx-blue)", color: "var(--nx-blue)", fontSize: 10, letterSpacing: 1.5 }}>
            {controlsM.isPending ? "…" : "Fetch controls"}
          </button>
          <button onClick={() => downloadM.mutate("cklb")} className="cs-mono uppercase px-3 py-1.5 rounded"
            style={{ background: "var(--nx-bg3)", border: "1px solid var(--nx-border2)", color: "var(--ak-gold)", fontSize: 10, letterSpacing: 1.5 }}>
            {downloadM.isPending ? "…" : "Download CKLB"}
          </button>
          <button onClick={() => downloadM.mutate("json")} className="cs-mono uppercase px-3 py-1.5 rounded"
            style={{ background: "var(--nx-bg3)", border: "1px solid var(--nx-border2)", color: "var(--nx-text2)", fontSize: 10, letterSpacing: 1.5 }}>
            JSON
          </button>
          <button onClick={() => downloadM.mutate("csv")} className="cs-mono uppercase px-3 py-1.5 rounded"
            style={{ background: "var(--nx-bg3)", border: "1px solid var(--nx-border2)", color: "var(--nx-text2)", fontSize: 10, letterSpacing: 1.5 }}>
            CSV
          </button>
        </div>

        {(controlsM.error || downloadM.error || pushM.error || catalogQ.error) && (
          <div className="cs-mono mb-4 p-2 rounded" style={{ background: "rgba(204,42,54,.08)", border: "1px solid rgba(204,42,54,.4)", color: "rgba(255,120,130,.9)", fontSize: 11 }}>
            {String(
              (controlsM.error as Error)?.message ||
              (downloadM.error as Error)?.message ||
              (pushM.error as Error)?.message ||
              (catalogQ.error as Error)?.message
            )}
          </div>
        )}

        {/* Push CKLB */}
        <div className="mb-6 p-3 rounded" style={{ background: "var(--nx-bg2)", border: "1px solid var(--nx-border)" }}>
          <div className="cs-mono uppercase mb-2" style={{ fontSize: 10, letterSpacing: 1.5, color: "var(--ak-gold)" }}>Push session findings → CKLB</div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={pushSessionId}
              onChange={(e) => setPushSessionId(e.target.value)}
              className="cs-mono px-2 py-1.5 rounded"
              style={{ background: "var(--nx-bg3)", border: "1px solid var(--nx-border2)", color: "var(--nx-text)", fontSize: 12, minWidth: 260 }}
            >
              <option value="">— select session —</option>
              {sessionsQ.data?.map((s) => (
                <option key={s.id} value={s.id}>{s.session_ref}</option>
              ))}
            </select>
            <button
              disabled={!pushSessionId}
              onClick={() => pushM.mutate()}
              className="cs-mono uppercase px-3 py-1.5 rounded disabled:opacity-40"
              style={{ background: "var(--nx-blue-glow)", border: "1px solid var(--nx-blue)", color: "var(--nx-blue)", fontSize: 10, letterSpacing: 1.5 }}
            >
              {pushM.isPending ? "…" : "Build & attest CKLB"}
            </button>
          </div>
          {pushM.data && (
            <pre className="cs-mono mt-3 p-2 rounded overflow-auto" style={{ background: "var(--nx-bg3)", border: "1px solid var(--nx-border)", color: "var(--nx-text2)", fontSize: 10, maxHeight: 240 }}>
              {JSON.stringify(pushM.data, null, 2)}
            </pre>
          )}
        </div>

        {/* Controls table */}
        {controlsRows.length > 0 && (
          <div className="mb-6">
            <div className="cs-mono uppercase mb-2" style={{ fontSize: 10, letterSpacing: 1.5, color: "var(--nx-text2)" }}>
              Controls · {slug}
            </div>
            <pre className="cs-mono p-3 rounded overflow-auto" style={{ background: "var(--nx-bg2)", border: "1px solid var(--nx-border)", color: "var(--nx-text2)", fontSize: 10, maxHeight: 360 }}>
              {JSON.stringify(controlsRows, null, 2)}
            </pre>
          </div>
        )}

        {/* Download preview */}
        {downloadM.data && (
          <div className="mb-6">
            <div className="cs-mono uppercase mb-2" style={{ fontSize: 10, letterSpacing: 1.5, color: "var(--nx-text2)" }}>
              Baseline preview · {downloadM.data.slug}.{downloadM.data.format} · {(downloadM.data.bytes / 1024).toFixed(1)} KB
            </div>
            <pre className="cs-mono p-3 rounded overflow-auto" style={{ background: "var(--nx-bg2)", border: "1px solid var(--nx-border)", color: "var(--nx-text2)", fontSize: 10, maxHeight: 320 }}>
              {downloadM.data.preview}
            </pre>
          </div>
        )}

        {/* Catalog */}
        <div>
          <div className="cs-mono uppercase mb-2" style={{ fontSize: 10, letterSpacing: 1.5, color: "var(--nx-text2)" }}>
            STIG catalog (page 1) · {catalogRows.length} entries
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {catalogRows.slice(0, 30).map((row, i) => {
              const rowSlug = (row.slug as string) ?? (row.id as string) ?? "";
              return (
                <button
                  key={i}
                  onClick={() => rowSlug && setSlug(rowSlug)}
                  className="cs-mono text-left px-2 py-2 rounded"
                  style={{ background: "var(--nx-bg2)", border: "1px solid var(--nx-border)", color: "var(--nx-text2)", fontSize: 10 }}
                >
                  <div style={{ color: "var(--nx-blue)" }}>{rowSlug}</div>
                  <div style={{ color: "var(--nx-muted)", fontSize: 9 }}>{(row.title as string) ?? ""}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ConsoleShell>
  );
}