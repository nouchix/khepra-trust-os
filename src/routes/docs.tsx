import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, Eyebrow, Card } from "@/components/section";
import { CodeTabs } from "@/components/code-tabs";
import { Search, FileText, Cpu, Shield, KeyRound, Boxes, GitBranch, ArrowRight } from "lucide-react";
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema } from "@/components/seo-json-ld";
import { AnswerBlock, Byline, LastUpdated, FaqBlock } from "@/components/seo-blocks";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Where Are the KHEPRA Docs? Documentation" },
      { name: "description", content: "Docs for the KHEPRA Trust Network. Guides, SDKs, and API references to keep your AI agents in check." },
      { property: "og:title", content: "Where Are the KHEPRA Docs? Documentation" },
      { property: "og:description", content: "Docs for the KHEPRA Trust Network. Guides, SDKs, and API references to keep your AI agents in check." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://adinkhepra.com/docs" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(buildFaqSchema(FAQS)) }],
  }),
  component: DocsPage,
});

const nav = [
  {
    title: "Get started",
    items: [
      { t: "Quickstart", d: "Sign and prove your first action in under 10 minutes." },
      { t: "Core concepts", d: "Actors, records, the DAG (tamper-proof chain), and rule bundles." },
      { t: "Install SDKs", d: "TypeScript, Python, Go — every release signed and checksum-verified." },
    ],
    Icon: FileText,
  },
  {
    title: "Protocol",
    items: [
      { t: "Envelope schema", d: "The exact fields, hashing, and signature layout we use." },
      { t: "DID method (did:khepra)", d: "How agents and users get identified and linked." },
      { t: "DAG semantics", d: "How records link, anchor, and get verified." },
    ],
    Icon: GitBranch,
  },
  {
    title: "Identity",
    items: [
      { t: "Quantum-safe keys", d: "ML-DSA-65 plus Ed25519, with guidance on rotating them safely." },
      { t: "HSM integration", d: "Connect hardware key vaults and cloud key managers." },
      { t: "Delegation", d: "Track who acted on whose behalf — human, agent, or workload." },
    ],
    Icon: KeyRound,
  },
  {
    title: "Policy",
    items: [
      { t: "Authoring bundles", d: "Write, pin, and test your rules before they go live." },
      { t: "Obligations", d: "Add masking, human review, or approval before something is allowed." },
      { t: "Simulation", d: "Test new rules against real past evidence before trusting them." },
    ],
    Icon: Shield,
  },
  {
    title: "Runtime & Agents",
    items: [
      { t: "Agent sessions", d: "How a session starts, runs, and gets proven." },
      { t: "Tool mediation", d: "Signed tool lists and how sensitive data gets hidden." },
      { t: "Sidecar mode", d: "Run KHEPRA next to any app, in any language." },
    ],
    Icon: Cpu,
  },
  {
    title: "Connectors",
    items: [
      { t: "Author a connector", d: "Build, scope, sign, and publish your connector." },
      { t: "Testing kit", d: "Test your connector against known-good records." },
      { t: "Publishing to Marketplace", d: "Get reviewed, certified, and listed." },
    ],
    Icon: Boxes,
  },
];

const FAQS = [
  {
    question: "Where are the KHEPRA docs?",
    answer: "Right here. Use the search bar above or browse by topic — get started, protocol, identity, policy, runtime, and connectors — to find the guide or API reference you need.",
  },
  {
    question: "How do I sign my first action?",
    answer: "Follow the Quickstart guide. It walks you through signing and proving your first action in under 10 minutes using the TypeScript, Python, or Go SDK.",
  },
  {
    question: "What is did:khepra?",
    answer: "It's KHEPRA's DID method — a way to identify and link agents and users so every signed record ties back to a real actor, not an anonymous process.",
  },
  {
    question: "Can I test policy rules before they go live?",
    answer: "Yes. The Policy section covers authoring bundles, adding obligations like masking or human review, and simulating new rules against real past evidence first.",
  },
  {
    question: "How do I get help if the docs don't answer my question?",
    answer: "Join the developer community on Discord, open an issue in the reference code on GitHub, or contact enterprise support for a named architect and SLA-backed help.",
  },
];

function DocsPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", url: "https://adinkhepra.com/" },
          { name: "Docs", url: "https://adinkhepra.com/docs" },
        ])}
      />
      <PageHero
        eyebrow="Documentation"
        title={<>Where are the <span className="text-gradient">KHEPRA</span> docs?</>}
        subtitle="Protocol reference, SDK guides, and API docs. Written for the engineer who has to make it work by Monday."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-10">
          <Byline updated="August 2026" />
          <div className="mt-6">
            <AnswerBlock>
              KHEPRA's documentation covers get-started guides, the full protocol spec, identity
              and key management, policy authoring, agent runtime, and connectors — all on this
              page. Search below or jump straight into the API reference in TypeScript, Python,
              Go, or REST.
            </AnswerBlock>
          </div>
          <div className="mt-4">
            <LastUpdated date="August 2026" />
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-10">
          <label className="surface-card flex items-center gap-3 px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search the docs — envelope schema, did:khepra, obligations…"
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/60"
            />
            <kbd className="hidden sm:inline-flex font-mono text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">⌘K</kbd>
          </label>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-16 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nav.map(({ title, items, Icon }) => (
            <Card key={title}>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/30">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="font-display font-semibold">{title}</div>
              </div>
              <ul className="mt-4 divide-y divide-border/60">
                {items.map((it) => (
                  <li key={it.t} className="py-3 first:pt-0 last:pb-0">
                    <a href="#" className="group flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm text-foreground group-hover:text-primary transition-colors">{it.t}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{it.d}</div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-16">
          <Eyebrow>API reference</Eyebrow>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            Prove one action in any language.
          </h2>
          <div className="mt-10">
            <CodeTabs
              tabs={[
                {
                  label: "TypeScript",
                  code: `import { Khepra } from "@khepra/sdk";

const kh = new Khepra({ apiKey: process.env.KHEPRA_KEY! });
const session = await kh.session.start({
  actor: "did:khepra:agent/finance#v3",
  policyBundle: "cmmc.l2@2026.07",
});

const d = await session.authorize({
  type: "tool.invoke",
  target: "conn:snowflake/warehouse.reports",
});

if (d.allow) {
  const out = await snowflake.query(d.obligations);
  await session.attest({ inputs: d.inputs, outputs: out });
}`,
                },
                {
                  label: "Python",
                  code: `from khepra import Khepra

kh = Khepra(api_key=os.environ["KHEPRA_KEY"])
session = kh.session.start(
    actor="did:khepra:agent/finance#v3",
    policy_bundle="cmmc.l2@2026.07",
)

d = session.authorize(
    type="tool.invoke",
    target="conn:snowflake/warehouse.reports",
)

if d.allow:
    out = snowflake.query(d.obligations)
    session.attest(inputs=d.inputs, outputs=out)`,
                },
                {
                  label: "Go",
                  code: `kh := khepra.New(os.Getenv("KHEPRA_KEY"))
sess, _ := kh.Session.Start(ctx, khepra.SessionOpts{
    Actor:        "did:khepra:agent/finance#v3",
    PolicyBundle: "cmmc.l2@2026.07",
})

d, _ := sess.Authorize(ctx, khepra.Action{
    Type:   "tool.invoke",
    Target: "conn:snowflake/warehouse.reports",
})

if d.Allow {
    out, _ := snowflake.Query(d.Obligations)
    _ = sess.Attest(ctx, d.Inputs, out)
}`,
                },
                {
                  label: "REST",
                  code: `POST /v1/attestations HTTP/1.1
Host: api.khepra.network
Authorization: Bearer $KHEPRA_KEY
Content-Type: application/json

{
  "actor": "did:khepra:agent/finance#v3",
  "action": { "type": "tool.invoke", "target": "conn:snowflake/warehouse.reports" },
  "policy_bundle": "cmmc.l2@2026.07",
  "inputs_hash": "b3:9c3a...",
  "outputs_hash": "b3:1f8e..."
}`,
                },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-16 grid md:grid-cols-2 gap-4">
          <Card>
            <div className="font-display text-lg font-semibold">Have questions?</div>
            <p className="mt-2 text-sm text-muted-foreground">Join the developer community on Discord or open an issue in the reference code.</p>
            <div className="mt-4 flex gap-2">
              <a href="#" className="rounded-md border border-border px-3 py-2 text-sm">Discord</a>
              <a href="#" className="rounded-md border border-border px-3 py-2 text-sm">GitHub</a>
            </div>
          </Card>
          <Card>
            <div className="font-display text-lg font-semibold">Enterprise support</div>
            <p className="mt-2 text-sm text-muted-foreground">Get a named architect, fast SLA-backed support, and hands-on help for regulated deployments.</p>
            <Link to="/pricing" className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary">
              See enterprise plans <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        </div>
      </section>

      <FaqBlock items={FAQS} />
    </>
  );
}
