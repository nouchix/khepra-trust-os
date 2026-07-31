import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { EgyptianDivider } from "@/components/egyptian-divider";
import { JsonLd, buildBreadcrumbSchema } from "@/components/seo-json-ld";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Company — SecRed Knowledge Inc. (NouchiX) | KHEPRA" },
      { name: "description", content: "SecRed Knowledge Inc. d/b/a NouchiX is a veteran-led cybersecurity and sovereign engineering firm building post-quantum compliance and agentic security infrastructure for the DIB, federal agencies, and critical infrastructure." },
      { property: "og:title", content: "Company — SecRed Knowledge Inc. (NouchiX) | KHEPRA" },
      { property: "og:description", content: "Veteran-led. Patent-pending PQC attestation, 36,195 reproducible control mappings, sovereign and SaaS delivery. Auditor-ready evidence — not slide decks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://adinkhepra.com/about" }],
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

export default function _unused() { return null; }

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
        title={<>SecRed Knowledge Inc. <span className="text-gradient">d/b/a NouchiX</span></>}
        subtitle="A veteran-led cybersecurity and sovereign engineering firm building the post-quantum compliance and agentic security infrastructure required by the Defense Industrial Base, federal agencies, and critical infrastructure operators. We deliver Compliance-as-a-Service, post-quantum cryptographic controls, and AI-agent attestation platforms that produce auditor-ready evidence — not slide decks."
      />

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
            title={<>Four things that are not <span className="text-gradient">procurable</span>.</>}
            subtitle="The core stack — KHEPRA Protocol, AdinKhepra ASAF, SouHimBou AI, and the open PQC-01-STIG — is grounded in production code, reproducible control mappings, and live deployments."
          />
          <div className="mt-12 grid md:grid-cols-2 gap-4">
            {[
              ["Patent-pending PQC attestation", "KHEPRA/ASAF produces ML-DSA-65 signed, DAG-anchored evidence objects — mathematical proof instead of narrative checklists."],
              ["Government & DoD depth", "Active Secret clearance, GS-2210 federal experience, 100% CCRI compliance success, and working familiarity with DISA STIGs, CMMC, and the DoD PQC Strategy deadlines."],
              ["Reproducible control mappings", "36,000+ STIG ↔ NIST 800-53 ↔ CCI ↔ CMMC mappings maintained in production code, with runtime validation and public methodology."],
              ["Sovereign + SaaS dual profile", "Air-gap-capable FIPS 140-3 binaries for DIB and CUI environments, alongside a developer-friendly SaaS for rapid assessment."],
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
            title={<>Measured, not marketed.</>}
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
              ["PQC-01-STIG-V1R1", "Authored and published the first publicly available DoD-style STIG for post-quantum cryptography."],
              ["SUNY Research Foundation", "Active CMMC readiness support."],
              ["Smart-grid / DOE ecosystem", "Licensed a critical OT network security framework and provide laboratory AI security monitoring for smart-grid operators."],
              ["NSF I-Corps", "Completed the cohort via SUNY Albany's Innovation Center & ETEC."],
              ["Open source", "nouchix/PQC-Khepra-MCP on GitHub, with active multi-contributor development."],
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
              ["Donnie Yancey", "GTM & operational scaling advisor — scaled a SaaS company from $0 to $15M ARR."],
              ["Dorian Cougias (OpenControl)", "DISA STIG platform and exclusive API access."],
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
          <SectionHeading eyebrow="Principles" title="How we build." />
          <div className="mt-10 grid md:grid-cols-2 gap-4">
            {[
              ["Protocol over product", "Our long-term contribution is the standard. Products earn their keep by proving it works."],
              ["Sovereignty is table stakes", "Customers must be able to hold their own keys, run their own ledger, and verify without us."],
              ["Evidence, not vibes", "Every claim is anchored to a replayable artifact — including our own product claims."],
              ["Boring cryptography", "Primitives that regulators, auditors, and standards bodies will still respect in ten years."],
              ["Open by default", "Specifications, verifiers, and reference implementations are open. Value accrues to operations and ecosystem."],
              ["Ship with discipline", "Alpha means alpha. Production means we'd bet the company on it."],
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
        <div className="container-x py-16">
          <div className="surface-card p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Book a briefing.</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                Validation partners, MSPs/MSSPs, and teams shipping AI agents — we'll model your agent
                authority surface against an enforcement boundary.
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
