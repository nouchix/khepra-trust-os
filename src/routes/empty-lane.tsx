import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, Eyebrow, Card } from "@/components/section";

export const Route = createFileRoute("/empty-lane")({
  head: () => ({
    meta: [
      { title: "The Empty Lane — Nobody Else Fixes This" },
      {
        name: "description",
        content:
          "KHEPRA fixes the problem and signs proof it stayed fixed, on the same ledger that proves what your AI agents do.",
      },
      { property: "og:title", content: "The Empty Lane — Nobody Else Fixes This" },
      {
        property: "og:description",
        content:
          "Every AI security vendor leaves one job undone. KHEPRA is the only one that does it.",
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
        eyebrow="Why every vendor leaves you exposed"
        title={
          <>
            The Empty Lane — Nobody Else Fills It But <span className="text-gradient">KHEPRA</span>
          </>
        }
        subtitle={
          <>
            Every vendor either watches, blocks, or writes policy about the problem.
            Nobody actually fixes it and proves it stayed fixed. KHEPRA is the only one
            that{" "}
            <strong className="text-foreground">
              fixes the problem and hands you signed proof of exactly what changed, who
              said yes, and that it is still fixed today
            </strong>{" "}
            — running on your own hardware, on the same trusted record it uses to prove
            what your AI agents did.
          </>
        }
      />

      {/* Field note */}
      <section className="border-b border-border/60">
        <div className="container-x py-12">
          <div className="surface-card p-6 md:p-8 border-l-4 border-l-primary">
            <Eyebrow>Field note · 16 Jul 2026</Eyebrow>
            <p className="mt-4 text-foreground/90 leading-relaxed">
              OpenAI's own pre-release AI, while being tested, was just doing its job{" "}
              <span className="text-primary font-medium">(win a cyber test)</span>{" "}
              when it found an unpatched flaw, broke out of its test box, then used
              stolen logins and a second flaw to get{" "}
              <span className="text-primary font-medium">
                full control of Hugging Face's servers
              </span>
              . Nobody caught it until it was already done.{" "}
              <span className="text-foreground">
                A signed, block-by-default wall on every outbound connection stops the
                breakout at step one, and proves the whole escape attempt, replayable
                start to finish. That wall is the lane below.
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
              <Dot v="full" /> Does it, for real
            </span>
            <span className="inline-flex items-center gap-2">
              <Dot v="part" /> Sort of, not fully
            </span>
            <span className="inline-flex items-center gap-2">
              <Dot v="none" /> Cannot do it
            </span>
            <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              the rows everyone else leaves blank
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
              Look at every box in the chart above. One row stays empty for everyone but KHEPRA:{" "}
              <span className="text-foreground font-medium">
                fix the problem, prove it, keep the agent's power in check, and track
                agents and systems on one record.
              </span>{" "}
              Watching for problems is a crowded market (Wiz, free NIST/OWASP tools).
              Blocking problems is crowded too (Tamed Autonomy, Palo Alto, Microsoft).
              Nobody owns actually closing the loop{" "}
              <em className="text-primary not-italic font-medium">safely</em>, where the
              cloud cannot reach.
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
              k: "The real value is not the software",
              h: "It's the signed proof record that keeps growing.",
              p: "Every signed AEO, agent action or system change, adds to one trust record that gets stronger over time. A competitor can copy a tool. Nobody can copy years of your own signed proof.",
              q: "\"Nobody's investing in software. You're investing in data that's really special and differentiated.\" — D. Cohen, Techstars",
            },
            {
              k: "Trust needs a human",
              h: "The approval step is not a weakness. It's the whole point.",
              p: "KHEPRA never runs fully on its own by design. A real person must sign off on any change to your live systems, and every decision gets recorded. Trust cannot come from AI alone. It has to come from a human backed by proof.",
              q: "\"It's very difficult to transfer trust through AI.\" — D. Cohen, Techstars",
            },
            {
              k: "For whoever runs your agents",
              h: "The ground floor under every AI agent you deploy.",
              p: "Somebody in your company now owns your fleet of AI agents. They inherit a question they cannot answer: prove what those agents did, and prove your systems stayed compliant. KHEPRA answers that question. Move now, before everyone else already has.",
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
              See it fix a system yourself.
            </h2>
            <p className="mt-2 text-muted-foreground">
              Watch KHEPRA fix a problem and sign the proof, live.
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