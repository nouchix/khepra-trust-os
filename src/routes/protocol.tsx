import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";

export const Route = createFileRoute("/protocol")({
  head: () => ({
    meta: [
      { title: "The KHEPRA Protocol — Cryptographic Trust for Autonomous Systems" },
      { name: "description", content: "The KHEPRA Protocol defines signed identity, policy-mediated actions, and DAG-backed attestation for every actor in an autonomous stack." },
      { property: "og:title", content: "The KHEPRA Protocol" },
      { property: "og:description", content: "Cryptographic trust primitives for autonomous systems." },
    ],
  }),
  component: ProtocolPage,
});

function ProtocolPage() {
  return (
    <>
      <PageHero
        eyebrow="Protocol Specification · Draft"
        title={<>The KHEPRA Protocol.</>}
        subtitle="A protocol-first substrate for verifiable action. Every actor — human, agent, connector, or system — holds a cryptographic identity, acts under policy, and emits signed attestations onto a shared DAG."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-20 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <Eyebrow>Design principles</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">Non-negotiables.</h2>
          </div>
          <div className="lg:col-span-8 space-y-4">
            {[
              ["Cryptographic by default", "No plaintext trust decisions. Every action carries a verifiable signature chain."],
              ["Protocol before product", "The trust layer is an open specification. Products are conformant implementations."],
              ["Evidence, not logs", "Structured, replayable attestations — not opaque telemetry."],
              ["Portable identity", "Actors move across vendors without losing lineage or provenance."],
              ["Policy as code", "Human intent compiled into deterministic authorization rules."],
              ["Post-quantum ready", "Hybrid classical + PQC signatures across identity and attestation."],
            ].map(([t, d]) => (
              <Card key={t}>
                <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-8">
                  <div className="font-display text-lg font-semibold md:w-64 shrink-0">{t}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <SectionHeading
            eyebrow="Message shape"
            title="An attestation, in one envelope."
            subtitle="Every KHEPRA event — identity issuance, tool call, mutation, policy decision — is emitted as a canonical signed envelope."
          />
          <div className="mt-10 surface-card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-background/40">
              <div className="font-mono text-xs text-muted-foreground">attestation.envelope.json</div>
              <div className="font-mono text-[11px] text-primary/80">v0.1</div>
            </div>
            <pre className="p-6 text-[13px] leading-relaxed text-foreground/90 overflow-x-auto"><code>{`{
  "id": "att_01H8Z...KX9",
  "ts": "2026-07-23T14:22:08.412Z",
  "actor": {
    "id": "did:khepra:agent/finance-copilot#v3",
    "kind": "agent",
    "on_behalf_of": "did:khepra:user/j.okafor"
  },
  "action": {
    "type": "tool.invoke",
    "target": "conn:snowflake/warehouse.reports",
    "intent": "generate_q3_ap_summary"
  },
  "policy": {
    "bundle": "cmmc.l2@2026.07",
    "decision": "allow",
    "obligations": ["mask_pii", "record_full_io"]
  },
  "provenance": {
    "parents": ["att_01H8Z...KX7", "att_01H8Z...KX8"],
    "inputs_hash": "b3:9c3a...",
    "outputs_hash": "b3:1f8e..."
  },
  "sig": {
    "alg": "ml-dsa-65+ed25519",
    "key": "kid:khepra/runtime/eu-west-1#4",
    "value": "0x8f1c..."
  }
}`}</code></pre>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <SectionHeading
            eyebrow="Lifecycle"
            title="From intent to immutable evidence."
          />
          <div className="mt-12 grid md:grid-cols-5 gap-4">
            {[
              ["01", "Identify", "Actor authenticates with PQC-hybrid key. Session bound to on-behalf-of chain."],
              ["02", "Intend", "Requested action is declared with target, scope, and expected effect."],
              ["03", "Authorize", "Policy engine evaluates against versioned bundle. Obligations attached."],
              ["04", "Attest", "Signed envelope written to the DAG with parent-lineage hashes."],
              ["05", "Replay", "Any authorized reviewer reconstructs the action, inputs, and effects."],
            ].map(([n, t, d]) => (
              <Card key={n}>
                <div className="font-mono text-primary">{n}</div>
                <div className="mt-2 font-display text-lg font-semibold">{t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}