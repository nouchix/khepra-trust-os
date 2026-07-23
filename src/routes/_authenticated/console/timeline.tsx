import { createFileRoute, useServerFn } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { DagCanvas } from "@/components/console/DagCanvas";
import { LeftDetailPanel } from "@/components/console/LeftDetailPanel";
import { getMyTenant } from "@/lib/console/tenant.functions";
import { listSessions, getSessionDag } from "@/lib/console/aeos.functions";
import type { DagNode } from "@/lib/console/types";

export const Route = createFileRoute("/_authenticated/console/timeline")({
  head: () => ({ meta: [{ title: "Timeline · KHEPRA Stargate" }, { name: "robots", content: "noindex" }] }),
  component: TimelinePage,
});

function TimelinePage() {
  const fetchTenant = useServerFn(getMyTenant);
  const fetchSessions = useServerFn(listSessions);
  const fetchDag = useServerFn(getSessionDag);

  const tenantQ = useQuery({ queryKey: ["tenant"], queryFn: () => fetchTenant() });
  const sessionsQ = useQuery({ queryKey: ["sessions"], queryFn: () => fetchSessions() });
  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => {
    if (!sessionId && sessionsQ.data && sessionsQ.data.length > 0) setSessionId(sessionsQ.data[0].id);
  }, [sessionsQ.data, sessionId]);

  const dagQ = useQuery({
    queryKey: ["dag", sessionId],
    queryFn: () => fetchDag({ data: { sessionId: sessionId! } }),
    enabled: !!sessionId,
  });

  const [selected, setSelected] = useState<DagNode | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!dagQ.data) return null;
    if (!search.trim()) return dagQ.data;
    const q = search.toLowerCase();
    const nodes = dagQ.data.nodes.filter((n) => n.label.toLowerCase().includes(q) || n.type.includes(q));
    const ids = new Set(nodes.map((n) => n.id));
    return { ...dagQ.data, nodes, links: dagQ.data.links.filter((l) => ids.has(String(l.source)) && ids.has(String(l.target))) };
  }, [dagQ.data, search]);

  return (
    <ConsoleShell
      tenant={tenantQ.data ? { name: tenantQ.data.name, classification: tenantQ.data.classification, role: tenantQ.data.role } : null}
      sessionRef={dagQ.data?.meta.session_ref}
      stats={{ tools: dagQ.data?.meta.tool_calls, findings: dagQ.data?.meta.findings, sigs: dagQ.data?.meta.attestations }}
      leftPanel={<LeftDetailPanel node={selected} />}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="filter nodes by label or type…"
    >
      {/* Session picker */}
      <div className="absolute top-3 left-3 z-10 flex gap-1.5">
        {sessionsQ.data?.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSessionId(s.id); setSelected(null); }}
            className="cs-mono uppercase"
            style={{
              fontSize: 9, letterSpacing: 1, padding: "5px 10px", borderRadius: 3,
              background: sessionId === s.id ? "var(--nx-blue-glow)" : "var(--nx-bg3)",
              border: `1px solid ${sessionId === s.id ? "var(--nx-blue)" : "var(--nx-border)"}`,
              color: sessionId === s.id ? "var(--nx-blue)" : "var(--nx-text2)",
            }}
          >
            {s.session_ref}
          </button>
        ))}
      </div>

      <div className="w-full h-full">
        {filtered ? (
          <DagCanvas payload={filtered} onSelect={setSelected} />
        ) : (
          <div className="w-full h-full flex items-center justify-center cs-mono" style={{ color: "var(--nx-text2)", fontSize: 12 }}>
            {dagQ.isLoading ? "loading evidence fabric…" : "select a session"}
          </div>
        )}
      </div>
    </ConsoleShell>
  );
}