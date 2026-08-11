import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { TrustGraph } from "@/components/trust-graph";
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema } from "@/components/seo-json-ld";
import { AnswerBlock, Byline, FaqBlock, LastUpdated, type Faq } from "@/components/seo-blocks";
import { ArrowRight, Award, Globe2, Network, ShieldCheck } from "lucide-react";

const FAQS: Faq[] = [
  {
    question: "What is the KHEPRA Trust Network?",
    answer:
      "It's a growing network of companies, auditors, and vendors that create and check signed proof on one shared system. Every member keeps its own ledger and publishes records anyone can check, with no middleman needed.",
  },
  {
    question: "How does federation work without a middleman?",
    answer:
      "Every company on the network keeps its own ledger and publishes records anyone can check. Records link to each other by a content hash, not a trusted API, so proof holds up even across company lines.",
  },
  {
    question: "What are the four ways to join the Trust Network?",
    answer:
      "Certified Publisher, Attested Auditor, Regional Anchor, and Federation Peer. Each program checks a different part of the network: connectors and skills, audit findings, local proof anchors, and cross-company proof exchange.",
  },
  {
    question: "Who is already building with KHEPRA?",
    answer:
      "Design partners, launch collaborators, and integrations in progress span cloud, identity, data, and model providers. Certification status varies by partner, so contact us for the current registry.",
  },
  {
    question: "How do I apply to join the Trust Network?",
    answer:
      "Start an application through our contact form. We review your fit, onboard you, and help plan your launch on the network.",
  },
];

export const Route = createFileRoute("/trust-network")({
  head: () => ({
    meta: [
      { title: "What Is the KHEPRA Trust Network?" },
      { name: "description", content: "The KHEPRA Trust Network links signed proof and rules across companies, vendors, and borders." },
      { property: "og:title", content: "What Is the KHEPRA Trust Network?" },
      { property: "og:description", content: "The KHEPRA Trust Network links signed proof and rules across companies, vendors, and borders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://adinkhepra.com/trust-network" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(buildFaqSchema(FAQS)) }],
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
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", url: "https://adinkhepra.com/" },
          { name: "Trust Network", url: "https://adinkhepra.com/trust-network" },
        ])}
      />
      <PageHero
        eyebrow="The Trust Network"
        title={<>What is the KHEPRA Trust Network? <span className="text-gradient">Proof, without a middleman.</span></>}
        subtitle="A growing network of companies, auditors, and vendors that create and check signed proof on one shared system."
      />

      <div className="container-x pt-10">
        <AnswerBlock>
          The KHEPRA Trust Network is a network of companies, auditors, and vendors that create
          and check signed proof on one shared system, with no middleman needed. Each member
          keeps its own ledger. Records link by content hash, so proof holds up even across
          company lines.
        </AnswerBlock>
        <Byline updated="August 2026" />
      </div>

      <section className="border-b border-border/60">
        <div className="container-x py-20 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <Eyebrow>How federation works</Eyebrow>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              How does proof move across companies without a middleman?
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
          <SectionHeading eyebrow="Certification programs" title="What are the four ways to join the network?" />
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
          <SectionHeading eyebrow="Ecosystem" title="Who is building alongside KHEPRA?" subtitle="Design partners, launch collaborators, and integrations in progress." />
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

      <FaqBlock items={FAQS} />

      <section>
        <div className="container-x py-20">
          <div className="surface-card p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">How do I join the Trust Network?</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">We review your fit, onboard you, and help plan your launch.</p>
              <div className="mt-4">
                <LastUpdated date="August 2026" />
              </div>
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
