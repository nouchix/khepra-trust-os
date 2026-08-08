import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { JsonLd, buildBreadcrumbSchema } from "@/components/seo-json-ld";

export const Route = createFileRoute("/protocol")({
  head: () => ({
    meta: [
      { title: "KHEPRA Autonomous Governance Protocol (AGP)" },
      { name: "description", content: "AGP defines Governed State Transitions, Agent Evidence Objects, and the Autonomous Governance Fabric — cryptographic governance for every autonomous action." },
      { property: "og:title", content: "KHEPRA Autonomous Governance Protocol (AGP)" },
      { property: "og:description", content: "AGP defines Governed State Transitions, Agent Evidence Objects, and the Autonomous Governance Fabric — cryptographic governance for every autonomous action." },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "https://adinkhepra.com/protocol" }],
  }),
  component: ProtocolPage,
});

function ProtocolPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", url: "https://adinkhepra.com/" },
          { name: "Protocol", url: "https://adinkhepra.com/protocol" },
        ])}
      />
      <PageHero
        eyebrow="Autonomous Governance Protocol · SDS v3.0"
        title={<>KHEPRA Autonomous Governance Protocol (AGP) — <span className="text-gradient">Cryptographic Governance</span></>}
        subtitle="AGP specifies the Governed State Transition (GST) lifecycle, the canonical Agent Evidence Object (AEO), and the five-plane Autonomous Governance Fabric. Every autonomous state transition SHALL produce independently verifiable cryptographic evidence."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-20 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <Eyebrow>Design principles</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">Non-negotiables.</h2>
          </div>
          <div className="lg:col-span-8 space-y-4">
            {[
              ["Proof, not trust", "Bitcoin replaced trusted third parties with cryptographic proof. AGP does the same for autonomous state."],
              ["Bounded privilege", "No unbounded agent authority. The Adinkra symbol hierarchy brokers every privilege acquisition."],
              ["Fail-closed actuation", "The ASAF Runtime refuses to execute unless intent, policy, and privilege all resolve. There is no default-allow."],
              ["Canonical serialization", "Every AEO is deterministically encoded so any verifier reproduces the same bytes and signature check."],
              ["Independently verifiable", "You don't have to trust us. You can run your own checker and replay any chain of proof yourself."],
              ["Post-quantum by design", "ML-DSA-65 signatures over canonical GST bytes. Crypto-agile envelope for future FIPS 203/204/205 rotation."],
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
            eyebrow="Canonical AEO"
            title="One state transition. One evidence object."
            subtitle="Every Governed State Transition emits exactly one Agent Evidence Object — canonically serialized, content-addressed, hash-linked to its parent, and signed with ML-DSA-65 over the canonical bytes."
          />
          <div className="mt-10 surface-card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-background/40">
              <div className="font-mono text-xs text-muted-foreground">agent-evidence-object.json</div>
              <div className="font-mono text-[11px] text-primary/80">aeo/1.0</div>
            </div>
            <pre className="p-6 text-[13px] leading-relaxed text-foreground/90 overflow-x-auto"><code>{`{
  "aeo_id": "b3:hash(canonical_bytes)",
  "previous_hash": "b3:parent_aeo_id",
  "timestamp": "2026-02-17T10:30:00Z",
  "gst_phase": ["Intent", "Authorization", "Actuation", "Verification", "Attestation"],
  "agent_id": "ml-dsa-65:did:khepra:agent/finance-copilot#v3",
  "human_approver": "ml-dsa-65:did:khepra:user/j.okafor",
  "intent": {
    "mission_id": "generate_q3_ap_summary",
    "desired_state": { "report": "q3-ap.parquet", "classification": "CUI" }
  },
  "policy_applied": ["CMMC_L3_SC.3.177", "NIST_800-53_AC-2"],
  "privilege_context": { "symbol": "Eban", "scope": "warehouse.reports" },
  "execution": {
    "command": "warehouse.query(...)",
    "timestamp": "2026-02-17T10:30:00.412Z"
  },
  "verification": {
    "pre_state": "b3:9c3a...",
    "post_state": "b3:1f8e...",
    "equality": true
  },
  "signature_ml_dsa_65": "base64(...)",
  "governance_graph_edges": [
    "agent_id→mission_id",
    "policy_id→execution_id"
  ]
}`}</code></pre>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <SectionHeading
            eyebrow="Governed State Transition"
            title="State₀ → Intent → Policy → Privilege → Actuation → Verification → Attestation → State₁"
          />
          <div className="mt-12 grid md:grid-cols-7 gap-4">
            {[
              ["01", "Intent", "Mission and desired end-state declared and signed before any execution."],
              ["02", "Policy", "Authorization evaluated against versioned bundle; obligations attached."],
              ["03", "Privilege", "ASAF brokers an Adinkra symbol scoped to this GST. Bounded, revocable."],
              ["04", "Actuation", "ASAF Runtime executes fail-closed. Rollback armed on any verification failure."],
              ["05", "Verification", "Pre/post state equality confirmed against declared desired state."],
              ["06", "Attestation", "ML-DSA-65 signature over canonical GST bytes."],
              ["07", "Evidence", "AEO written to Proof Ledger; edges added to the Governance Graph."],
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