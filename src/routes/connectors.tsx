import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/connectors")({
  head: () => ({
    meta: [
      { title: "Certified Connectors — KHEPRA Trust Network" },
      { name: "description", content: "Signed, capability-scoped connectors across cloud, identity, data, model, and workflow providers." },
      { property: "og:title", content: "KHEPRA Certified Connectors" },
      { property: "og:description", content: "Every integration is signed, scoped, and per-call attested." },
    ],
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
      <PageHero
        eyebrow="Certified Connectors"
        title={<>Signed integrations, <span className="text-gradient">scoped</span> per session.</>}
        subtitle="Every KHEPRA connector ships with a signed manifest, declared capability scope, and per-call attestation. Your systems participate on the trust network without changing their APIs."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-16 grid md:grid-cols-3 gap-4">
          {[
            ["Signed manifests", "Every connector version is publisher-signed and independently verifiable."],
            ["Capability scopes", "Manifests declare exactly which resources and actions the connector can touch."],
            ["Per-call attestation", "Each invocation emits a KHEPRA envelope with inputs, outputs, and policy decision."],
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
          {CATEGORIES.map((cat) => (
            <div key={cat.title}>
              <Eyebrow>{cat.title}</Eyebrow>
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

      <section>
        <div className="container-x py-16">
          <div className="surface-card p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">Ship your own certified connector.</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                The connector SDK lets you publish signed, scoped integrations to the KHEPRA Marketplace.
              </p>
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