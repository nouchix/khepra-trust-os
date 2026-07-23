import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { getMyTenant } from "@/lib/console/tenant.functions";
import { listRulepacks } from "@/lib/console/rulepacks.functions";

export const Route = createFileRoute("/_authenticated/console/rulepacks")({
  head: () => ({ meta: [{ title: "Rulepacks · KHEPRA Stargate" }, { name: "robots", content: "noindex" }] }),
  component: RulepacksPage,
});

function RulepacksPage() {
  const fetchTenant = useServerFn(getMyTenant);
  const fetchPacks = useServerFn(listRulepacks);
  const tenantQ = useQuery({ queryKey: ["tenant"], queryFn: () => fetchTenant() });
  const packsQ = useQuery({ queryKey: ["rulepacks"], queryFn: () => fetchPacks() });
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const rows = packsQ.data ?? [];
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => `gen-${r.generation}`.includes(q));
  }, [packsQ.data, search]);
  const selected = filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null;

  return (
    <ConsoleShell
      tenant={tenantQ.data ? { name: tenantQ.data.name, classification: tenantQ.data.classification, role: tenantQ.data.role } : null}
      leftPanel={
        selected ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <span className="cs-badge cs-b-tool">GEN {selected.generation}</span>
              {selected.active && <span className="cs-badge cs-b-control">ACTIVE</span>}
            </div>
            <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>Parent lineage</div>
            <div className="cs-mono text-[11px]" style={{ color: "var(--sb-cyan)" }}>{selected.parent_id ?? "genesis"}</div>
            <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>Weights</div>
            <pre className="cs-mono text-[10px] p-2 rounded overflow-auto"
                 style={{ color: "var(--nx-text)", background: "var(--nx-bg3)", border: "1px solid var(--nx-border)" }}>
{JSON.stringify(selected.weights, null, 2)}
            </pre>
            <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>Metrics</div>
            <pre className="cs-mono text-[10px] p-2 rounded overflow-auto"
                 style={{ color: "var(--ak-gold)", background: "var(--nx-bg3)", border: "1px solid var(--nx-border)" }}>
{JSON.stringify(selected.metrics, null, 2)}
            </pre>
          </div>
        ) : <div className="cs-mono text-[11px]" style={{ color: "var(--nx-text2)" }}>no rulepacks</div>
      }
      searchValue={search} onSearchChange={setSearch} searchPlaceholder="filter by generation…"
    >
      <div className="p-6 overflow-auto h-full">
        <div className="flex items-center gap-4 flex-wrap">
          {filtered.map((r, i) => (
            <div key={r.id} className="flex items-center gap-4">
              <button onClick={() => setSelectedId(r.id)}
                className="text-left rounded-md px-4 py-3 w-[220px]"
                style={{
                  background: (selected?.id === r.id) ? "var(--nx-bg3)" : "var(--nx-bg2)",
                  border: `1px solid ${selected?.id === r.id ? "var(--nx-blue)" : (r.active ? "var(--cat3)" : "var(--nx-border)")}`,
                }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="cs-badge cs-b-tool">GEN {r.generation}</span>
                  {r.active && <span className="cs-badge cs-b-control">ACTIVE</span>}
                </div>
                <div className="cs-mono text-[10px]" style={{ color: "var(--nx-text2)" }}>
                  fitness · {String(((r.metrics as Record<string, unknown> | null)?.fitness ?? "—"))}
                </div>
                <div className="cs-mono text-[10px]" style={{ color: "var(--nx-text2)" }}>
                  fp-rate · {String(((r.metrics as Record<string, unknown> | null)?.false_positive_rate ?? "—"))}
                </div>
              </button>
              {i < filtered.length - 1 && <span style={{ color: "var(--nx-border2)" }}>→</span>}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="cs-mono text-center py-10 w-full" style={{ fontSize: 11, color: "var(--nx-text2)" }}>no rulepacks</div>
          )}
        </div>
      </div>
    </ConsoleShell>
  );
}