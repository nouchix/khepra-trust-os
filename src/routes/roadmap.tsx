import { createFileRoute } from "@tanstack/react-router";
import { PageHero, Card, Eyebrow } from "@/components/section";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap — KHEPRA Trust Network" },
      { name: "description", content: "The KHEPRA protocol and product roadmap: identity, attestation, agent runtime, marketplace, and open standards." },
      { property: "og:title", content: "KHEPRA Roadmap" },
      { property: "og:description", content: "Where the KHEPRA Trust Network is headed." },
    ],
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

function RoadmapPage() {
  return (
    <>
      <PageHero
        eyebrow="Roadmap"
        title={<>Building the trust plane, phase by phase.</>}
        subtitle="KHEPRA ships in the open. This roadmap tracks protocol milestones, product releases, and ecosystem work."
      />

      <section>
        <div className="container-x py-20 space-y-6">
          {phases.map((p) => (
            <Card key={p.q} className="grid md:grid-cols-12 gap-6">
              <div className="md:col-span-3">
                <Eyebrow>{p.tag}</Eyebrow>
                <div className="mt-3 font-mono text-sm text-primary">{p.q}</div>
                <h3 className="mt-2 font-display text-xl font-semibold">{p.title}</h3>
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
    </>
  );
}