import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { TrustGraph } from "@/components/trust-graph";
import { ArrowRight, Award, Globe2, Network, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/trust-network")({
  head: () => ({
    meta: [
      { title: "The Trust Network — Federated Attestation | KHEPRA" },
      { name: "description", content: "The KHEPRA Trust Network federates cryptographic attestation across organizations, vendors, and jurisdictions." },
      { property: "og:title", content: "The KHEPRA Trust Network" },
      { property: "og:description", content: "Federated attestation across organizations and vendors." },
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
  { Icon: Award, t: "Certified Publisher", d: "Vet connectors, policy bundles, and agent skills for signed distribution on the KHEPRA Marketplace." },
  { Icon: ShieldCheck, t: "Attested Auditor", d: "Independent audit firms trained on ASAF evidence packages and reviewer workflows." },
  { Icon: Globe2, t: "Regional Anchor", d: "Operate a regional attestation anchor in your jurisdiction with sovereign key custody." },
  { Icon: Network, t: "Federation Peer", d: "Cross-tenant attestation exchange with contractual and cryptographic guarantees." },
];

function TrustNetworkPage() {
  return (
    <>
      <PageHero
        eyebrow="The Trust Network"
        title={<>A federation of <span className="text-gradient">verifiable</span> actors.</>}
        subtitle="KHEPRA is more than a product. It's a growing network of organizations, auditors, and vendors that emit and verify signed evidence on a shared protocol — no privileged intermediary required."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-20 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <Eyebrow>How federation works</Eyebrow>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              Attestation, without a middleman.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Every network participant anchors its own ledger and publishes verifiable envelopes. Cross-tenant exchanges reference each other by content hash, not by trusted API — so lineage crosses organizational boundaries without breaking.
            </p>
          </div>
          <div className="lg:col-span-7 surface-card p-4 md:p-8">
            <TrustGraph />
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <SectionHeading eyebrow="Certification programs" title="Four ways to participate." />
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
              <h3 className="text-2xl font-semibold tracking-tight">Apply to the Trust Network.</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">Certification review, technical onboarding, and go-to-market alignment.</p>
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