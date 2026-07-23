import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { getMyTenant } from "@/lib/console/tenant.functions";
import { listControls } from "@/lib/console/controls.functions";

export const Route = createFileRoute("/_authenticated/console/controls")({
  head: () => ({ meta: [{ title: "Controls · KHEPRA Stargate" }, { name: "robots", content: "noindex" }] }),
  component: ControlsPage,
});

function ControlsPage() {
  const fetchTenant = useServerFn(getMyTenant);
  const fetchControls = useServerFn(listControls);
  const tenantQ = useQuery({ queryKey: ["tenant"], queryFn: () => fetchTenant() });
  const controlsQ = useQuery({ queryKey: ["controls"], queryFn: () => fetchControls() });
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const rows = controlsQ.data ?? [];
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((c) => c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.framework.toLowerCase().includes(q));
  }, [controlsQ.data, search]);
  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  return (
    <ConsoleShell
      tenant={tenantQ.data ? { name: tenantQ.data.name, classification: tenantQ.data.classification, role: tenantQ.data.role } : null}
      leftPanel={
        selected ? (
          <div className="space-y-3">
            <span className="cs-badge cs-b-control">{selected.framework}</span>
            <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>Control</div>
            <div className="cs-mono text-[14px]" style={{ color: "var(--sb-cyan)" }}>{selected.code}</div>
            <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>Title</div>
            <div className="text-[12px]" style={{ color: "var(--nx-text)" }}>{selected.title}</div>
            {selected.description && (
              <>
                <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>Description</div>
                <div className="text-[11px] leading-relaxed" style={{ color: "var(--nx-text)" }}>{selected.description}</div>
              </>
            )}
          </div>
        ) : <div className="cs-mono text-[11px]" style={{ color: "var(--nx-text2)" }}>no controls</div>
      }
      searchValue={search} onSearchChange={setSearch} searchPlaceholder="filter controls by code, title, framework…"
    >
      <div className="p-6 overflow-auto h-full">
        <div className="grid gap-2">
          {filtered.map((c) => (
            <button key={c.id} onClick={() => setSelectedId(c.id)}
              className="text-left rounded-md px-4 py-3 flex items-center justify-between"
              style={{
                background: (selected?.id === c.id) ? "var(--nx-bg3)" : "var(--nx-bg2)",
                border: `1px solid ${selected?.id === c.id ? "var(--nx-blue)" : "var(--nx-border)"}`,
              }}>
              <div className="flex items-center gap-3">
                <span className="cs-badge cs-b-control">{c.framework}</span>
                <div className="cs-mono" style={{ fontSize: 12, color: "var(--sb-cyan)" }}>{c.code}</div>
                <div className="text-[12px]" style={{ color: "var(--nx-text)" }}>{c.title}</div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="cs-mono text-center py-10" style={{ fontSize: 11, color: "var(--nx-text2)" }}>no controls</div>
          )}
        </div>
      </div>
    </ConsoleShell>
  );
}