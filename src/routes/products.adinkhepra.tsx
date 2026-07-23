import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import adinImg from "@/assets/adinkhepra.jpg";

export const Route = createFileRoute("/products/adinkhepra")({
  head: () => ({
    meta: [
      { title: "AdinKhepra — CMMC Compliance Autopilot & Attestation Engine" },
      { name: "description", content: "Continuous CMMC control monitoring with signed evidence, auto-generated SSPs, and cryptographic attestation of every control state." },
      { property: "og:title", content: "AdinKhepra — CMMC Compliance Autopilot" },
      { property: "og:description", content: "Continuous CMMC controls with cryptographic attestation, on the KHEPRA Trust Network." },
    ],
  }),
  component: AdinKhepraPage,
});

function AdinKhepraPage() {
  return (
    <>
      <PageHero
        eyebrow="Product 01 · AdinKhepra"
        title={<>CMMC compliance, on <span className="text-gradient">autopilot</span>.</>}
        subtitle="Continuous control monitoring with signed evidence and auto-generated SSPs. Every control state is attested on the KHEPRA DAG — reviewer-ready, always."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-16 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 surface-card overflow-hidden">
            <img src={adinImg} alt="AdinKhepra compliance dashboard" loading="lazy" width={1400} height={800} className="w-full h-auto" />
          </div>
          <div className="lg:col-span-6">
            <Eyebrow>What it does</Eyebrow>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              From framework to evidence in one loop.
            </h2>
            <ul className="mt-6 space-y-3">
              {[
                "Continuous evidence collection across cloud, identity, and endpoint.",
                "Signed control-state attestations, timestamped on the trust DAG.",
                "Auto-generated System Security Plans (SSP) and POA&M.",
                "Reviewer portal with per-control replay of collected evidence.",
                "Mapped to CMMC L1/L2, NIST 800-171, 800-53, and ISO 27001.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/90">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <SectionHeading eyebrow="Capabilities" title="Built for regulated operations." />
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              ["Control library", "Prebuilt mappings for CMMC L1/L2 with delta tracking as frameworks evolve."],
              ["Evidence collectors", "Signed collectors for AWS, Azure, GCP, Okta, GitHub, CrowdStrike, and more."],
              ["Attested SSP", "Every SSP section anchored to underlying DAG evidence — no more copy-paste narratives."],
              ["POA&M workflows", "Auto-open findings with owners, deadlines, and cryptographic closure receipts."],
              ["Auditor mode", "Read-only reviewer portal with replay of every control state at any point in time."],
              ["Continuous ATO", "Post-authorization drift detection with attested remediation history."],
            ].map(([t, d]) => (
              <Card key={t}>
                <div className="font-display text-lg font-semibold">{t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container-x py-20">
          <div className="surface-card p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">Preparing for a CMMC assessment?</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">Join the AdinKhepra pilot cohort. Design-partner slots include implementation support and reviewer onboarding.</p>
            </div>
            <Link to="/developers" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Join pilot <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}