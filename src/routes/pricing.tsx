import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card } from "@/components/section";
import { AnswerBlock, Byline, FaqBlock, LastUpdated } from "@/components/seo-blocks";
import { buildFaqSchema, buildBreadcrumbSchema } from "@/components/seo-json-ld";
import { Check, ArrowRight } from "lucide-react";

const FAQS = [
  {
    question: "How much does KHEPRA cost?",
    answer:
      "Alpha access is free while we build with early testers. Growth plans start from $2,900 a month once the product is generally available. Enterprise is a custom quote based on how you run — cloud, hybrid, or air-gapped.",
  },
  {
    question: "What counts as an attestation?",
    answer:
      "Every approved action written to the signed record counts as one attestation. Reviewing actions and exporting evidence never costs extra, and there is no per-seat tax.",
  },
  {
    question: "Do I have to pay per seat?",
    answer:
      "No. Add auditors, engineers, and partners without a surprise bill. You pay for signed proof and connections, not for every person who needs to see it.",
  },
  {
    question: "Can I try KHEPRA before I pay?",
    answer:
      "Yes. Apply for the free Alpha tier to get one environment, five seats, and up to 1M attestations a month while we build the product together.",
  },
  {
    question: "What's included in Enterprise plans?",
    answer:
      "Unlimited environments and seats, hybrid or air-gapped deployment, your own HSM or KMS, FedRAMP-aligned options, 24×7 support, a named architect, and an independent verifier for audit-ready evidence.",
  },
];

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "KHEPRA Pricing — Alpha, Growth, Enterprise" },
      { name: "description", content: "See KHEPRA pricing: free Alpha access, Growth from $2,900/mo, and custom Enterprise plans with no per-seat tax." },
      { property: "og:title", content: "KHEPRA Pricing — Alpha, Growth, Enterprise" },
      { property: "og:description", content: "You pay for signed proof and connections, not a tax on every seat." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://adinkhepra.com/pricing" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          buildBreadcrumbSchema([
            { name: "Home", url: "https://adinkhepra.com/" },
            { name: "Pricing", url: "https://adinkhepra.com/pricing" },
          ])
        ),
      },
      { type: "application/ld+json", children: JSON.stringify(buildFaqSchema(FAQS)) },
    ],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: "Alpha",
    tag: "By invitation",
    price: "Free",
    period: "during alpha",
    body: "Get early access to KHEPRA. Help us build it. Use one product (AdinKhepra or SouHimBou) and get shared support.",
    features: [
      "1 environment · 5 seats",
      "Managed KHEPRA Cloud (US or EU)",
      "Up to 1M attestations / month",
      "Community + design-partner Slack",
    ],
    cta: "Apply to alpha",
    highlighted: false,
  },
  {
    name: "Growth",
    tag: "Q4 2026",
    price: "From $2,900",
    period: "per month",
    body: "For teams putting AI agents into real production, with full proof and evidence you can export.",
    features: [
      "3 environments · 25 seats",
      "Both AdinKhepra + SouHimBou",
      "Up to 25M attestations / month",
      "SIEM & GRC exporters",
      "Business-hours support",
    ],
    cta: "Notify me",
    highlighted: true,
  },
  {
    name: "Enterprise",
    tag: "Custom",
    price: "Talk to us",
    period: "annual contract",
    body: "For regulated companies. Run it on your own systems or hybrid, with dedicated help and a named expert on your account.",
    features: [
      "Unlimited environments & seats",
      "Hybrid, sovereign, or air-gapped topology",
      "Bring your own HSM / KMS",
      "FedRAMP-aligned deployment options",
      "24×7 support · SLAs · named architect",
      "Independent verifier + audit-ready evidence",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];

function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing & Tiers"
        title={<>How Much Does <span className="text-gradient">KHEPRA</span> Cost? Free Alpha, Then Plans That Fit How You Run.</>}
        subtitle="You pay for signed proof and connections, not a tax on every seat. Alpha access is free for early testers. Enterprise plans are quoted for how you actually run."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-12">
          <AnswerBlock>
            Alpha access is free right now for early testers. Growth plans start at $2,900 a month once
            KHEPRA is generally available. Enterprise is a custom quote for regulated teams that need
            hybrid or air-gapped deployment. There is no per-seat tax — you pay for signed proof, not
            for who gets to see it.
          </AnswerBlock>
          <Byline updated="August 2026" />
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-16">
          <SectionHeading
            eyebrow="Why pricing confuses buyers"
            title="Most vendors charge you for every seat. That gets expensive fast."
          />
          <p className="mt-6 max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Teams tell us the same thing: they need auditors, engineers, and partners to see proof, but
            per-seat pricing punishes them for including the right people. That gap costs real budget and
            slows down every review. KHEPRA charges for attestations, not people.
          </p>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-16 grid md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`surface-card p-8 flex flex-col ${p.highlighted ? "border-primary/60 relative" : ""}`}
            >
              {p.highlighted && (
                <div className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary-foreground">
                  Most requested
                </div>
              )}
              <div className="font-mono text-[11px] uppercase tracking-widest text-primary/80">{p.tag}</div>
              <div className="mt-2 font-display text-2xl font-semibold">{p.name}</div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-4xl font-semibold">{p.price}</span>
                <span className="text-xs text-muted-foreground">{p.period}</span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              <ul className="mt-6 space-y-2 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className={`mt-8 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                  p.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border text-foreground hover:bg-card"
                }`}
              >
                {p.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-16">
          <SectionHeading eyebrow="What counts as an attestation?" title="No confusing math." />
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[
              ["Signed envelopes", "Every approved action that gets written to the record counts as one attestation."],
              ["Bundled reviews", "Reviewing actions and exporting evidence never costs you extra."],
              ["No seat tax", "Add auditors, engineers, and partners. No surprise bill for extra seats."],
            ].map(([t, d]) => (
              <Card key={t}>
                <div className="font-display font-semibold">{t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <FaqBlock items={FAQS} />

      <section>
        <div className="container-x py-16 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
              Ready to see your price?
            </h2>
            <p className="mt-2 text-muted-foreground">Apply free, or ask for a quote that matches how you run.</p>
            <LastUpdated date="August 2026" />
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Talk to sales
          </Link>
        </div>
      </section>
    </>
  );
}
