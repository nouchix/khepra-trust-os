import { useEffect, useRef, useState } from "react";

// Deterministic node positions so SSR and hydration match.
const NODES = [
  { id: "id", x: 90, y: 220, label: "Identity", kind: "root" },
  { id: "pol", x: 240, y: 120, label: "Policy", kind: "control" },
  { id: "run", x: 240, y: 320, label: "Runtime", kind: "control" },
  { id: "conn", x: 400, y: 60, label: "Connector", kind: "edge" },
  { id: "agent", x: 400, y: 200, label: "Agent", kind: "actor" },
  { id: "tool", x: 400, y: 340, label: "Tool", kind: "edge" },
  { id: "prov", x: 560, y: 140, label: "Provenance", kind: "control" },
  { id: "dag", x: 560, y: 300, label: "DAG", kind: "ledger" },
  { id: "att", x: 720, y: 220, label: "Attestation", kind: "ledger" },
] as const;

const EDGES: Array<[string, string]> = [
  ["id", "pol"], ["id", "run"],
  ["pol", "conn"], ["pol", "agent"], ["run", "agent"], ["run", "tool"],
  ["conn", "prov"], ["agent", "prov"], ["agent", "dag"], ["tool", "dag"],
  ["prov", "att"], ["dag", "att"],
];

const kindColor: Record<string, string> = {
  root: "var(--color-primary)",
  control: "oklch(0.7 0.14 200)",
  edge: "oklch(0.72 0.12 60)",
  actor: "var(--color-primary)",
  ledger: "oklch(0.88 0.18 82)",
};

export function TrustGraph({ className = "" }: { className?: string }) {
  const [tick, setTick] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((t) => (t + 1) % EDGES.length), 900);
    return () => window.clearInterval(id);
  }, [active]);

  const nodeById = Object.fromEntries(NODES.map((n) => [n.id, n]));

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      <svg viewBox="0 0 810 400" className="w-full h-auto" role="img" aria-label="Trust attestation graph">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="edge" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.05" />
            <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* grid */}
        <g opacity="0.15">
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 45} x2={i * 45} y1={0} y2={400} stroke="oklch(1 0 0)" strokeWidth="0.3" />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`h${i}`} y1={i * 45} y2={i * 45} x1={0} x2={810} stroke="oklch(1 0 0)" strokeWidth="0.3" />
          ))}
        </g>

        {/* edges */}
        {EDGES.map(([a, b], i) => {
          const A = nodeById[a]!;
          const B = nodeById[b]!;
          const isActive = i === tick;
          return (
            <g key={`${a}-${b}`}>
              <line
                x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                stroke={isActive ? "var(--color-primary)" : "oklch(1 0 0 / 0.14)"}
                strokeWidth={isActive ? 1.6 : 1}
                style={{ transition: "stroke 0.6s ease, stroke-width 0.6s ease" }}
              />
              {isActive && (
                <circle r="3.5" fill="var(--color-primary)">
                  <animate attributeName="cx" from={A.x} to={B.x} dur="0.9s" fill="freeze" />
                  <animate attributeName="cy" from={A.y} to={B.y} dur="0.9s" fill="freeze" />
                  <animate attributeName="opacity" values="0;1;0" dur="0.9s" fill="freeze" />
                </circle>
              )}
            </g>
          );
        })}

        {/* nodes */}
        {NODES.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r="26" fill="url(#glow)" opacity="0.6" />
            <circle
              cx={n.x} cy={n.y} r="10"
              fill="oklch(0.14 0.02 250)"
              stroke={kindColor[n.kind]}
              strokeWidth="1.5"
            />
            <circle cx={n.x} cy={n.y} r="3" fill={kindColor[n.kind]} />
            <text
              x={n.x} y={n.y + 26}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="10"
              fill="oklch(0.85 0.01 90)"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}