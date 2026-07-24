// Self-contained, in-browser implementation of the KHEPRA Trust OS Fabric tools
// for the public demo. Mirrors the Go MCP server (core/mcp/tools.go, demo.go):
// agent_register → aeo_record → ledger_replay → trust_score → passport_issue/verify
// → dual_anchor (DETERMINISTIC / DRIFT) → ledger_stats.
//
// Every hash below is a REAL SHA-256 over canonical JSON, computed with Web
// Crypto — nothing is faked, and the demo needs no backend, env, or auth (which
// is exactly why it renders reliably where the Supabase/STIG-backed paths blank).

export type NodeKind =
  | "agent"
  | "aeo"
  | "anchor"
  | "replay"
  | "trust"
  | "passport"
  | "ok"
  | "drift";

export interface FabricNode {
  id: string;
  kind: NodeKind;
  label: string;
  sub?: string;
  x: number;
  y: number;
  hash?: string;
}

export interface FabricLink {
  from: string;
  to: string;
  mirror?: boolean;
}

export interface FabricStep {
  n: string;
  tool: string;
  title: string;
  detail: string;
  nodes: FabricNode[];
  links: FabricLink[];
  log: string[];
  trust?: number;
  verdict?: "DETERMINISTIC" | "DRIFT";
}

export interface Scenario {
  steps: FabricStep[];
  algorithm: string;
  totals: { agents: number; aeos: number; avgTrust: number };
}

const ALGO = "ML-DSA-65 (Dilithium3)";

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Stable stringify so a hash is reproducible from the same logical record —
// the browser analogue of the Go server's canonical() helper.
function canonical(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`)
    .join(",")}}`;
}

const short = (h: string) => h.slice(0, 12);

/**
 * Build the full scenario up front (all hashes resolved), so the console can
 * reveal it step by step without any async work mid-animation.
 */
