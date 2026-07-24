import { useEffect, useRef } from "react";
import type { DagPayload, DagNode } from "@/lib/console/types";

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
  ));
}

const COLORS: Record<string, string> = {
  prompt: "#818cf8", tool: "#e5a54b", control: "#22c55e", attest: "#06b6d4",
  finding_CAT_I: "#cc2a36", finding_CAT_II: "#f97316", finding_CAT_III: "#22c55e",
  finding: "#cc2a36", default: "#3d5a78",
};
function nodeColor(n: DagNode) {
  if (n.type === "finding") return COLORS["finding_" + (n.severity ?? "CAT_I")] ?? COLORS.finding;
  return COLORS[n.type] ?? COLORS.default;
}

export function DagCanvas({ payload, onSelect }: { payload: DagPayload; onSelect: (n: DagNode | null) => void }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<ReturnType<typeof buildGraph> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod = await import("3d-force-graph");
      // The package's default export is the constructor.
      const ForceGraph3D = (mod.default ?? (mod as unknown as { default: unknown })) as unknown as () => ReturnType<typeof buildGraph>;
      if (cancelled || !hostRef.current) return;
      const g = (ForceGraph3D as unknown as (opts?: unknown) => { (el: HTMLElement): unknown })()(hostRef.current) as ReturnType<typeof buildGraph>;
      graphRef.current = g;
      g
        .backgroundColor("#050c16")
        .nodeLabel((n: DagNode) => {
          const color = nodeColor(n);
          const label = escapeHtml(n.label ?? "");
          const type = escapeHtml((n.type ?? "").toUpperCase());
          const sev = n.severity ? " · " + escapeHtml(n.severity) : "";
          return `<div style="font-family:'JetBrains Mono',monospace;color:${color};padding:4px 8px;border-left:2px solid ${color};background:rgba(5,12,22,.9)"><b>${label}</b><br/><span style="color:#6b8aaa;font-size:9px">${type}${sev}</span></div>`;
        })
        .nodeColor((n: DagNode) => nodeColor(n))
        .nodeVal((n: DagNode) => n.val)
        .nodeOpacity(0.95)
        .linkColor(() => "rgba(26,159,232,0.35)")
        .linkWidth((l: { w?: number }) => (l.w ?? 1) * 0.6)
        .linkDirectionalParticles(1)
        .linkDirectionalParticleColor(() => "#1a9fe8")
        .linkDirectionalParticleWidth(2)
        .onNodeClick((n: DagNode) => onSelect(n))
        .onBackgroundClick(() => onSelect(null))
        .graphData({ nodes: payload.nodes, links: payload.links });
    })();
    return () => {
      cancelled = true;
      try { graphRef.current?._destructor?.(); } catch { /* noop */ }
      graphRef.current = null;
    };
  }, [payload, onSelect]);

  return <div ref={hostRef} className="w-full h-full" />;
}

// Type helper for the imported graph instance
function buildGraph(): {
  backgroundColor: (v: string) => ReturnType<typeof buildGraph>;
  nodeLabel: (fn: (n: DagNode) => string) => ReturnType<typeof buildGraph>;
  nodeColor: (fn: (n: DagNode) => string) => ReturnType<typeof buildGraph>;
  nodeVal: (fn: (n: DagNode) => number) => ReturnType<typeof buildGraph>;
  nodeOpacity: (v: number) => ReturnType<typeof buildGraph>;
  linkColor: (fn: () => string) => ReturnType<typeof buildGraph>;
  linkWidth: (fn: (l: { w?: number }) => number) => ReturnType<typeof buildGraph>;
  linkDirectionalParticles: (v: number) => ReturnType<typeof buildGraph>;
  linkDirectionalParticleColor: (fn: () => string) => ReturnType<typeof buildGraph>;
  linkDirectionalParticleWidth: (v: number) => ReturnType<typeof buildGraph>;
  onNodeClick: (fn: (n: DagNode) => void) => ReturnType<typeof buildGraph>;
  onBackgroundClick: (fn: () => void) => ReturnType<typeof buildGraph>;
  graphData: (d: { nodes: DagNode[]; links: DagPayload["links"] }) => ReturnType<typeof buildGraph>;
  _destructor?: () => void;
} {
  throw new Error("type-only helper");
}