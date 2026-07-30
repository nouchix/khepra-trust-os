import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, Eyebrow, Card } from "@/components/section";
import { CodeTabs } from "@/components/code-tabs";
import { Search, FileText, Cpu, Shield, KeyRound, Boxes, GitBranch, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation — KHEPRA Trust Network" },
      { name: "description", content: "Explore documentation for the KHEPRA Trust Network. Access protocol specifications, SDK integration guides, connector authoring manuals, and API references." },
      { property: "og:title", content: "Documentation — KHEPRA Trust Network" },
      { property: "og:description", content: "Explore documentation for the KHEPRA Trust Network. Access protocol specifications, SDK integration guides, connector authoring manuals, and API references." },
    ],
  }),
  component: DocsPage,
});

const nav = [
  {
    title: "Get started",
    items: [
      { t: "Quickstart", d: "Attest your first action in under 10 minutes." },
      { t: "Core concepts", d: "Actors, envelopes, the DAG, and policy bundles." },
      { t: "Install SDKs", d: "TypeScript, Python, Go — with signed release checksums." },
    ],
    Icon: FileText,
  },
  {
    title: "Protocol",
    items: [
      { t: "Envelope schema", d: "Canonical fields, hashing, and signature layout." },
      { t: "DID method (did:khepra)", d: "Actor identifiers and delegation graph." },
      { t: "DAG semantics", d: "Parent linkage, anchoring, and verification." },
    ],
    Icon: GitBranch,
  },
  {
    title: "Identity",
    items: [
      { t: "PQC-hybrid keys", d: "ML-DSA-65 + Ed25519 with rotation guidance." },
      { t: "HSM integration", d: "PKCS#11 and cloud KMS roots of trust." },
      { t: "Delegation", d: "On-behalf-of chains for humans, agents, workloads." },
    ],
    Icon: KeyRound,
  },
  {
    title: "Policy",
    items: [
      { t: "Authoring bundles", d: "OPA/Rego style, version pinning, testing." },
      { t: "Obligations", d: "Attach masking, review, quorum to allow decisions." },
      { t: "Simulation", d: "Replay historical evidence against new bundles." },
    ],
    Icon: Shield,
  },
  {
    title: "Runtime & Agents",
    items: [
      { t: "Agent sessions", d: "Session lifecycle, context, and attestation hooks." },
      { t: "Tool mediation", d: "Signed tool manifests and I/O redaction." },
      { t: "Sidecar mode", d: "gRPC / HTTP sidecar for polyglot runtimes." },
    ],
    Icon: Cpu,
  },
  {
    title: "Connectors",
    items: [
      { t: "Author a connector", d: "Manifest, capability scope, signing, publishing." },
      { t: "Testing kit", d: "Golden envelope tests and replay verification." },
      { t: "Publishing to Marketplace", d: "Review, certification, distribution." },
    ],
    Icon: Boxes,
  },
];

function DocsPage() {
  return (
    <>
      <PageHero
        eyebrow="Documentation"
        title={<>Documentation — <span className="text-gradient">KHEPRA</span> Trust Network</>}
        subtitle="Protocol reference, SDK guides, and API documentation. Written for the engineer who has to make it work in production on Monday."
      />

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
            Attest an action across languages.
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

      <section>
        <div className="container-x py-16 grid md:grid-cols-2 gap-4">
          <Card>
            <div className="font-display text-lg font-semibold">Have questions?</div>
            <p className="mt-2 text-sm text-muted-foreground">Join the developer community on Discord or open an issue in the reference implementation.</p>
            <div className="mt-4 flex gap-2">
              <a href="#" className="rounded-md border border-border px-3 py-2 text-sm">Discord</a>
              <a href="#" className="rounded-md border border-border px-3 py-2 text-sm">GitHub</a>
            </div>
          </Card>
          <Card>
            <div className="font-display text-lg font-semibold">Enterprise support</div>
            <p className="mt-2 text-sm text-muted-foreground">Named architects, SLA-backed response, and design partnership for regulated deployments.</p>
            <Link to="/pricing" className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary">
              See enterprise plans <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        </div>
      </section>
    </>
  );
}