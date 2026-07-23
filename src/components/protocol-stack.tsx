import { useState } from "react";

const LAYERS = [
  { key: "app", name: "Applications", tag: "L7", desc: "AdinKhepra · SouHimBou AI · partner apps", tone: "primary" },
  { key: "evi", name: "Evidence & Replay", tag: "L6", desc: "Auditor portal, incident replay, GRC exporters", tone: "accent" },
  { key: "att", name: "DAG Attestation", tag: "L5", desc: "Append-only, hash-linked, tamper-evident", tone: "primary" },
  { key: "prov", name: "Provenance", tag: "L4", desc: "Lineage, input/output hashes, causal graph", tone: "accent" },
  { key: "pol", name: "Policy", tag: "L3", desc: "OPA/Rego bundles, obligations, quorum", tone: "primary" },
  { key: "run", name: "Runtime", tag: "L2", desc: "Sandboxed agents, mediated I/O, sessions", tone: "accent" },
  { key: "id", name: "PQC Identity", tag: "L1", desc: "Hybrid ML-DSA + Ed25519, HSM roots", tone: "primary" },
  { key: "conn", name: "Connectors", tag: "L0", desc: "Signed manifests, capability scopes", tone: "accent" },
] as const;

export function ProtocolStack() {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div className="grid gap-2">
      {LAYERS.map((l) => {
        const active = hover === l.key;
        return (
          <div
            key={l.key}
            onMouseEnter={() => setHover(l.key)}
            onMouseLeave={() => setHover(null)}
            className={`group relative grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 rounded-md border transition-all cursor-default ${
              active ? "border-primary/60 bg-primary/[0.04]" : "border-border/60 bg-card/40"
            }`}
          >
            <div className="font-mono text-xs text-primary/80">{l.tag}</div>
            <div className="min-w-0">
              <div className="font-display text-base font-semibold truncate">{l.name}</div>
              <div className="text-xs text-muted-foreground truncate">{l.desc}</div>
            </div>
            <div
              className={`h-2 w-24 rounded-full transition-all ${
                active ? "bg-gradient-to-r from-primary to-primary/40" : "bg-border/60"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}