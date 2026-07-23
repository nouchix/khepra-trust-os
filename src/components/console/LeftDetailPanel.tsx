import type { DagNode } from "@/lib/console/types";

const typeToBadge: Record<string, string> = {
  prompt: "cs-b-prompt", tool: "cs-b-tool", finding: "cs-b-finding",
  control: "cs-b-control", attest: "cs-b-attest",
};
const sevToBadge: Record<string, string> = { CAT_I: "cs-b-cat1", CAT_II: "cs-b-cat2", CAT_III: "cs-b-cat3" };

function fmtTime(iso: string) {
  try { return new Date(iso).toISOString().slice(11, 19) + "Z"; } catch { return iso; }
}
function fmtMoney(v: unknown): string | null {
  if (typeof v !== "number") return null;
  return "$" + v.toLocaleString();
}

export function LeftDetailPanel({ node }: { node: DagNode | null }) {
  if (!node) {
    return (
      <div className="cs-mono text-[11px] leading-[1.8]" style={{ color: "var(--nx-text2)" }}>
        <div>Click a node in the graph.</div>
        <div className="mt-2">
          <span style={{ color: "var(--sb-cyan)" }}>&gt;</span> Prompt · Tool · Finding
        </div>
        <div>
          <span style={{ color: "var(--ak-gold)" }}>&gt;</span> Control · Attestation
        </div>
      </div>
    );
  }
  const b = typeToBadge[node.type] ?? "cs-b-tool";
  const sev = node.severity ? sevToBadge[node.severity] : null;
  const impact = node.payload && typeof node.payload === "object" ? fmtMoney((node.payload as Record<string, unknown>).impact) : null;
  const rem = node.payload && typeof node.payload === "object" ? fmtMoney((node.payload as Record<string, unknown>).remediation) : null;
  const roi = node.payload && typeof node.payload === "object" ? (node.payload as Record<string, unknown>).roi as string | undefined : undefined;
  const framework = node.payload && typeof node.payload === "object" ? (node.payload as Record<string, unknown>).framework as string | undefined : undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={`cs-badge ${b}`}>{node.type.toUpperCase()}</span>
        {sev && <span className={`cs-badge ${sev}`}>{node.severity}</span>}
      </div>
      <div>
        <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>Label</div>
        <div className="cs-mono text-[13px] mt-1" style={{ color: "var(--nx-text)" }}>{node.label}</div>
      </div>
      <div>
        <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>Timestamp</div>
        <div className="cs-mono text-[12px] mt-1" style={{ color: "var(--nx-text)" }}>{fmtTime(node.ts)}</div>
      </div>
      {node.description && (
        <div>
          <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>Description</div>
          <div className="text-[12px] mt-1 leading-[1.5]" style={{ color: "var(--nx-text)" }}>{node.description}</div>
        </div>
      )}
      {framework && (
        <div>
          <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>Framework</div>
          <div className="cs-mono text-[12px] mt-1" style={{ color: "var(--sb-cyan)" }}>{framework}</div>
        </div>
      )}
      {(impact || rem || roi) && (
        <div className="grid grid-cols-3 gap-2">
          {impact && (
            <div>
              <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>Impact</div>
              <div className="text-[18px] font-bold mt-1" style={{ color: "var(--ak-gold)" }}>{impact}</div>
            </div>
          )}
          {rem && (
            <div>
              <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>Remediation</div>
              <div className="cs-mono text-[13px] mt-1" style={{ color: "var(--nx-text)" }}>{rem}</div>
            </div>
          )}
          {roi && (
            <div>
              <div className="cs-mono text-[8px] tracking-[2px] uppercase" style={{ color: "var(--nx-text2)" }}>ROI</div>
              <div className="cs-mono text-[14px] font-semibold mt-1" style={{ color: "var(--cat3)" }}>{roi}</div>
            </div>
          )}
        </div>
      )}
      {node.sig && (
        <div>
          <div className="cs-mono text-[8px] tracking-[2px] uppercase mb-1" style={{ color: "var(--nx-text2)" }}>Signature · {node.sig.alg}</div>
          <div
            className="cs-mono text-[9px] p-2 rounded break-all leading-[1.6]"
            style={{ color: "var(--sb-cyan)", background: "var(--sb-cyan-glow)", border: "1px solid rgba(6,182,212,.25)" }}
          >
            {node.sig.value}
          </div>
        </div>
      )}
    </div>
  );
}