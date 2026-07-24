import { useEffect, useRef, useState } from "react";
import { buildScenario, type FabricLink, type FabricNode, type Scenario } from "@/lib/fabric-demo";

const KIND_COLOR: Record<FabricNode["kind"], string> = {
  agent: "#1a9fe8",
  aeo: "#e5a54b",
  anchor: "#06b6d4",
  replay: "#818cf8",
  trust: "#22c55e",
  passport: "#e5a54b",
  ok: "#22c55e",
  drift: "#cc2a36",
};

const STEP_MS = 1150;

export function FabricConsole() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  async function run() {
    if (running) return;
    setError(null);
    setRunning(true);
    setRevealed(0);
    try {
      const s = scenario ?? (await buildScenario());
      setScenario(s);
      setRevealed(1);
      let i = 1;
      timer.current = setInterval(() => {
        i += 1;
        if (i > s.steps.length) {
          if (timer.current) clearInterval(timer.current);
          setRunning(false);
          return;
        }
        setRevealed(i);
      }, STEP_MS);
    } catch (e) {
      setError(e instanceof Error ? e.message : "demo failed to start");
      setRunning(false);
    }
  }

  function reset() {
    if (timer.current) clearInterval(timer.current);
    setRunning(false);
    setRevealed(0);
  }

  const steps = scenario?.steps ?? [];
  const shown = steps.slice(0, revealed);
  const nodes: FabricNode[] = shown.flatMap((s) => s.nodes);
  const nodeIds = new Set(nodes.map((n) => n.id));
  const links: FabricLink[] = shown.flatMap((s) => s.links).filter((l) => nodeIds.has(l.from) && nodeIds.has(l.to));
  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const current = revealed > 0 ? steps[revealed - 1] : null;
  const log = shown.flatMap((s) => s.log);
  const trust = [...shown].reverse().find((s) => s.trust != null)?.trust ?? null;

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [revealed]);

  return (
    <div className="fx-console rounded-xl border border-[#1a9fe82e] bg-[#050c16] text-[#e0eaf5] overflow-hidden">
      <style>{`
        @keyframes fxpop { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
        @keyframes fxdraw { from { stroke-dashoffset: 240; } to { stroke-dashoffset: 0; } }
        .fx-node { animation: fxpop .5s ease both; }
        .fx-edge { stroke-dasharray: 240; animation: fxdraw .7s ease both; }
        .fx-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
      `}</style>

      {/* header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a9fe81f] bg-[#0a1522]">
        <div className="flex items-center gap-2.5">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-70 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
          </span>
          <span className="fx-mono text-[11px] tracking-[2px] text-[#7fb4d8] uppercase">KHEPRA · Trust Fabric</span>
        </div>
        <span className="fx-mono text-[10px] tracking-[1.5px] text-[#3d5a78] uppercase hidden sm:inline">
          {scenario?.algorithm ?? "ML-DSA-65 · content-addressed"}
        </span>
      </div>

      <div className="grid lg:grid-cols-[1.55fr_1fr]">
        {/* graph canvas */}
        <div className="relative border-b lg:border-b-0 lg:border-r border-[#1a9fe81f] p-3">
          <svg viewBox="0 0 1020 470" className="w-full h-auto" role="img" aria-label="KHEPRA Trust Fabric evidence DAG">
            <defs>
              <radialGradient id="fxglow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1a9fe8" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#1a9fe8" stopOpacity="0" />
              </radialGradient>
            </defs>

            <g opacity="0.12">
              {Array.from({ length: 23 }).map((_, i) => (
                <line key={`v${i}`} x1={i * 45} x2={i * 45} y1={0} y2={470} stroke="#1a9fe8" strokeWidth="0.4" />
              ))}
              {Array.from({ length: 11 }).map((_, i) => (
                <line key={`h${i}`} y1={i * 45} y2={i * 45} x1={0} x2={1020} stroke="#1a9fe8" strokeWidth="0.4" />
              ))}
            </g>

            {links.map((l, i) => {
              const a = nodeById[l.from];
              const b = nodeById[l.to];
              if (!a || !b) return null;
              return (
                <line
                  key={`${l.from}-${l.to}-${i}`}
                  className="fx-edge"
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={l.mirror ? "#cc2a3688" : "#1a9fe866"}
                  strokeWidth={1.2}
                  strokeDasharray={l.mirror ? "4 3" : undefined}
                />
              );
            })}

            {nodes.map((n) => {
              const c = KIND_COLOR[n.kind];
              const wide = n.kind === "ok" || n.kind === "drift" || n.kind === "replay" || n.kind === "trust" || n.kind === "passport";
              return (
                <g key={n.id} className="fx-node" style={{ transformOrigin: `${n.x}px ${n.y}px` }}>
                  <circle cx={n.x} cy={n.y} r="30" fill="url(#fxglow)" opacity="0.5" />
                  {wide ? (
                    <rect x={n.x - 58} y={n.y - 15} width="116" height="30" rx="6" fill="#0a1522" stroke={c} strokeWidth="1.4" />
                  ) : (
                    <circle cx={n.x} cy={n.y} r="11" fill="#0a1522" stroke={c} strokeWidth="1.6" />
                  )}
                  {!wide && <circle cx={n.x} cy={n.y} r="3.5" fill={c} />}
                  <text x={n.x} y={wide ? n.y + 4 : n.y + 27} textAnchor="middle" className="fx-mono" fontSize={wide ? 11 : 10} fontWeight={wide ? 700 : 400} fill={wide ? c : "#c7d6e6"}>
                    {n.label}
                  </text>
                  {n.sub && !wide && (
                    <text x={n.x} y={n.y + 39} textAnchor="middle" className="fx-mono" fontSize="8" fill="#3d5a78">{n.sub}</text>
                  )}
                  {n.sub && wide && (
                    <text x={n.x} y={n.y + 26} textAnchor="middle" className="fx-mono" fontSize="8" fill="#3d5a78">{n.sub}</text>
                  )}
                </g>
              );
            })}
          </svg>

          {revealed === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#050c16cc]">
              <p className="fx-mono text-[11px] tracking-[2px] text-[#7fb4d8] uppercase text-center px-6">
                A live proof-of-work history — signed, chained, replayable.
              </p>
              <button
                onClick={run}
                className="fx-mono text-[12px] tracking-[1.5px] uppercase rounded-md border border-[#1a9fe8] bg-[#1a9fe814] px-6 py-2.5 text-[#1a9fe8] hover:bg-[#1a9fe826] transition-colors"
              >
                ▶ Run the fabric
              </button>
            </div>
          )}
        </div>

        {/* side panel: current step + trust + terminal */}
        <div className="flex flex-col">
          <div className="px-4 py-3 border-b border-[#1a9fe81f] min-h-[104px]">
            {current ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="fx-mono text-[10px] text-[#3d5a78]">[{current.n}]</span>
                  <span className="fx-mono text-[12px] text-[#1a9fe8] tracking-[1px]">{current.tool}</span>
                </div>
                <div className="mt-1.5 font-semibold text-sm text-[#e0eaf5]">{current.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-[#7fb4d8]">{current.detail}</p>
              </>
            ) : (
              <p className="fx-mono text-[11px] text-[#3d5a78] leading-relaxed">
                Nine MCP tools. One agent. Every action it takes becomes a signed, content-addressed record you can verify offline.
              </p>
            )}
          </div>

          {/* trust meter */}
          <div className="px-4 py-3 border-b border-[#1a9fe81f]">
            <div className="flex items-center justify-between">
              <span className="fx-mono text-[10px] tracking-[1.5px] text-[#3d5a78] uppercase">Trust score</span>
              <span className="fx-mono text-[12px] text-[#22c55e]">{trust != null ? `${trust}/100` : "—"}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-[#0a1522] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#06b6d4] to-[#22c55e] transition-all duration-700" style={{ width: `${trust ?? 0}%` }} />
            </div>
          </div>

          {/* terminal log */}
          <div ref={logRef} className="flex-1 max-h-64 overflow-auto px-4 py-3 fx-mono text-[10.5px] leading-relaxed">
            {log.length === 0 ? (
              <span className="text-[#3d5a78]">$ awaiting run…</span>
            ) : (
              log.map((line, i) => (
                <div key={i} className={line.startsWith("  ") ? "text-[#5a7594]" : line.includes("⚠") ? "text-[#f97316]" : "text-[#9ec4e0]"}>
                  {line}
                </div>
              ))
            )}
            {error && <div className="text-[#cc2a36]">error: {error}</div>}
          </div>

          {/* controls */}
          <div className="px-4 py-3 border-t border-[#1a9fe81f] flex items-center gap-2">
            <button
              onClick={run}
              disabled={running}
              className="fx-mono text-[11px] tracking-[1px] uppercase rounded-md border border-[#1a9fe8] bg-[#1a9fe814] px-4 py-2 text-[#1a9fe8] hover:bg-[#1a9fe826] disabled:opacity-40 transition-colors"
            >
              {running ? "running…" : revealed > 0 ? "▶ replay" : "▶ run"}
            </button>
            {revealed > 0 && !running && (
              <button
                onClick={reset}
                className="fx-mono text-[11px] tracking-[1px] uppercase rounded-md border border-[#1a9fe833] px-4 py-2 text-[#3d5a78] hover:text-[#7fb4d8] transition-colors"
              >
                reset
              </button>
            )}
            <span className="ml-auto fx-mono text-[10px] text-[#3d5a78]">
              {revealed}/{steps.length || 7} tools
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
