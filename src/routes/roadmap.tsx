import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Card, Eyebrow } from "@/components/section";
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema } from "@/components/seo-json-ld";
import { AnswerBlock, Byline, LastUpdated, FaqBlock } from "@/components/seo-blocks";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "What Is KHEPRA Building Next? Roadmap" },
      { name: "description", content: "See what KHEPRA is building next to keep your AI agents safe, proven, and audit-ready." },
      { property: "og:title", content: "What Is KHEPRA Building Next? Roadmap" },
      { property: "og:description", content: "See what KHEPRA is building next to keep your AI agents safe, proven, and audit-ready." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://adinkhepra.com/roadmap" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(buildFaqSchema(FAQS)) }],
  }),
  component: RoadmapPage,
});

const phases = [
  {
    q: "Now · Q3 2026",
    tag: "Alpha",
    title: "Protocol v0.1 & flagship products",
    items: [
      "KHEPRA Protocol v0.1 draft published",
      "PQC-hybrid identity with HSM-backed roots",
      "Policy engine (OPA/Rego bundles) with obligations",
      "AdinKhepra CMMC Autopilot — design-partner cohort",
      "SouHimBou AI recorder — private alpha",
    ],
  },
  {
    q: "Q4 2026",
    tag: "Beta",
    title: "Runtime, connectors & evidence exports",
    items: [
      "Agent runtime GA with Python and TypeScript SDKs",
      "20+ certified connectors (cloud, identity, data, models)",
      "SIEM & GRC exporters (Splunk, Chronicle, Vanta, Drata)",
      "AdinKhepra: reviewer portal + continuous ATO mode",
      "SouHimBou: drift detection + incident replay UI",
    ],
  },
  {
    q: "Q1 2027",
    tag: "GA",
    title: "Marketplace & federation",
    items: [
      "KHEPRA Marketplace: signed third-party connectors and policy bundles",
      "Cross-tenant federation of attestation graphs",
      "Delegated identity for multi-org agent workflows",
      "AdinKhepra: FedRAMP Moderate authorization workflows",
      "Open reference verifier and independent auditors program",
    ],
  },
  {
    q: "Q2 2027+",
    tag: "Horizon",
    title: "Open standard & ecosystem",
    items: [
      "Protocol v1.0 submission to standards body",
      "Independent implementations by ecosystem partners",
      "Cross-network attestation bridges",
      "Marketplace revenue share for connector publishers",
    ],
  },
];

const FAQS = [
  {
    question: "What is KHEPRA building next?",
    answer: "Right now: Protocol v0.1, PQC-hybrid identity, and private alphas for AdinKhepra CMMC Autopilot and SouHimBou AI. Next up: agent runtime GA, 20+ certified connectors, and SIEM/GRC exporters.",
  },
  {
    question: "When does KHEPRA reach general availability?",
    answer: "We're targeting Q1 2027 GA, which brings the KHEPRA Marketplace for signed connectors, cross-tenant federation, and FedRAMP Moderate authorization workflows for AdinKhepra.",
  },
  {
    question: "Will KHEPRA become an open standard?",
    answer: "Yes, that's the plan for Q2 2027 and beyond — submitting Protocol v1.0 to a standards body and supporting independent implementations by ecosystem partners.",
  },
  {
    question: "How do I get early access to new KHEPRA features?",
    answer: "AdinKhepra CMMC Autopilot and SouHimBou AI are both running design-partner and private-alpha cohorts now. Book a call on the contact page to ask about joining one.",
  },
  {
    question: "Does the roadmap change?",
    answer: "It can. KHEPRA builds in the open, so this page tracks every milestone and release honestly, including when dates shift.",
  },
];

function RoadmapPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", url: "https://adinkhepra.com/" },
          { name: "Roadmap", url: "https://adinkhepra.com/roadmap" },
        ])}
      />
      <PageHero
        eyebrow="Roadmap"
        title={<>What is <span className="text-gradient">KHEPRA</span> building next?</>}
        subtitle="KHEPRA builds in the open. This page tracks every milestone, release, and new tool we ship."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-10">
          <Byline updated="August 2026" />
          <div className="mt-6">
            <AnswerBlock>
              We're in alpha now with Protocol v0.1, PQC-hybrid identity, and private cohorts for
              AdinKhepra and SouHimBou AI. Beta lands Q4 2026 with runtime GA and 20+ connectors.
              GA and the open Marketplace ship Q1 2027, with an open standard submission after that.
            </AnswerBlock>
          </div>
          <div className="mt-4">
            <LastUpdated date="August 2026" />
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20 space-y-6">
          {phases.map((p) => (
            <Card key={p.q} className="grid md:grid-cols-12 gap-6">
              <div className="md:col-span-3">
                <Eyebrow>{p.tag}</Eyebrow>
                <div className="mt-3 font-mono text-sm text-primary">{p.q}</div>
                <h2 className="mt-2 font-display text-xl font-semibold">{p.title}</h2>
              </div>
              <ul className="md:col-span-9 grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-foreground/90">
                {p.items.map((it) => (
                  <li key={it} className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <FaqBlock items={FAQS} />
    </>
  );
}