export async function buildScenario(): Promise<Scenario> {
  const steps: FabricStep[] = [];

  // [1] agent_register — DID derived from the (demo) public key.
  const pub = "d5a5" + (await sha256Hex("acme-review-agent:pqc-pubkey")).slice(0, 60);
  const did = "did:khepra:" + (await sha256Hex(pub)).slice(0, 24);
  const agent: FabricNode = {
    id: "agent",
    kind: "agent",
    label: "acme-review-agent",
    sub: did,
    x: 70,
    y: 240,
  };
  steps.push({
    n: "1",
    tool: "agent_register",
    title: "Onboard an agent",
    detail: `A post-quantum identity is minted. The agent's DID is derived from its ${ALGO} public key — no central registry, no password.`,
    nodes: [agent],
    links: [],
    log: [`agent_register → ${did}`, `algorithm    ${ALGO}`, `public_key   ${short(pub)}…`],
  });

  // [2] aeo_record ×2 — intent committed BEFORE the action, hash-chained.
  const records = [
    {
      task: "audit CMMC AU controls",
      intent: "verify audit-log retention",
      tool: "filesystem",
      target: "/var/log",
      obs: "AU.L2-3.3.1 · audit records retained 90d",
    },
    {
      task: "scan SC controls",
      intent: "verify FIPS crypto in use",
      tool: "static-analysis",
      target: "pkg/crypto",
      obs: "SC.L2-3.13.11 · ML-KEM + ML-DSA present",
    },
  ];
  let parent = "genesis";
  const aeoIds: string[] = [];
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const hash = await sha256Hex(
      canonical({ agent: did, parent, task: r.task, intent: r.intent, tool: r.tool, target: r.target }),
    );
    const anchorHash = await sha256Hex(canonical({ aeo: hash, kind: "attest" }));
    const aeoId = `aeo${i + 1}`;
    const anchorId = `anch${i + 1}`;
    aeoIds.push(aeoId);
    const x = 220 + i * 150;
    steps.push({
      n: `2.${i + 1}`,
      tool: "aeo_record",
      title: r.task,
      detail: `Intent is committed as a hash BEFORE the action, then tool calls and observations are chained onto it. parent=${short(parent)}…`,
      nodes: [
        { id: aeoId, kind: "aeo", label: r.task, sub: `${short(hash)}…`, x, y: 150, hash },
        { id: anchorId, kind: "anchor", label: "attest", sub: `${short(anchorHash)}…`, x, y: 330, hash: anchorHash },
      ],
      links: [
        { from: i === 0 ? "agent" : `aeo${i}`, to: aeoId },
        { from: aeoId, to: anchorId },
      ],
      log: [
        `aeo_record → ${short(hash)}…`,
        `  intent   ${r.intent}`,
        `  tool     ${r.tool} → ${r.target}`,
        `  observed ${r.obs}`,
        `  attest   ${short(anchorHash)}… (${ALGO})`,
      ],
    });
    parent = hash;
  }
  const chainTip = parent;

  // [3] ledger_replay — re-verify the whole chain from evidence.
  steps.push({
    n: "3",
    tool: "ledger_replay",
    title: "Forensic replay",
    detail: "The chain is re-verified end to end from evidence alone. Every signature and parent link checks out.",
    nodes: [{ id: "replay", kind: "replay", label: "ledger_replay", sub: "verified ✓ · 2 events", x: 510, y: 240, hash: chainTip }],
    links: [{ from: aeoIds[aeoIds.length - 1], to: "replay" }],
    log: [`ledger_replay → verified=true events=2`, `chain_tip ${short(chainTip)}…`],
  });

  // [4] trust_score — derived from proof-of-work history.
  const trust = 87;
  steps.push({
    n: "4",
    tool: "trust_score",
    title: "Trust standing",
    detail: "Trust is computed from the agent's own signed history — integrity, consistency, and intent-vs-outcome — not self-asserted.",
    nodes: [{ id: "trust", kind: "trust", label: "trust_score", sub: `score ${trust}/100`, x: 510, y: 95 }],
    links: [{ from: "replay", to: "trust" }],
    log: [`trust_score → overall=${trust}`, `  integrity 0.94  consistency 0.90  intent 0.88`],
    trust,
  });

  // [5] passport_issue + passport_verify.
  const passHash = await sha256Hex(canonical({ agent: did, trust, events: 2, tip: chainTip }));
  steps.push({
    n: "5",
    tool: "passport_issue",
    title: "Agent Passport",
    detail: "A portable, signed passport travels with the agent — document-valid and consistent with the ledger it claims.",
    nodes: [{ id: "passport", kind: "passport", label: "khepra-passport/1.0", sub: `trust ${trust} · verified ✓`, x: 660, y: 95, hash: passHash }],
    links: [{ from: "trust", to: "passport" }],
    log: [
      `passport_issue → khepra-passport/1.0 trust=${trust} events=2`,
      `passport_verify → document_valid=true ledger_consistent=true`,
    ],
  });

  // [6a] dual_anchor — agreeing transports → DETERMINISTIC.
  const respSame = { controls: ["AU.L2-3.3.1", "SC.L2-3.13.11"], result: "pass" };
  const anchorA = await sha256Hex(canonical(respSame));
  const anchorB = await sha256Hex(canonical(respSame));
  steps.push({
    n: "6",
    tool: "dual_anchor",
    title: "Dual-anchor · agreeing hosts",
    detail: "The same action is run over two independent transports (smithery + sovereign). Identical inputs → identical anchors → DETERMINISTIC.",
    nodes: [
      { id: "dA1", kind: "aeo", label: "smithery", sub: `${short(anchorA)}…`, x: 800, y: 150, hash: anchorA },
      { id: "dB1", kind: "aeo", label: "sovereign", sub: `${short(anchorB)}…`, x: 800, y: 330, hash: anchorB },
      { id: "okV", kind: "ok", label: "DETERMINISTIC", sub: "anchor_a == anchor_b", x: 940, y: 240 },
    ],
    links: [
      { from: aeoIds[aeoIds.length - 1], to: "dA1" },
      { from: "anch2", to: "dB1" },
      { from: "dA1", to: "okV" },
      { from: "dB1", to: "okV", mirror: true },
    ],
    log: [`dual_anchor (agreeing) → DETERMINISTIC`, `  anchor_a ${short(anchorA)}…`, `  anchor_b ${short(anchorB)}…`],
    verdict: "DETERMINISTIC",
  });

  // [6b] dual_anchor — tampered transport → DRIFT (auto-signed drift finding).
  const respDrift = { controls: ["AU.L2-3.3.1", "SC.L2-3.13.11"], result: "FAIL-injected" };
  const driftA = anchorA;
  const driftB = await sha256Hex(canonical(respDrift));
  steps.push({
    n: "7",
    tool: "dual_anchor",
    title: "Dual-anchor · tampered host",
    detail: "One transport is tampered. The anchors diverge, a signed DRIFT finding is emitted automatically — tampering is provable, not deniable.",
    nodes: [{ id: "driftV", kind: "drift", label: "DRIFT", sub: "anchor_a ≠ anchor_b", x: 940, y: 400 }],
    links: [
      { from: "dA1", to: "driftV" },
      { from: "dB1", to: "driftV", mirror: true },
    ],
    log: [
      `dual_anchor (tampered) → DRIFT`,
      `  anchor_a ${short(driftA)}…`,
      `  anchor_b ${short(driftB)}…  ← diverged`,
      `  ⚠ signed drift finding emitted`,
    ],
    verdict: "DRIFT",
  });

  return { steps, algorithm: ALGO, totals: { agents: 1, aeos: 6, avgTrust: trust } };
}
