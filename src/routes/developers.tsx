import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { ArrowRight, Book, Code2, Package, Terminal } from "lucide-react";
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema } from "@/components/seo-json-ld";
import { AnswerBlock, Byline, LastUpdated, FaqBlock } from "@/components/seo-blocks";

export const Route = createFileRoute("/developers")({
  head: () => ({
    meta: [
      { title: "How Do I Build on KHEPRA? Developer Portal" },
      { name: "description", content: "Build with KHEPRA. Get SDKs, connectors, and docs to prove what your AI agents do." },
      { property: "og:title", content: "How Do I Build on KHEPRA? Developer Portal" },
      { property: "og:description", content: "Build with KHEPRA. Get SDKs, connectors, and docs to prove what your AI agents do." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://adinkhepra.com/developers" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(buildFaqSchema(FAQS)) }],
  }),
  component: DevPage,
});

const FAQS = [
  {
    question: "How do I start building on KHEPRA?",
    answer: "Request early access below, then install the TypeScript, Python, or Go SDK. You can sign and prove your first action against the KHEPRA Trust Network in under 20 lines of code.",
  },
  {
    question: "What languages does the KHEPRA SDK support?",
    answer: "TypeScript, Python, and Go today, plus a plain REST API for anything else. Every release ships signed and checksum-verified so you know the code you're running is real.",
  },
  {
    question: "What is a connector kit?",
    answer: "A signed package that limits exactly what an agent or tool can reach. You build it once, sign it, and it only touches what you say it can — nothing more.",
  },
  {
    question: "Can I test my policy rules before going live?",
    answer: "Yes. Policy Studio lets you write rules and run them against real past evidence first, so you catch a bad rule before it blocks — or allows — the wrong thing in production.",
  },
  {
    question: "Is the KHEPRA protocol documented anywhere?",
    answer: "Yes. Protocol docs cover exactly how records get built, signed, and checked so the evidence holds up in a real audit — not just in a demo.",
  },
];

function DevPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", url: "https://adinkhepra.com/" },
          { name: "Developers", url: "https://adinkhepra.com/developers" },
        ])}
      />
      <PageHero
        eyebrow="Developer Portal"
        title={<>How do I build on KHEPRA? <span className="text-gradient">SDKs</span>, connectors, and docs.</>}
        subtitle="SDKs, signed connector kits, and policy bundles. Everything you need to plug your stack into the KHEPRA Trust Network and start proving what your agents do."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-10">
          <Byline updated="August 2026" />
          <div className="mt-6">
            <AnswerBlock>
              Install the KHEPRA SDK in TypeScript, Python, or Go, sign every agent action with
              quantum-safe crypto, and check it against a tamper-proof record chain. Request early
              access below and you can prove your first action in under 20 lines of code.
            </AnswerBlock>
          </div>
          <div className="mt-4">
            <LastUpdated date="August 2026" />
          </div>
        </div>
      </section>

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

      <section className="border-b border-border/60">
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

      <FaqBlock items={FAQS} />
    </>
  );
}
