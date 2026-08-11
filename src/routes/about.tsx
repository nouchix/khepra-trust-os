import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { EgyptianDivider } from "@/components/egyptian-divider";
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema } from "@/components/seo-json-ld";
import { AnswerBlock, Byline, LastUpdated, FaqBlock } from "@/components/seo-blocks";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Who Is KHEPRA? SecRed Knowledge Inc. (NouchiX)" },
      { name: "description", content: "Veteran-led team building proof that your AI agents are safe and audit-ready." },
      { property: "og:title", content: "Who Is KHEPRA? SecRed Knowledge Inc. (NouchiX)" },
      { property: "og:description", content: "Veteran-led. Patent-pending signed proof, 36,195 control mappings, evidence auditors trust — not slide decks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://adinkhepra.com/about" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(buildFaqSchema(FAQS)) }],
  }),
  component: AboutPage,
});

const registrations = [
  ["DUNS", "119450090"],
  ["SAM.gov UEI", "24M6XQCZLYM7"],
  ["Set-aside", "STTR / SBIR-eligible · VOSB-pending"],
  ["Clearance", "Active DoD Secret"],
  ["IP", "Patent Pending — KHEPRA / ASAF"],
  ["Readiness", "NIST / CMMC-ready"],
];

const naics = ["541512", "541511", "541519", "561621", "SIN 54151HACS"];

const FAQS = [
  {
    question: "Who runs KHEPRA?",
    answer: "SecRed Knowledge Inc., doing business as NouchiX. It's a veteran-led company founded by Souhimbou \"Spencer\" Kone, a combat veteran with an active DoD Secret clearance.",
  },
  {
    question: "Is KHEPRA a real company or just an idea?",
    answer: "It's real. We have a DUNS number, a SAM.gov UEI, active federal registrations, a patent-pending application, and 36,195 live STIG/NIST/CMMC control mappings running in code today.",
  },
  {
    question: "Does KHEPRA have government or defense experience?",
    answer: "Yes. Our founder holds an active DoD Secret clearance and has 100% CCRI compliance success. We know DISA STIGs, CMMC, and the DoD's quantum-safe crypto deadlines cold.",
  },
  {
    question: "What proof backs KHEPRA's claims?",
    answer: "Every action gets signed with quantum-safe ML-DSA-65 and locked into a tamper-proof record chain (a DAG). You can verify it yourself instead of trusting a slide deck.",
  },
  {
    question: "Who advises KHEPRA?",
    answer: "Donnie Yancey, a growth advisor who helped scale a SaaS company from $0 to $15M a year, and Dorian Cougias of OpenControl, who gives us DISA STIG platform and API access.",
  },
];

function AboutPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", url: "https://adinkhepra.com/" },
          { name: "Company", url: "https://adinkhepra.com/about" },
        ])}
      />
      <PageHero
        eyebrow="Company overview & credibility"
        title={<>Who is behind KHEPRA? <span className="text-gradient">SecRed Knowledge Inc.</span> (NouchiX)</>}
        subtitle="A veteran-led team building the tools defense contractors and federal agencies need to stay safe from quantum threats and rogue AI agents. We deliver Compliance-as-a-Service, quantum-safe controls, and AI-agent proof that holds up with real auditors. No slide decks."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-10">
          <Byline updated="August 2026" />
          <div className="mt-6">
            <AnswerBlock>
              KHEPRA is built by SecRed Knowledge Inc. (d/b/a NouchiX), a veteran-led company with an
              active DoD Secret clearance, a DUNS/UEI registration, and a patent-pending application.
              We ship signed, quantum-safe proof of what AI agents do — 36,195 real control mappings,
              not a slide deck.
            </AnswerBlock>
          </div>
          <div className="mt-4">
            <LastUpdated date="August 2026" />
          </div>
        </div>
      </section>

      {/* Registrations */}
      <section className="border-b border-border/60">
        <div className="container-x py-14">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {registrations.map(([k, v]) => (
              <div key={k} className="surface-card p-4">
                <div className="font-mono text-[11px] uppercase tracking-widest text-primary/80">{k}</div>
                <div className="mt-1.5 text-sm text-foreground/90">{v}</div>
              </div>
            ))}
          </div>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            NAICS {naics.join(" · ")} — Highly Adaptive Cybersecurity Services
          </p>
        </div>
      </section>

      {/* Differentiators */}
      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <SectionHeading
            eyebrow="What no competitor can buy"
            title={<>What can no one else sell you?</>}
            subtitle="The core stack — KHEPRA Protocol, AdinKhepra ASAF, SouHimBou AI, and the open PQC-01-STIG (a public standard for quantum-safe crypto) — runs on real code, real mappings, and live systems today."
          />
          <div className="mt-12 grid md:grid-cols-2 gap-4">
            {[
              ["Patent-pending signed proof", "KHEPRA/ASAF signs every action with ML-DSA-65 (quantum-safe crypto) and locks it to a DAG (tamper-proof record chain). Math proves it, not a checklist someone wrote by hand."],
              ["Deep government & DoD experience", "Active Secret clearance. Real federal work. 100% CCRI compliance success. We know DISA STIGs, CMMC, and the DoD quantum-safe deadlines cold."],
              ["Control mappings you can check", "36,000+ STIG, NIST 800-53, CCI, and CMMC mappings live in real code. We check them at runtime and publish how we did it."],
              ["Works locked-down or in the cloud", "Air-gap-ready FIPS 140-3 (federal crypto standard) builds for defense and CUI environments, plus a fast, easy SaaS option for quick checks."],
            ].map(([t, d]) => (
              <Card key={t}>
                <div className="font-display text-lg font-semibold">{t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Traction */}
      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <SectionHeading
            eyebrow="Traction & past performance"
            title={<>The numbers. Not the pitch.</>}
          />
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["36,195", "STIG / NIST / CMMC mappings"],
              ["93/100", "Smithery registry score"],
              ["34", "live MCP tools"],
              ["2,316", "Smithery sessions"],
              ["1,047", "tool calls served"],
              ["99.9%", "30-day uptime"],
              ["407ms", "p50 latency"],
              ["432", "GHCR container pulls"],
            ].map(([k, v]) => (
              <div key={v} className="surface-card p-5">
                <div className="font-mono text-2xl md:text-3xl text-primary tracking-tight">{k}</div>
                <div className="mt-2 text-xs text-muted-foreground leading-relaxed">{v}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid md:grid-cols-2 gap-4">
            {[
              ["PQC-01-STIG-V1R1", "We wrote and published the first public DoD-style security standard for quantum-safe cryptography."],
              ["SUNY Research Foundation", "Active CMMC readiness support."],
              ["Smart-grid / DOE ecosystem", "We licensed a key OT network security framework and monitor AI security in the lab for smart-grid operators."],
              ["NSF I-Corps", "Completed the cohort via SUNY Albany's Innovation Center & ETEC."],
              ["Open source", "nouchix/PQC-Khepra-MCP is on GitHub. Real contributors, real activity — check it yourself."],
              ["Recognition", "Pitch Pulse Defense & Security — Top 10 Finalist."],
            ].map(([t, d]) => (
              <Card key={t}>
                <div className="font-mono text-[11px] uppercase tracking-widest text-primary/80">{t}</div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Founder + advisors */}
      <section className="border-b border-border/60">
        <div className="container-x py-20 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <Eyebrow>Founder & CEO</Eyebrow>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              Souhimbou &ldquo;Spencer&rdquo; Kone, SGT
            </h2>
            <p className="mt-2 font-mono text-sm text-primary">&ldquo;CyberSouhimbou&rdquo; · Signal Corps Sergeant (25S)</p>
            <ul className="mt-6 space-y-3">
              {[
                "Combat veteran — Operation Spartan Shield, Operation Inherent Resolve. Active Secret clearance.",
                "Former GS-11 federal employee: GS-2210-11 IT Specialist, DMNA G6/CIO.",
                "M.S. Digital Forensics candidate, UAlbany (NSA CAE-CDE).",
                "Patent-pending application — USPTO #73565085.",
                "Customer Advisory Board, STIG Viewer (OpenControl).",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-sm text-foreground/90">
                  <span className="font-mono text-primary shrink-0">—</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-5 space-y-4">
            <Eyebrow>Advisory network</Eyebrow>
            {[
              ["Donnie Yancey", "Growth advisor who helped scale a SaaS company from $0 to $15M in yearly revenue."],
              ["Dorian Cougias (OpenControl)", "Gives us the DISA STIG (defense security standard) platform and exclusive API access."],
            ].map(([n, d]) => (
              <Card key={n}>
                <div className="font-display text-lg font-semibold">{n}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <EgyptianDivider label="Partners & channels" />
          <div className="mt-10 flex flex-wrap gap-2">
            {[
              "HPE GreenLake (Tier-2 Solutions Provider)",
              "Anthropic Claude Partner Network",
              "Cloudflare CIRCL / BoringCrypto",
              "Microsoft Azure",
              "AWS",
              "Idaho National Laboratory (R&D, OT/AI security)",
              "EVO Security",
              "Indusface",
              "Guardz",
              "Heimdal",
              "OpenVPN",
              "Tehama",
              "Vaultastic",
            ].map((p) => (
              <span key={p} className="px-3 py-1.5 rounded border border-border bg-card/50 font-mono text-xs text-muted-foreground">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <SectionHeading eyebrow="Principles" title="How do we build?" />
          <div className="mt-10 grid md:grid-cols-2 gap-4">
            {[
              ["The standard comes first", "Our real contribution is the standard itself. Our products just have to prove it works."],
              ["You keep control", "You hold your own keys. You run your own ledger. You can verify it all without us."],
              ["Proof, not promises", "Every claim ties to a record you can replay and check yourself. Ours too."],
              ["Simple, trusted cryptography", "We use methods that auditors and regulators will still trust ten years from now."],
              ["Open by default", "Our specs, checkers, and reference code are open for anyone to see. We earn our keep by running it well."],
              ["We only ship what we trust", "Alpha means alpha. Production means we'd bet the company on it."],
            ].map(([t, d]) => (
              <Card key={t}>
                <div className="font-display text-lg font-semibold">{t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <FaqBlock items={FAQS} />

      <section>
        <div className="container-x py-16">
          <div className="surface-card p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Find out what your agents can reach.</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                Validation partners, MSPs, MSSPs, and teams running AI agents — book a call.
                We'll show you exactly what your agents can access and how to lock it down.
              </p>
            </div>
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
