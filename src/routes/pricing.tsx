import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card } from "@/components/section";
import { Check, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Enterprise & Alpha | KHEPRA" },
      { name: "description", content: "KHEPRA Trust Network pricing for alpha, growth, and enterprise deployments." },
      { property: "og:title", content: "KHEPRA Pricing" },
      { property: "og:description", content: "Alpha, growth, and enterprise plans for the KHEPRA Trust Network." },
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
    body: "Design-partner access to the KHEPRA protocol, one product (AdinKhepra or SouHimBou), and shared support.",
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
    body: "For teams shipping autonomous workflows into production with full attestation and evidence exports.",
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
    body: "Sovereign or hybrid deployments, dedicated infrastructure, and named architects for regulated operations.",
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
        eyebrow="Pricing"
        title={<>Priced for <span className="text-gradient">attestation volume</span>, not seats you don't use.</>}
        subtitle="KHEPRA is metered on signed attestations and connectors, not per-user tax. Alpha access is free for design partners; enterprise deployments are quoted for the topology you actually run."
      />

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

      <section>
        <div className="container-x py-16">
          <SectionHeading eyebrow="What counts as an attestation?" title="Straightforward metering." />
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[
              ["Signed envelopes", "Any authorized action written to the DAG counts as one attestation."],
              ["Bundled reviews", "Reviewer actions and evidence exports are unmetered."],
              ["No seat tax", "Add auditors, engineers, and partners without per-seat billing surprises."],
            ].map(([t, d]) => (
              <Card key={t}>
                <div className="font-display font-semibold">{t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}