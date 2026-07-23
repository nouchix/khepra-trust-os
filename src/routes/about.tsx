import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { EgyptianDivider } from "@/components/egyptian-divider";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — KHEPRA Trust Network" },
      { name: "description", content: "KHEPRA is building the trust operating system for autonomous work. Our mission, principles, and origin." },
      { property: "og:title", content: "About KHEPRA" },
      { property: "og:description", content: "The trust operating system for autonomous work." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title={<>We build the <span className="text-gradient">substrate</span> autonomous systems will run on.</>}
        subtitle="KHEPRA is a protocol-first company. Named for the scarab that rolls the sun into a new day, we're building the primitives that let autonomous work be trusted at scale."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-20 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <Eyebrow>Mission</Eyebrow>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              Make trust <span className="text-gradient">executable</span>.
            </h2>
          </div>
          <div className="lg:col-span-7 space-y-4">
            <p className="text-foreground/90 leading-relaxed">
              Autonomous systems are moving faster than the human processes we've relied on to trust them. Policy lives in documents. Evidence lives in log aggregators. Identity is passed as string secrets. It doesn't add up.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              KHEPRA reduces trust to primitives: cryptographic identity, policy compiled to code, provenance attached to every action, and immutable attestation on a shared DAG. We ship the protocol as an open specification and the products that make it usable on day one.
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
              <h3 className="text-2xl font-semibold tracking-tight">Want to build this with us?</h3>
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