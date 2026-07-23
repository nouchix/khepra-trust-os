import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { ProtocolStack } from "@/components/protocol-stack";
import { TrustGraph } from "@/components/trust-graph";
import { EgyptianDivider } from "@/components/egyptian-divider";

export const Route = createFileRoute("/asaf")({
  head: () => ({
    meta: [
      { title: "ASAF — Attested Sovereign Agent Fabric | KHEPRA" },
      { name: "description", content: "ASAF is the modular architecture of the KHEPRA Trust Network: eight interoperable layers from PQC identity to evidence and replay." },
      { property: "og:title", content: "ASAF — Attested Sovereign Agent Fabric" },
      { property: "og:description", content: "The eight-layer trust architecture powering KHEPRA." },
    ],
  }),
  component: AsafPage,
});

function AsafPage() {
  return (
    <>
      <PageHero
        eyebrow="ASAF · Attested Sovereign Agent Fabric"
        title={<>Eight layers. One <span className="text-gradient">sovereign</span> trust plane.</>}
        subtitle="ASAF is the reference architecture of the KHEPRA Trust Network — a modular stack where every layer is independently verifiable, replaceable, and cryptographically anchored to the layer below."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-20 grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <Eyebrow>Layer model</Eyebrow>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              Hover a layer to trace its role.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              ASAF is designed to be adopted incrementally. Each layer emits and consumes canonical, signed messages — so partial deployments still produce first-class evidence.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                ["Open spec", "Draft published"],
                ["Reference impl", "Rust + TypeScript"],
                ["Verifier", "Independent CLI"],
                ["Federation", "Cross-tenant Q1 2027"],
              ].map(([k, v]) => (
                <div key={k} className="surface-card p-3">
                  <div className="font-mono text-[11px] text-primary/80">{k}</div>
                  <div className="text-sm mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7">
            <ProtocolStack />
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <SectionHeading
            eyebrow="Live trust graph"
            title="Every authorized action becomes a signed node."
            subtitle="Actions flow left to right: from identity through control, into edges, and out onto the immutable attestation ledger. This is a schematic view of a real ASAF-attested session."
          />
          <div className="mt-10 surface-card p-4 md:p-8">
            <TrustGraph />
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <EgyptianDivider label="Design invariants" />
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              ["Sovereignty", "Every actor holds its own signing key. No shared secrets, no central impersonation."],
              ["Composability", "Layers speak canonical messages. Swap the runtime or ledger without breaking evidence."],
              ["Verifiability", "Any third party can replay any envelope and confirm signature, policy, and lineage."],
              ["Portability", "Actor identities are DID-based. Move workloads across clouds without losing history."],
              ["Least privilege", "Connectors declare capability scopes. Policy engine narrows them per session."],
              ["Post-quantum", "Hybrid classical + ML-DSA signatures across identity, envelopes, and ledger anchors."],
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
          <SectionHeading
            eyebrow="Deployment topology"
            title="Run it as SaaS, hybrid, or fully sovereign."
          />
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              { t: "KHEPRA Cloud", d: "Fully managed by KHEPRA. Fastest to adopt. Regional data residency in US, EU, and UAE.", tag: "Managed" },
              { t: "Hybrid", d: "Control plane in KHEPRA Cloud. Data plane in your VPC. Keys held on your HSMs.", tag: "Recommended" },
              { t: "Sovereign", d: "Full stack in your environment. Air-gap capable. Independent verifier ships with the release.", tag: "Regulated" },
            ].map((o) => (
              <Card key={o.t}>
                <div className="font-mono text-[11px] uppercase tracking-widest text-primary/80">{o.tag}</div>
                <div className="mt-3 font-display text-xl font-semibold">{o.t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{o.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}