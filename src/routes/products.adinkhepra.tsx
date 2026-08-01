import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import adinImg from "@/assets/adinkhepra.jpg";
import stargateShot from "@/assets/adinkhepra-stargate-console.png.asset.json";
import { JsonLd, buildSoftwareAppSchema } from "@/components/seo-json-ld";

export const Route = createFileRoute("/products/adinkhepra")({
  head: () => ({
    meta: [
      { title: "AdinKhepra ASAF Stargate — Sovereign CMMC Compliance Engine" },
      { name: "description", content: "Sovereign, bare-metal CMMC compliance: continuous control monitoring, auto-generated SSPs and POA&Ms, and cryptographic attestation of every control state across 36,195 reproducible mappings." },
      { property: "og:title", content: "AdinKhepra ASAF Stargate — Sovereign CMMC Compliance Engine" },
      { property: "og:description", content: "Continuous control monitoring, auto-generated SSPs, and ML-DSA-65 attestation of every control state. Air-gap capable, FIPS 140-3." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdinKhepraPage,
});

function AdinKhepraPage() {
  return (
    <>
      <JsonLd
        data={buildSoftwareAppSchema({
          name: "AdinKhepra",
          description: "Continuous CMMC control monitoring with signed evidence, auto-generated SSPs, and cryptographic attestation of every control state.",
          url: "https://adinkhepra.com/products/adinkhepra",
          applicationCategory: "SecurityApplication",
        })}
      />
      <PageHero
        eyebrow="Product 03 · AdinKhepra — ASAF Stargate"
        title={<>Sovereign, bare-metal <span className="text-gradient">CMMC compliance</span> engine.</>}
        subtitle="Continuous control monitoring with signed evidence and auto-generated SSPs. Every control state is attested on the KHEPRA DAG — reviewer-ready, always. Air-gap capable FIPS 140-3 binaries for DIB and CUI environments, alongside SaaS for rapid assessment."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["36,195", "STIG ↔ NIST 800-53 ↔ CCI ↔ CMMC mappings"],
            ["PQC-01-STIG", "first public DoD-style STIG for post-quantum crypto"],
            ["FIPS 140-3", "air-gap capable, no phone-home"],
            ["ML-DSA-65", "signature over every control state"],
          ].map(([k, v]) => (
            <div key={v} className="surface-card p-5">
              <div className="font-mono text-xl md:text-2xl text-primary tracking-tight">{k}</div>
              <div className="mt-2 text-xs text-muted-foreground leading-relaxed">{v}</div>
            </div>
          ))}
        </div>
      </section>

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
              <h2 className="text-2xl font-semibold tracking-tight">Preparing for a CMMC assessment?</h2>
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