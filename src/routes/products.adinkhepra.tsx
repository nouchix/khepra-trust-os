import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import adinImg from "@/assets/adinkhepra.jpg";
import stargateShot from "@/assets/adinkhepra-stargate-console.png.asset.json";
import { JsonLd, buildSoftwareAppSchema, buildFaqSchema, buildBreadcrumbSchema } from "@/components/seo-json-ld";
import { AnswerBlock, Byline, LastUpdated, FaqBlock, type Faq } from "@/components/seo-blocks";

const FAQS: Faq[] = [
  {
    question: "What happens if I fail a CMMC control?",
    answer: "One failed control can sink your whole assessment and cost you the contract. AdinKhepra watches every control 24/7 so a gap gets caught and fixed long before an auditor ever sees it.",
  },
  {
    question: "How many controls does AdinKhepra check?",
    answer: "It maps 36,195 checks straight from STIG to NIST to CMMC, already done for you. Nothing is left for you to figure out by hand.",
  },
  {
    question: "Does AdinKhepra write my SSP for me?",
    answer: "Yes. It writes your System Security Plan and POA&M directly from signed evidence, so the document matches what your systems actually do, not a story someone typed up.",
  },
  {
    question: "Can AdinKhepra run fully offline?",
    answer: "Yes. It's FIPS 140-3 certified and can run completely offline, so nothing about your controls or evidence ever has to leave your walls.",
  },
  {
    question: "How does AdinKhepra prove evidence wasn't faked?",
    answer: "Every control is signed with ML-DSA-65, a cryptographic lock. Auditors can replay any control at any time and get the same signed result, so no one can argue with it.",
  },
  {
    question: "Which frameworks does AdinKhepra already map to?",
    answer: "CMMC Level 1 and Level 2, NIST 800-171, NIST 800-53, and ISO 27001 are already mapped, so you don't start from a blank spreadsheet.",
  },
];

export const Route = createFileRoute("/products/adinkhepra")({
  head: () => ({
    meta: [
      { title: "AdinKhepra: Stop Failing CMMC Audits" },
      { name: "description", content: "One weak control can cost you a defense contract. AdinKhepra watches every control and signs the proof, 24/7." },
      { property: "og:title", content: "AdinKhepra: Stop Failing CMMC Audits" },
      { property: "og:description", content: "Watch every control. Sign every finding. Never walk into an audit blind again." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://adinkhepra.com/products/adinkhepra" }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(buildFaqSchema(FAQS)) },
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
          description: "AdinKhepra watches every CMMC control, signs the evidence, and writes your SSP for you.",
          url: "https://adinkhepra.com/products/adinkhepra",
          applicationCategory: "SecurityApplication",
        })}
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", url: "https://adinkhepra.com/" },
          { name: "Products", url: "https://adinkhepra.com/products/adinkhepra" },
          { name: "AdinKhepra", url: "https://adinkhepra.com/products/adinkhepra" },
        ])}
      />
      <PageHero
        eyebrow="Product 03 · AdinKhepra — ASAF Stargate"
        title={<>What stops one failed control from losing your CMMC contract? <span className="text-gradient">AdinKhepra</span> does.</>}
        subtitle="A missed control is a lost contract. AdinKhepra watches every control, all day, every day. It signs the proof so no one can argue with it. Your SSP writes itself. FIPS 140-3 (the government's crypto standard) keeps it locked down, even offline."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-8">
          <AnswerBlock>
            AdinKhepra is CMMC compliance software that watches every control 24/7, signs the evidence with ML-DSA-65, and writes your SSP and POA&M for you. It runs FIPS 140-3 certified, even fully offline, so a missed control never turns into a lost contract.
          </AnswerBlock>
          <Byline updated="August 2026" />
          <div className="mt-4">
            <LastUpdated date="August 2026" />
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["36,195", "checks mapped from STIG to NIST to CMMC, done for you"],
            ["PQC-01-STIG", "the first public defense-grade rule for future-proof crypto"],
            ["FIPS 140-3", "runs fully offline, nothing ever leaves your walls"],
            ["ML-DSA-65", "a digital lock on every single control, so no one can fake it"],
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
              How do you stop chasing evidence before every audit?
            </h2>
            <ul className="mt-6 space-y-3">
              {[
                "Watches your cloud, logins, and devices, all day, every day.",
                "Signs and time-stamps every control, so it can't be faked.",
                "Writes your SSP and POA&M for you. No more late nights.",
                "Auditors can replay any control, any time. No guessing.",
                "Already mapped to CMMC L1/L2, NIST 800-171, 800-53, and ISO 27001.",
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
          <SectionHeading
            eyebrow="Stargate console"
            title="How do you see your CMMC risk before an auditor does?"
            subtitle="This is a real screenshot of the STARGATE console. It shows your CMMC path, live findings, and the crypto locks (ML-DSA-65 / ML-KEM-768) that seal every result."
          />
          <figure className="mt-10 surface-card overflow-hidden">
            <img
              src={stargateShot.url}
              alt="AdinKhepra STARGATE console showing the CMMC compliance graph, CAT I cryptographic protection finding, cross-references, and APDL protocol snippet"
              loading="lazy"
              width={1920}
              height={1199}
              className="w-full h-auto"
            />
            <figcaption className="border-t border-border/60 px-5 py-3 font-mono text-[11px] text-muted-foreground">
              STARGATE v1.1.1 · CMMC Level 2 · 110 practices · 25,185 STIG/CCI/NIST mappings · SPRS 105
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <SectionHeading eyebrow="Capabilities" title="What will an auditor ask for, and is it ready?" />
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              ["Control library", "Every CMMC L1/L2 control mapped for you. Updated the moment rules change."],
              ["Evidence collectors", "Pulls signed proof straight from AWS, Azure, GCP, Okta, GitHub, CrowdStrike, and more."],
              ["Attested SSP", "Your SSP is locked to real evidence. No more copy-paste stories an auditor can pick apart."],
              ["POA&M workflows", "Opens findings on its own, sets owners and deadlines, and signs proof when fixed."],
              ["Auditor mode", "Give auditors a locked-down view. They can replay any control, any time. No surprises."],
              ["Continuous ATO", "Catches drift the moment it happens, after you're approved. Fixes are signed and tracked."],
            ].map(([t, d]) => (
              <Card key={t}>
                <div className="font-display text-lg font-semibold">{t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <FaqBlock items={FAQS} title="Questions people ask before an audit" />

      <section>
        <div className="container-x py-20">
          <div className="surface-card p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Is your CMMC assessment coming up fast?</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">Don't wait for a failed audit to find your gaps. Join the AdinKhepra pilot now. Design-partner slots include hands-on setup help and reviewer onboarding.</p>
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
