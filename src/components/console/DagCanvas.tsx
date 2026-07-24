import type { DagPayload, DagNode } from "@/lib/console/types";

const COLORS: Record<string, string> = {
  prompt: "#818cf8",
  tool: "#e5a54b",
  control: "#22c55e",
  attest: "#06b6d4",
  finding_CAT_I: "#cc2a36",
  finding_CAT_II: "#f97316",
  finding_CAT_III: "#22c55e",
  finding: "#cc2a36",
  default: "#3d5a78",
};

function nodeColor(n: DagNode) {
  if (n.type === "finding") return COLORS[`finding_${n.severity ?? "CAT_I"}`] ?? COLORS.finding;
  return COLORS[n.type] ?? COLORS.default;
}

function nodePosition(index: number, total: number) {
  const safeTotal = Math.max(total, 1);
  const ring = Math.floor(index / 12);
  const ringIndex = index % 12;
  const ringSize = Math.min(12, safeTotal - ring * 12);
  const angle = (ringIndex / Math.max(ringSize, 1)) * Math.PI * 2 - Math.PI / 2;
  const radiusX = 240 + ring * 46;
  const radiusY = 135 + ring * 30;
  return {
    x: 420 + Math.cos(angle) * radiusX,
    y: 240 + Math.sin(angle) * radiusY,
  };
}

function linkEndpoint(value: string | number | { id?: string | number }) {
  if (typeof value === "object" && value !== null && "id" in value) return String(value.id);
  return String(value);
}

export function DagCanvas({
  payload,
  onSelect,
}: {
  payload: DagPayload;
  onSelect: (n: DagNode | null) => void;
}) {
  const positioned = payload.nodes.map((node, index) => ({
    ...node,
    ...nodePosition(index, payload.nodes.length),
  }));
  const byId = new Map(positioned.map((node) => [node.id, node]));

  return (
    <button
      type="button"
      className="relative block h-full w-full cursor-crosshair overflow-hidden text-left"
      aria-label="Clear selected evidence node"
      onClick={() => onSelect(null)}
    >
      <svg viewBox="0 0 840 480" className="h-full w-full" role="img" aria-label="Evidence DAG">
        <rect width="840" height="480" fill="#050c16" />
        <g opacity="0.13">
          {Array.from({ length: 21 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * 42}
              x2={i * 42}
              y1="0"
              y2="480"
              stroke="#6b8aaa"
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 13 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              x2="840"
              y1={i * 40}
              y2={i * 40}
              stroke="#6b8aaa"
              strokeWidth="0.5"
            />
          ))}
        </g>
        <g>
          {payload.links.map((link, index) => {
            const source = byId.get(linkEndpoint(link.source));
            const target = byId.get(linkEndpoint(link.target));
            if (!source || !target) return null;
            return (
              <line
                key={`${linkEndpoint(link.source)}-${linkEndpoint(link.target)}-${index}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="rgba(26,159,232,0.35)"
                strokeWidth={Math.max(0.8, (link.w ?? 1) * 0.7)}
              />
            );
          })}
        </g>
        <g>
          {positioned.map((node) => {
            const color = nodeColor(node);
            return (
              <g key={node.id}>
                <circle cx={node.x} cy={node.y} r="20" fill={color} opacity="0.16" />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="10"
                  fill="#07111f"
                  stroke={color}
                  strokeWidth="2"
                />
                <circle cx={node.x} cy={node.y} r="3" fill={color} />
                <text
                  x={node.x}
                  y={node.y + 29}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9"
                  fill="#d7e4ef"
                >
                  {node.label.length > 18 ? `${node.label.slice(0, 17)}…` : node.label}
                </text>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="22"
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(node);
                  }}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </button>
  );
}
