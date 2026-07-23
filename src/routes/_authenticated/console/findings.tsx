import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { getMyTenant } from "@/lib/console/tenant.functions";
import { listFindings, adjudicateFinding } from "@/lib/console/findings.functions";

export const Route = createFileRoute("/_authenticated/console/findings")({
  head: () => ({ meta: [{ title: "Findings · KHEPRA Stargate" }, { name: "robots", content: "noindex" }] }),
  component: FindingsPage,
});

const sevClass: Record<string, string> = { CAT_I: "cs-b-cat1", CAT_II: "cs-b-cat2", CAT_III: "cs-b-cat3" };

function FindingsPage() {
  const fetchTenant = useServerFn(getMyTenant);
  const fetchFindings = useServerFn(listFindings);
  const adjudicate = useServerFn(adjudicateFinding);
  const qc = useQueryClient();

  const tenantQ = useQuery({ queryKey: ["tenant"], queryFn: () => fetchTenant() });
  const findingsQ = useQuery({ queryKey: ["findings"], queryFn: () => fetchFindings() });
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const rows = findingsQ.data ?? [];
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((f) => f.label.toLowerCase().includes(q) || f.severity.toLowerCase().includes(q) || f.status.toLowerCase().includes(q));
  }, [findingsQ.data, search]);

  const selected = filtered.find((f) => f.id === selectedId) ?? filtered[0] ?? null;

  async function act(status: "adjudicated" | "dismissed") {
    if (!selected) return;
    await adjudicate({ data: { id: selected.id, status } });
    await qc.invalidateQueries({ queryKey: ["findings"] });
  }

  return (
    <ConsoleShell
      tenant={tenantQ.data ? { name: tenantQ.data.name, classification: tenantQ.data.classification, role: tenantQ.data.role } : null}
      leftPanel={
        selected ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <span className={`cs-badge ${sevClass[selected.severity] ?? "cs-b-cat1"}`}>{selected.severity}</span>
              <span className="cs-badge cs-b-tool">{selected.status.toUpperCase()}</span>
            </div>
            <div className="cs-mono text-[13px]" style={{ color: "var(--nx-text)" }}>{selected.label}</div>
            {selected.impact_usd != null && (
              <div>
                <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>Impact</div>
                <div className="text-[22px] font-bold" style={{ color: "var(--ak-gold)" }}>${Number(selected.impact_usd).toLocaleString()}</div>
              </div>
            )}
            {selected.roi_text && (
              <div>
                <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>ROI</div>
                <div className="cs-mono text-[14px]" style={{ color: "var(--cat3)" }}>{selected.roi_text}</div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => act("adjudicated")} className="flex-1 cs-mono text-[10px] py-2 rounded"
                      style={{ background: "var(--cat3)", color: "#050c16", fontWeight: 700, letterSpacing: 1 }}>ADJUDICATE</button>
              <button onClick={() => act("dismissed")} className="flex-1 cs-mono text-[10px] py-2 rounded"
                      style={{ background: "var(--nx-bg3)", color: "var(--nx-text2)", border: "1px solid var(--nx-border2)", letterSpacing: 1 }}>DISMISS</button>
            </div>
          </div>
        ) : <div className="cs-mono text-[11px]" style={{ color: "var(--nx-text2)" }}>no findings</div>
      }
      searchValue={search} onSearchChange={setSearch} searchPlaceholder="filter by severity, status, label…"
    >
      <div className="p-6 overflow-auto h-full">
        <div className="grid gap-2">
          {filtered.map((f) => (
            <button key={f.id} onClick={() => setSelectedId(f.id)}
              className="text-left rounded-md px-4 py-3 flex items-center justify-between"
              style={{
                background: (selected?.id === f.id) ? "var(--nx-bg3)" : "var(--nx-bg2)",
                border: `1px solid ${selected?.id === f.id ? "var(--nx-blue)" : "var(--nx-border)"}`,
              }}>
              <div className="flex items-center gap-3">
                <span className={`cs-badge ${sevClass[f.severity] ?? "cs-b-cat1"}`}>{f.severity}</span>
                <div className="cs-mono" style={{ fontSize: 12, color: "var(--nx-text)" }}>{f.label}</div>
              </div>
              <div className="flex items-center gap-3">
                {f.impact_usd != null && (
                  <div className="cs-mono" style={{ fontSize: 12, color: "var(--ak-gold)" }}>${Number(f.impact_usd).toLocaleString()}</div>
                )}
                <span className="cs-badge cs-b-tool">{f.status.toUpperCase()}</span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="cs-mono text-center py-10" style={{ fontSize: 11, color: "var(--nx-text2)" }}>no findings</div>
          )}
        </div>
      </div>
    </ConsoleShell>
  );
}