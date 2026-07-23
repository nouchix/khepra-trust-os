import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { KeyRound, Shield, Fingerprint, GitBranch, ScrollText, Cpu, Boxes, Plug } from "lucide-react";

export const Route = createFileRoute("/platform")({
  head: () => ({
    meta: [
      { title: "Platform Architecture — KHEPRA Trust Network" },
      { name: "description", content: "Modular trust platform: PQC identity, policy engine, evidence recorder, agent runtime, certified connectors, and marketplace." },
      { property: "og:title", content: "KHEPRA Platform Architecture" },
      { property: "og:description", content: "The modular architecture of the KHEPRA Trust Network." },
    ],
  }),
  component: PlatformPage,
});

const layers = [
  {
    Icon: Plug,
    name: "Certified Connectors",
    role: "Edge",
    body: "Signed integrations to cloud, identity, data, ticketing, and model providers. Each connector ships with a manifest declaring capabilities, data classes, and required policies.",
  },
  {
    Icon: Cpu,
    name: "Agent Runtime",
    role: "Execution",
    body: "Sandboxed executor for AI agents and workflows. Mediates every tool call, inspects I/O, and pins actions to a signed session identity.",
  },
  {
    Icon: Shield,
    name: "Policy Engine",
    role: "Control",
    body: "OPA/Rego bundles versioned per environment. Deterministic allow/deny with obligations (masking, review, quorum) attached to authorized actions.",
  },
  {
    Icon: KeyRound,
    name: "PQC Identity",
    role: "Root of trust",
    body: "Hybrid ML-DSA + Ed25519 keys per actor, workload, and tool. HSM-backed roots. Delegation graph for on-behalf-of chains.",
  },
  {
    Icon: Fingerprint,
    name: "Provenance Fabric",
    role: "Lineage",
    body: "Hashes every input, retrieval, and output. Cross-references parent actions to build a queryable causal graph across systems.",
  },
  {
    Icon: GitBranch,
    name: "DAG Attestation Ledger",
    role: "Immutable state",
    body: "Append-only, hash-linked DAG of signed envelopes. Tamper-evident, distributable, and independently verifiable.",
  },
  {
    Icon: ScrollText,
    name: "Evidence Recorder",
    role: "Governance",
    body: "Structured evidence packages for audits, IR, and model risk. Exports to SIEM, GRC, and reviewer portals.",
  },
  {
    Icon: Boxes,
    name: "Marketplace",
    role: "Ecosystem",
    body: "Coming with Q4 rollout: certified third-party connectors, policy bundles, and agent skills — signed by publisher and vetted by KHEPRA.",
  },
];

function PlatformPage() {
  return (
    <>
      <PageHero
        eyebrow="Platform Architecture"
        title={<>A modular trust platform, not a monolith.</>}
        subtitle="KHEPRA is composed of eight interoperable layers. Adopt them incrementally, replace what you must, and keep every action on a shared cryptographic substrate."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {layers.map(({ Icon, name, role, body }) => (
              <Card key={name} className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/30">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/80">
                    {role}
                  </span>
                </div>
                <div className="mt-5 font-display text-lg font-semibold">{name}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <SectionHeading
            eyebrow="Stack diagram"
            title="How the layers compose."
          />
          <div className="mt-10 surface-card p-6 md:p-10">
            <pre className="font-mono text-[12px] md:text-[13px] leading-relaxed text-foreground/85 overflow-x-auto">{`┌──────────────────────────────────────────────────────────────┐
│  MARKETPLACE   connectors · policies · agent skills          │
├──────────────────────────────────────────────────────────────┤
│  PRODUCTS      AdinKhepra   ·   SouHimBou AI   ·   Partners  │
├──────────────────────────────────────────────────────────────┤
│  EVIDENCE      recorder · replay · audit · GRC export        │
├──────────────────────────────────────────────────────────────┤
│  ATTESTATION   DAG ledger · hash-linked · verifiable         │
├──────────────────────────────────────────────────────────────┤
│  PROVENANCE    lineage · input/output hashes · causal graph  │
├──────────────────────────────────────────────────────────────┤
│  POLICY        OPA / Rego bundles · obligations · quorum     │
├──────────────────────────────────────────────────────────────┤
│  RUNTIME       sandboxed agents · mediated tools · sessions  │
├──────────────────────────────────────────────────────────────┤
│  IDENTITY      PQC-hybrid keys · delegation · HSM roots      │
├──────────────────────────────────────────────────────────────┤
│  CONNECTORS    cloud · identity · data · models · tickets    │
└──────────────────────────────────────────────────────────────┘`}</pre>
          </div>
        </div>
      </section>
    </>
  );
}