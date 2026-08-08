import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { TrustGraph } from "@/components/trust-graph";
import { ArrowRight, Award, Globe2, Network, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/trust-network")({
  head: () => ({
    meta: [
      { title: "The Trust Network — Federated Attestation | KHEPRA" },
      { name: "description", content: "The KHEPRA Trust Network links signed proof and rules across companies, vendors, and borders." },
      { property: "og:title", content: "The Trust Network — Federated Attestation | KHEPRA" },
      { property: "og:description", content: "The KHEPRA Trust Network links signed proof and rules across companies, vendors, and borders." },
    ],
  }),
  component: TrustNetworkPage,
});

const partners = [
  "Anchore", "Chainguard", "HashiCorp", "Snowflake", "Databricks", "Okta",
  "CrowdStrike", "Wiz", "Snyk", "Datadog", "Splunk", "ServiceNow",
  "OpenAI", "Anthropic", "Mistral", "Cohere", "Vanta", "Drata",
];

const programs = [
  { Icon: Award, t: "Certified Publisher", d: "Check connectors, rule bundles, and agent skills before they go live on the KHEPRA Marketplace." },
  { Icon: ShieldCheck, t: "Attested Auditor", d: "Independent audit firms trained to read ASAF evidence packages and review findings." },
  { Icon: Globe2, t: "Regional Anchor", d: "Run a local proof anchor in your own region, holding your own keys." },
  { Icon: Network, t: "Federation Peer", d: "Exchange proof across companies with real contracts and real cryptographic guarantees." },
];

function TrustNetworkPage() {
  return (
    <>
      <PageHero
        eyebrow="The Trust Network"
        title={<>The Trust Network — Federated Attestation | <span className="text-gradient">KHEPRA</span></>}
        subtitle="KHEPRA is more than a product. It's a growing network of companies, auditors, and vendors that create and check signed proof on one shared system — no middleman needed."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-20 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <Eyebrow>How federation works</Eyebrow>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              Proof, without a middleman.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Every company on the network keeps its own ledger and publishes records anyone can check. Records link to each other by a content hash, not a trusted API. That means the proof holds up even across company lines.
            </p>
          </div>
          <div className="lg:col-span-7 surface-card p-4 md:p-8">
            <TrustGraph />
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <SectionHeading eyebrow="Certification programs" title="Four ways to join." />
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {programs.map(({ Icon, t, d }) => (
              <Card key={t}>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/30">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="mt-5 font-display text-lg font-semibold">{t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <SectionHeading eyebrow="Ecosystem" title="Building alongside." subtitle="Design partners, launch collaborators, and integrations in progress." />
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {partners.map((p) => (
              <div
                key={p}
                className="surface-card px-4 py-6 flex items-center justify-center text-center"
              >
                <div className="font-display text-sm font-semibold text-foreground/85">{p}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground font-mono">
            Logos are illustrative of the target ecosystem; certification status varies. Contact us for the current registry.
          </p>
        </div>
      </section>

      <section>
        <div className="container-x py-20">
          <div className="surface-card p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Apply to join the Trust Network.</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">We review your fit, onboard you, and help plan your launch.</p>
            </div>
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Start application <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}