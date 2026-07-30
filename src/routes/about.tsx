import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { EgyptianDivider } from "@/components/egyptian-divider";
import { JsonLd, buildBreadcrumbSchema } from "@/components/seo-json-ld";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — KHEPRA Autonomous Governance Platform" },
      { name: "description", content: "KHEPRA builds cryptographic governance for autonomous systems: bounded privilege, fail-closed actuation, and verifiable evidence for every state transition." },
      { property: "og:title", content: "About — KHEPRA Autonomous Governance Platform" },
      { property: "og:description", content: "KHEPRA builds cryptographic governance for autonomous systems: bounded privilege, fail-closed actuation, and verifiable evidence for every state transition." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://adinkhepra.com/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", url: "https://adinkhepra.com/" },
          { name: "About", url: "https://adinkhepra.com/about" },
        ])}
      />
      <PageHero
        eyebrow="About KHEPRA"
        title={<>About — KHEPRA Autonomous <span className="text-gradient">Governance</span> Platform</>}
        subtitle="KHEPRA is a protocol-first company. Named for the scarab that rolls the sun into a new day, we're building the cryptographic governance primitives that let autonomous systems act — under bounded privilege, with provable evidence of every state transition."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-20 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <Eyebrow>Mission</Eyebrow>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              Replace trust with <span className="text-gradient">proof</span>.
            </h2>
          </div>
          <div className="lg:col-span-7 space-y-4">
            <p className="text-foreground/90 leading-relaxed">
              Autonomous systems act faster than the human processes we've relied on to trust them. Agents hold unbounded privilege. Policy lives in documents. Evidence lives in log aggregators. There is no cryptographic broker between an agent's intent and the world it is about to change.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              KHEPRA reduces governance to primitives: Governed State Transitions, canonical Agent Evidence Objects, and the ASAF Runtime — a privileged governance kernel that authorizes, actuates, verifies, and attests every autonomous action. We ship the protocol as an open specification and the products that make it usable on day one.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <EgyptianDivider label="Principles" />
          <div className="mt-10 grid md:grid-cols-2 gap-4">
            {[
              ["Protocol over product", "Our long-term contribution is the standard. Products earn their keep by proving it works."],
              ["Sovereignty is table stakes", "Customers must be able to hold their own keys, run their own ledger, and verify without us."],
              ["Evidence, not vibes", "Every claim we make is anchored to a replayable artifact — including our own product claims."],
              ["Boring cryptography", "We choose primitives that regulators, auditors, and standards bodies will still respect in ten years."],
              ["Open by default", "Specifications, verifiers, and reference implementations are open. Value accrues to operations and ecosystem."],
              ["Ship with discipline", "Alpha means alpha. GA means we'd bet the company on it."],
            ].map(([t, d]) => (
              <Card key={t}>
                <div className="font-display text-lg font-semibold">{t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <SectionHeading eyebrow="Origin" title="From compliance sprints to a trust plane." />
          <div className="mt-8 max-w-3xl space-y-4 text-muted-foreground leading-relaxed">
            <p>
              KHEPRA started with a simple observation: every serious CMMC or ISO engagement ended the same way — a heroic evidence hunt across half a dozen consoles, followed by narratives no one could independently verify. AI-powered agents were about to make that ten times worse.
            </p>
            <p>
              We built AdinKhepra to fix the compliance side, and SouHimBou AI to record what agents were actually doing. Then we noticed they wanted to share the same substrate: signed identity, policy, provenance, attestation. That substrate is the KHEPRA Protocol.
            </p>
            <p>
              Today we're a small team of protocol engineers, cryptographers, and former compliance operators building in the open with a growing group of design partners.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="container-x py-16">
          <div className="surface-card p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Want to build this with us?</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">We hire protocol engineers, cryptographers, and design partners.</p>
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