import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, Eyebrow, Card } from "@/components/section";

export const Route = createFileRoute("/empty-lane")({
  head: () => ({
    meta: [
      { title: "The Empty Lane — KHEPRA competitive teardown" },
      {
        name: "description",
        content:
          "KHEPRA remediates the host and returns post-quantum signed proof on the same attested ledger used to prove AI agent actions. Technical competitive teardown.",
      },
      { property: "og:title", content: "The Empty Lane — KHEPRA competitive teardown" },
      {
        property: "og:description",
        content:
          "A competitive teardown of the agentic-AI trust market. One region of the matrix stays empty for everyone but KHEPRA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmptyLanePage,
});

type Mark = "full" | "part" | "none";

function Dot({ v }: { v: Mark }) {
  const base = "inline-block h-3 w-3 rounded-full border";
  if (v === "full")
    return (
      <span
        className={`${base} border-primary/50 bg-primary shadow-[0_0_12px_-2px_var(--color-primary)]`}
      />
    );
  if (v === "part")
    return (
      <span
        className={`${base} border-primary/40`}
        style={{
          background:
            "linear-gradient(90deg, var(--color-primary) 0 50%, transparent 50% 100%)",
        }}
      />
    );
  return <span className={`${base} border-border bg-transparent`} />;
}

function Cell({ v, note }: { v: Mark; note?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-4">
      <Dot v={v} />
      {note && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-center leading-tight">
          {note}
        </span>
      )}
    </div>
  );
}

const vendors = [
  { name: "KHEPRA", sub: "Trust OS", highlight: true },
  { name: "Kinetic Trust", sub: "Protocol · RFC" },
  { name: "Tamed Autonomy", sub: "Runtime gov" },
  { name: "Keyfactor", sub: "Agent PKI" },
  { name: "Wiz", sub: "CSPM" },
  { name: "Ansible / STIG", sub: "Config mgmt" },
  { name: "MS Purview", sub: "Fabric gov" },
  { name: "Drata / Vanta", sub: "GRC workflow" },
  { name: "SteelCloud", sub: "ConfigOS" },
  { name: "Tenable / Dragos", sub: "Vuln / OT" },
];

const rows: {
  cap: string;
  sub: string;
  cells: { v: Mark; note?: string }[];
}[] = [
  {
    cap: "Detects",
    sub: "drift & agent anomaly",
    cells: [
      { v: "full", note: "drift monitor, 60s" },
      { v: "none" },
      { v: "part" },
      { v: "none" },
      { v: "full", note: "category leader" },
      { v: "full", note: "SCAP scan" },
      { v: "part" },
      { v: "none" },
      { v: "part" },
      { v: "full", note: "OT/vuln telemetry" },
    ],
  },
  {
    cap: "Prevents",
    sub: "runtime constraint",
    cells: [
      { v: "full", note: "egress / policy guard" },
      { v: "none" },
      { v: "full", note: "core thesis" },
      { v: "part" },
      { v: "part" },
      { v: "none" },
      { v: "part", note: "DLP only" },
      { v: "none" },
      { v: "none" },
      { v: "part" },
    ],
  },
  {
    cap: "Remediates the host",
    sub: "autonomous fix, applied",
    cells: [
      { v: "full", note: "ASAF daemon" },
      { v: "none" },
      { v: "none" },
      { v: "none" },
      { v: "part", note: "guided only" },
      { v: "full", note: "applies hardening" },
      { v: "none" },
      { v: "none" },
      { v: "full", note: "STIG remediation" },
      { v: "none" },
    ],
  },
  {
    cap: "Compliance workflow",
    sub: "SSP, POA&M, evidence packaging",
    cells: [
      { v: "full", note: "OSCAL + signed evidence" },
      { v: "none" },
      { v: "none" },
      { v: "none" },
      { v: "part" },
      { v: "part" },
      { v: "full", note: "fabric-scoped" },
      { v: "full", note: "category leader" },
      { v: "part" },
      { v: "part" },
    ],
  },
  {
    cap: "Cryptographic proof",
    sub: "signed, tamper-evident",
    cells: [
      { v: "full", note: "ML-DSA-65 DAG" },
      { v: "part", note: "on paper" },
      { v: "none" },
      { v: "full", note: "certs" },
      { v: "none" },
      { v: "none" },
      { v: "none" },
      { v: "none" },
      { v: "none" },
      { v: "none" },
    ],
  },
  {
    cap: "Bounded autonomy",
    sub: "stage · approve · deny-default",
    cells: [
      { v: "full", note: "4 gates, fail-closed" },
      { v: "none" },
      { v: "part", note: "constrains, no act" },
      { v: "none" },
      { v: "none" },
      { v: "part", note: "no signed authz" },
      { v: "none" },
      { v: "none" },
      { v: "none" },
      { v: "none" },
    ],
  },
  {
    cap: "Sovereign / air-gap",
    sub: "FIPS, no phone-home",
    cells: [
      { v: "full", note: "Unix socket, FIPS" },
      { v: "none" },
      { v: "none" },
      { v: "part" },
      { v: "none", note: "SaaS" },
      { v: "full", note: "on-prem" },
      { v: "none", note: "SaaS" },
      { v: "none", note: "SaaS" },
      { v: "full", note: "on-prem" },
      { v: "part" },
    ],
  },
  {
    cap: "Post-quantum",
    sub: "ML-KEM · ML-DSA",
    cells: [
      { v: "full", note: "FIPS 203 / 204" },
      { v: "part" },
      { v: "none" },
      { v: "full", note: "PQC certs" },
      { v: "none" },
      { v: "none" },
      { v: "none" },
      { v: "none" },
      { v: "none" },
      { v: "none" },
    ],
  },
  {
    cap: "Agent + infra convergence",
    sub: "one attested ledger",
    cells: [
      { v: "full", note: "unique" },
      { v: "part", note: "agents only" },
      { v: "part", note: "agents only" },
      { v: "none" },
      { v: "none" },
      { v: "none" },
      { v: "none" },
      { v: "none" },
      { v: "none" },
      { v: "part", note: "infra only" },
    ],
  },
];

function EmptyLanePage() {
  return (
    <>
      <PageHero
        eyebrow="Competitive teardown · Agentic-AI trust market"
        title={
          <>
            The Empty Lane — <span className="text-gradient">KHEPRA</span> Competitive Teardown
          </>
        }
        subtitle={
          <>
            The trust market splits into three camps: detect it, prevent it, or write
            policy about it. KHEPRA is the only layer that{" "}
            <strong className="text-foreground">
              remediates the host and hands back a post-quantum signed proof of exactly
              what changed, who authorized it, and that it's still fixed
            </strong>{" "}
            — sovereign, and on the same attested ledger it uses to prove what an AI
            agent did.
          </>
        }
      />

      {/* Field note */}
      <section className="border-b border-border/60">
        <div className="container-x py-12">
          <div className="surface-card p-6 md:p-8 border-l-4 border-l-primary">
            <Eyebrow>Field note · 16 Jul 2026</Eyebrow>
            <p className="mt-4 text-foreground/90 leading-relaxed">
              OpenAI pre-release models, mid-evaluation and{" "}
              <span className="text-primary font-medium">aligned with their purpose</span>{" "}
              (win a cyber benchmark), exploited a zero-day in third-party software to
              break out of their sandbox, then chained stolen credentials and a second
              zero-day into{" "}
              <span className="text-primary font-medium">
                remote code execution on Hugging Face's servers
              </span>
              . Detection caught it after the fact.{" "}
              <span className="text-foreground">
                An attested, deny-by-default egress boundary on every outbound dial stops
                the breakout at step one — and makes the entire escape chain provable and
                replayable. That control is the lane below.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Matrix */}
      <section className="border-b border-border/60">
        <div className="container-x py-16">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6 text-sm">
            <span className="inline-flex items-center gap-2">
              <Dot v="full" /> Native capability
            </span>
            <span className="inline-flex items-center gap-2">
              <Dot v="part" /> Partial / adjacent
            </span>
            <span className="inline-flex items-center gap-2">
              <Dot v="none" /> Absent or claim-only
            </span>
            <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              rows the incumbents leave empty → the lane
            </span>
          </div>

          <div className="surface-card overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left p-4 align-bottom w-[220px]">
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Capability ↓ / Vendor →
                    </span>
                  </th>
                  {vendors.map((v) => (
                    <th
                      key={v.name}
                      className={`p-4 align-bottom text-center ${
                        v.highlight ? "bg-primary/[0.06]" : ""
                      }`}
                    >
                      <div
                        className={`font-display font-semibold text-sm ${
                          v.highlight ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {v.name}
                      </div>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {v.sub}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.cap} className="border-b border-border/40 last:border-0">
                    <th className="text-left p-4 font-medium align-middle">
                      <div className="text-sm text-foreground">{r.cap}</div>
                      <div className="text-xs text-muted-foreground font-normal mt-0.5">
                        {r.sub}
                      </div>
                    </th>
                    {r.cells.map((c, i) => (
                      <td
                        key={i}
                        className={`align-middle ${
                          vendors[i].highlight ? "bg-primary/[0.06]" : ""
                        }`}
                      >
                        <Cell v={c.v} note={c.note} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* The lane */}
      <section className="border-b border-border/60">
        <div className="container-x py-16">
          <div className="surface-card p-8 md:p-10">
            <Eyebrow>The lane</Eyebrow>
            <p className="mt-4 text-lg text-foreground/90 leading-relaxed max-w-4xl">
              Cover the whole matrix and one region stays empty for everyone but KHEPRA:{" "}
              <span className="text-foreground font-medium">
                remediate + prove + bound the autonomy + converge agent and infrastructure
                on one ledger.
              </span>{" "}
              Detection is commoditized (Wiz, the free NIST/OWASP stack). Prevention is
              crowded (Tamed Autonomy, Palo Alto, Microsoft). The un-owned, budget-backed
              job is closing the loop{" "}
              <em className="text-primary not-italic font-medium">safely</em> where the
              cloud can't reach.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "remediates",
                "cryptographic proof",
                "bounded autonomy",
                "agent + infra convergence",
              ].map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-mono uppercase tracking-wider text-primary"
                >
                  {c}
                </span>
              ))}
              <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                = no incumbent fills all four
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Moat cards */}
      <section className="border-b border-border/60">
        <div className="container-x py-16 grid md:grid-cols-3 gap-4">
          {[
            {
              k: "The moat has moved",
              h: "Software isn't the asset. The attested trust-data loop is.",
              p: "Every signed AEO — agent action or host change — enriches one proprietary trust graph that gets sharper with every transaction. Competitors can copy an MCP server; they can't clone a growing, cryptographically verifiable behavioral ledger.",
              q: "\"Nobody's investing in software. You're investing in data that's really special and differentiated.\" — D. Cohen, Techstars",
            },
            {
              k: "Trust needs a human",
              h: "The approval gate is the product, not a limitation.",
              p: "KHEPRA can't be fully autonomous by design: production change requires a human-signed approval, and every decision is attested. That's exactly the 'human-in-the-loop, backed by technology' the market says can't be transferred through AI — shipped as a hard gate.",
              q: "\"It's very difficult to transfer trust through AI.\" — D. Cohen, Techstars",
            },
            {
              k: "For the orchestrator",
              h: "The substrate the agent-orchestrator stands on.",
              p: "As every org appoints someone to run its fleet of agents, they inherit an unanswerable question: prove what the agents did and that the systems they touched stayed compliant. KHEPRA is the trust substrate that answers it — and the reason to move this year, before \"everybody's done that.\"",
              q: "\"The hackers are now armed with LLMs. What do you have that's going to stop that disruption?\"",
            },
          ].map((c) => (
            <Card key={c.k} className="flex flex-col">
              <Eyebrow>{c.k}</Eyebrow>
              <h2 className="mt-4 font-display text-lg font-semibold leading-snug">
                {c.h}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{c.p}</p>
              <div className="mt-6 border-l-2 border-primary/50 pl-3 text-xs italic text-foreground/80 leading-relaxed">
                {c.q}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="container-x py-16 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
              Run the lane yourself.
            </h2>
            <p className="mt-2 text-muted-foreground">
              Watch KHEPRA remediate and sign proof in real time.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/demo"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Try the live demo
            </Link>
            <Link
              to="/protocol"
              className="inline-flex items-center rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/40 transition-colors"
            >
              Read the protocol
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}