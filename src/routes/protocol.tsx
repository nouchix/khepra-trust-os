import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { JsonLd, buildBreadcrumbSchema } from "@/components/seo-json-ld";

export const Route = createFileRoute("/protocol")({
  head: () => ({
    meta: [
      { title: "AGP: Proof for Every AI Action, No Exceptions" },
      { name: "description", content: "AGP forces every AI action to leave signed proof behind. No proof, no action. No exceptions." },
      { property: "og:title", content: "AGP: Proof for Every AI Action, No Exceptions" },
      { property: "og:description", content: "AGP forces every AI action to leave signed proof behind. No proof, no action. No exceptions." },
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
        title={<>No proof, no action. <span className="text-gradient">That's the whole rule.</span></>}
        subtitle="AGP is the rulebook behind KHEPRA. Every step an AI agent takes (a Governed State Transition, or GST) must leave a signed record (an Agent Evidence Object, or AEO). If it can't prove what happened, the action never happens."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-20 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <Eyebrow>Design principles</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">Rules we will never bend.</h2>
          </div>
          <div className="lg:col-span-8 space-y-4">
            {[
              ["Proof, not trust", "Trust is not enough. Bitcoin proved this with money. AGP does the same for AI actions."],
              ["Bounded privilege", "No agent gets full control. Every permission is limited and tracked."],
              ["Fail-closed actuation", "If anything is unclear, the action is blocked. There is no default yes."],
              ["Canonical serialization", "Every record is built the same exact way, every time. Anyone can check it and get the same result."],
              ["Independently verifiable", "You don't have to trust us. You can run your own checker and replay any chain of proof yourself."],
              ["Post-quantum by design", "Locked with ML-DSA-65, a signature future quantum computers can't crack. Ready to upgrade as standards change."],
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
            title="One action. One signed record. No gaps."
            subtitle="Every action an agent takes creates exactly one record. It's locked to the record before it and signed with ML-DSA-65, so no one can slip an action past it."
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
            title="Seven checks stand between an idea and an action."
          />
          <div className="mt-12 grid md:grid-cols-7 gap-4">
            {[
              ["01", "Intent", "The agent states what it wants to do, and that gets signed first."],
              ["02", "Policy", "The request is checked against the rules. Extra conditions get added if needed."],
              ["03", "Privilege", "ASAF hands out a limited permission just for this one action. It can be taken back."],
              ["04", "Actuation", "ASAF runs the action carefully. If a check fails, it undoes the action right away."],
              ["05", "Verification", "The system checks the result matches exactly what was promised."],
              ["06", "Attestation", "The whole action gets signed and locked with ML-DSA-65."],
              ["07", "Evidence", "The signed record is saved for good. It can never be quietly erased."],
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