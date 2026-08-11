import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema } from "@/components/seo-json-ld";
import { AnswerBlock, Byline, FaqBlock, LastUpdated, type Faq } from "@/components/seo-blocks";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const FAQS: Faq[] = [
  {
    question: "What is a certified KHEPRA connector?",
    answer:
      "A certified connector links your tools to KHEPRA safely. It comes signed by its maker, spells out exactly what it can touch, and creates a signed proof record for every single call it makes.",
  },
  {
    question: "Do I need to change my code to use a connector?",
    answer:
      "No. Your systems join the trust network with no code changes. You install the certified connector and it starts producing signed proof on every call.",
  },
  {
    question: "What does a connector's capability scope mean?",
    answer:
      "Each connector spells out exactly what it can touch and what it can do, before you install it. There's no hidden or open-ended access.",
  },
  {
    question: "Which tools have certified connectors today?",
    answer:
      "Cloud and infrastructure, identity and endpoint, data and analytics, model providers, workflow and ticketing, and SIEM/GRC tools. Each connector is listed with its status: GA, Beta, Alpha, or Preview.",
  },
  {
    question: "Can I build my own certified connector?",
    answer:
      "Yes. Use the connector SDK to publish signed, scoped integrations to the KHEPRA Marketplace so other teams can install and trust them too.",
  },
];

export const Route = createFileRoute("/connectors")({
  head: () => ({
    meta: [
      { title: "What Are KHEPRA Certified Connectors?" },
      { name: "description", content: "Certified connectors that link your tools to KHEPRA safely, with signed proof for every call." },
      { property: "og:title", content: "What Are KHEPRA Certified Connectors?" },
      { property: "og:description", content: "Certified connectors that link your tools to KHEPRA safely, with signed proof for every call." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://adinkhepra.com/connectors" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(buildFaqSchema(FAQS)) }],
  }),
  component: ConnectorsPage,
});

type Conn = { name: string; kind: string; status: "GA" | "Beta" | "Alpha" | "Preview" };

const CATEGORIES: { title: string; items: Conn[] }[] = [
  {
    title: "Cloud & Infrastructure",
    items: [
      { name: "AWS", kind: "IAM · S3 · CloudTrail", status: "GA" },
      { name: "Azure", kind: "Entra · Storage · Monitor", status: "GA" },
      { name: "GCP", kind: "IAM · GCS · Audit Logs", status: "Beta" },
      { name: "Kubernetes", kind: "RBAC · Admission · Events", status: "Beta" },
      { name: "HashiCorp Vault", kind: "Secrets · Audit", status: "Beta" },
      { name: "Cloudflare", kind: "Zero Trust · Logs", status: "Preview" },
    ],
  },
  {
    title: "Identity & Endpoint",
    items: [
      { name: "Okta", kind: "Users · Groups · System Log", status: "GA" },
      { name: "Entra ID", kind: "Users · Conditional Access", status: "GA" },
      { name: "CrowdStrike", kind: "Falcon · Detections", status: "Beta" },
      { name: "Jamf", kind: "Devices · Compliance", status: "Beta" },
      { name: "1Password", kind: "Vault · Events", status: "Alpha" },
    ],
  },
  {
    title: "Data & Analytics",
    items: [
      { name: "Snowflake", kind: "Warehouses · Access History", status: "GA" },
      { name: "Databricks", kind: "Unity · Audit", status: "Beta" },
      { name: "BigQuery", kind: "Datasets · Audit", status: "Beta" },
      { name: "PostgreSQL", kind: "Roles · pgaudit", status: "GA" },
      { name: "Kafka", kind: "ACLs · Topics", status: "Alpha" },
    ],
  },
  {
    title: "Model Providers",
    items: [
      { name: "OpenAI", kind: "Chat · Tools · Files", status: "GA" },
      { name: "Anthropic", kind: "Messages · Tools", status: "GA" },
      { name: "Google Vertex", kind: "Gemini · Grounding", status: "Beta" },
      { name: "Mistral", kind: "Chat · Embeddings", status: "Beta" },
      { name: "Cohere", kind: "Command · Rerank", status: "Alpha" },
    ],
  },
  {
    title: "Workflow & Ticketing",
    items: [
      { name: "GitHub", kind: "Repos · Audit · Actions", status: "GA" },
      { name: "Jira", kind: "Issues · Workflows", status: "Beta" },
      { name: "ServiceNow", kind: "ITSM · GRC", status: "Beta" },
      { name: "Slack", kind: "Messages · Audit", status: "GA" },
      { name: "Notion", kind: "Pages · Audit", status: "Preview" },
    ],
  },
  {
    title: "SIEM, GRC & Observability",
    items: [
      { name: "Splunk", kind: "HEC · Search", status: "GA" },
      { name: "Datadog", kind: "Logs · Traces", status: "GA" },
      { name: "Chronicle", kind: "Ingest · Detect", status: "Beta" },
      { name: "Vanta", kind: "Evidence sync", status: "Beta" },
      { name: "Drata", kind: "Evidence sync", status: "Beta" },
    ],
  },
];

const statusStyle: Record<Conn["status"], string> = {
  GA: "bg-primary/15 text-primary",
  Beta: "bg-accent/15 text-accent",
  Alpha: "bg-muted text-muted-foreground",
  Preview: "bg-muted text-muted-foreground",
};

function ConnectorsPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", url: "https://adinkhepra.com/" },
          { name: "Connectors", url: "https://adinkhepra.com/connectors" },
        ])}
      />
      <PageHero
        eyebrow="Certified Connectors"
        title={<>What is a certified KHEPRA connector? <span className="text-gradient">Signed, scoped, proven.</span></>}
        subtitle="Every connector comes signed, with a clear list of what it can touch, and proof for every call it makes."
      />

      <div className="container-x pt-10">
        <AnswerBlock>
          A certified KHEPRA connector links your tools to KHEPRA safely, with no code changes.
          It ships signed by its maker, spells out exactly what it can touch, and creates a
          signed proof record with what went in, what came out, and why it was allowed, on
          every single call.
        </AnswerBlock>
        <Byline updated="August 2026" />
      </div>

      <section className="border-b border-border/60">
        <div className="container-x py-16 grid md:grid-cols-3 gap-4">
          {[
            ["Signed manifests", "Every connector version is signed by its maker. Anyone can check it."],
            ["Capability scopes", "Each connector spells out exactly what it can touch and what it can do."],
            ["Proof on every call", "Every single call creates a signed record with what went in, what came out, and why it was allowed."],
          ].map(([t, d]) => (
            <Card key={t}>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-display font-semibold">{t}</div>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{d}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-16 space-y-14">
          <SectionHeading eyebrow="Connector catalog" title="Which tools have a certified connector today?" />
          {CATEGORIES.map((cat) => (
            <div key={cat.title}>
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-primary/90 flex items-center gap-2">
                <span className="h-px w-8 bg-gradient-to-r from-primary/80 to-transparent" />
                {cat.title}
              </h3>
              <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.items.map((c) => (
                  <Card key={c.name} className="!p-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <div className="font-display font-semibold truncate">{c.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground truncate font-mono">{c.kind}</div>
                    </div>
                    <span className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] ${statusStyle[c.status]}`}>
                      {c.status}
                    </span>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <FaqBlock items={FAQS} />

      <section>
        <div className="container-x py-16">
          <div className="surface-card p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">How do I build my own certified connector?</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                Use the connector SDK to publish signed, scoped integrations to the KHEPRA Marketplace.
              </p>
              <div className="mt-4">
                <LastUpdated date="August 2026" />
              </div>
            </div>
            <Link to="/developers" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Read the SDK <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
