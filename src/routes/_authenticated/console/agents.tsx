import { createFileRoute, useServerFn } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { getMyTenant } from "@/lib/console/tenant.functions";
import { listAgents } from "@/lib/console/agents.functions";

export const Route = createFileRoute("/_authenticated/console/agents")({
  head: () => ({ meta: [{ title: "Agents · KHEPRA Stargate" }, { name: "robots", content: "noindex" }] }),
  component: AgentsPage,
});

function AgentsPage() {
  const fetchTenant = useServerFn(getMyTenant);
  const fetchAgents = useServerFn(listAgents);
  const tenantQ = useQuery({ queryKey: ["tenant"], queryFn: () => fetchTenant() });
  const agentsQ = useQuery({ queryKey: ["agents"], queryFn: () => fetchAgents() });
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const rows = agentsQ.data ?? [];
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((a) => a.display_name.toLowerCase().includes(q) || a.did.toLowerCase().includes(q) || a.class.toLowerCase().includes(q));
  }, [agentsQ.data, search]);

  const selected = filtered.find((a) => a.id === selectedId) ?? filtered[0] ?? null;

  return (
    <ConsoleShell
      tenant={tenantQ.data ? { name: tenantQ.data.name, classification: tenantQ.data.classification, role: tenantQ.data.role } : null}
      leftPanel={
        selected ? (
          <div className="space-y-3">
            <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>Agent</div>
            <div className="cs-mono text-[13px]" style={{ color: "var(--nx-text)" }}>{selected.display_name}</div>
            <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>DID</div>
            <div className="cs-mono text-[10px] break-all" style={{ color: "var(--sb-cyan)" }}>{selected.did}</div>
            <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>Class</div>
            <div className="cs-mono text-[11px]" style={{ color: "var(--ak-gold)" }}>{selected.class}</div>
            <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>Trust score</div>
            <div className="text-[24px] font-bold" style={{ color: (selected.trust_score ?? 0) > 0.75 ? "var(--cat3)" : "var(--ak-gold)" }}>
              {(selected.trust_score ?? 0).toFixed(3)}
            </div>
            <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>Capabilities</div>
            <div className="flex flex-wrap gap-1">
              {(selected.capabilities as unknown as string[] | null)?.map((c) => (
                <span key={c} className="cs-badge cs-b-attest">{c}</span>
              ))}
            </div>
          </div>
        ) : <div className="cs-mono text-[11px]" style={{ color: "var(--nx-text2)" }}>no agents yet</div>
      }
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="filter agents by name, DID, class…"
    >
      <div className="p-6 overflow-auto h-full">
        <div className="grid gap-2">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              className="text-left rounded-md px-4 py-3 flex items-center justify-between transition-colors"
              style={{
                background: (selected?.id === a.id) ? "var(--nx-bg3)" : "var(--nx-bg2)",
                border: `1px solid ${selected?.id === a.id ? "var(--nx-blue)" : "var(--nx-border)"}`,
              }}
            >
              <div>
                <div className="cs-mono" style={{ fontSize: 13, color: "var(--nx-text)" }}>{a.display_name}</div>
                <div className="cs-mono" style={{ fontSize: 9, color: "var(--nx-text2)", letterSpacing: 1 }}>{a.did}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="cs-badge cs-b-tool">{a.class}</span>
                <div className="cs-mono" style={{ fontSize: 14, color: (a.trust_score ?? 0) > 0.75 ? "var(--cat3)" : "var(--ak-gold)" }}>
                  {(a.trust_score ?? 0).toFixed(2)}
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="cs-mono text-center py-10" style={{ fontSize: 11, color: "var(--nx-text2)" }}>no agents registered</div>
          )}
        </div>
      </div>
    </ConsoleShell>
  );
}