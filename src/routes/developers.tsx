import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { ArrowRight, Book, Code2, Package, Terminal } from "lucide-react";

export const Route = createFileRoute("/developers")({
  head: () => ({
    meta: [
      { title: "Developer Portal — KHEPRA Trust Network" },
      { name: "description", content: "Build with KHEPRA. Get SDKs, connectors, and docs to prove what your AI agents do." },
      { property: "og:title", content: "Developer Portal — KHEPRA Trust Network" },
      { property: "og:description", content: "Build with KHEPRA. Get SDKs, connectors, and docs to prove what your AI agents do." },
    ],
  }),
  component: DevPage,
});

function DevPage() {
  return (
    <>
      <PageHero
        eyebrow="Developer Portal"
        title={<>Developer Portal — <span className="text-gradient">KHEPRA</span> Trust Network</>}
        subtitle="SDKs, signed connector kits, and policy bundles. Everything you need to plug your stack into the KHEPRA Trust Network and start proving what your agents do."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { Icon: Terminal, t: "SDKs", d: "TypeScript, Python, Go. Sign every action, check every record, control every tool." },
            { Icon: Package, t: "Connector Kit", d: "Build signed connectors that only reach what you say they can." },
            { Icon: Code2, t: "Policy Studio", d: "Write and test your rules against real past evidence before you trust them." },
            { Icon: Book, t: "Protocol Docs", d: "How records are built, checked, and locked so they hold up in an audit." },
          ].map(({ Icon, t, d }) => (
            <Card key={t}>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/30">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <div className="mt-5 font-display text-lg font-semibold">{t}</div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-16">
          <SectionHeading eyebrow="Quickstart" title="Prove one action in under 20 lines of code." />
          <div className="mt-8 surface-card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-background/40">
              <div className="font-mono text-xs text-muted-foreground">attest.ts</div>
              <div className="font-mono text-[11px] text-primary/80">@khepra/sdk</div>
            </div>
            <pre className="p-6 text-[13px] leading-relaxed text-foreground/90 overflow-x-auto"><code>{`import { Khepra } from "@khepra/sdk";

const kh = new Khepra({
  actor: "did:khepra:agent/finance-copilot#v3",
  policyBundle: "cmmc.l2@2026.07",
});

const session = await kh.session.start({ onBehalfOf: "did:khepra:user/j.okafor" });

const decision = await session.authorize({
  type: "tool.invoke",
  target: "conn:snowflake/warehouse.reports",
  intent: "generate_q3_ap_summary",
});

if (decision.allow) {
  const output = await tools.snowflake.query(decision.obligations);
  await session.attest({ inputs: decision.inputs, outputs: output });
}`}</code></pre>
          </div>
        </div>
      </section>

      <section>
        <div className="container-x py-16">
          <SectionHeading eyebrow="Request access" title="Get early access to the SDKs." />
          <form
            className="mt-10 max-w-xl grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = "mailto:developers@khepra.network?subject=KHEPRA%20Alpha%20Access";
            }}
          >
            <label className="grid gap-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Work email</span>
              <input
                type="email"
                required
                placeholder="you@company.com"
                className="rounded-md border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </label>
            <label className="grid gap-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Use case</span>
              <textarea
                rows={4}
                placeholder="Tell us which agents or systems you want to keep in check…"
                className="rounded-md border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors glow-ring w-fit"
            >
              Request early access <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </>
  );
}