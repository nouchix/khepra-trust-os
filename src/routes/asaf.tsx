import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { ProtocolStack } from "@/components/protocol-stack";
import { TrustGraph } from "@/components/trust-graph";
import { EgyptianDivider } from "@/components/egyptian-divider";

export const Route = createFileRoute("/asaf")({
  head: () => ({
    meta: [
      { title: "ASAF Runtime — Privileged Governance Kernel | KHEPRA" },
      { name: "description", content: "The ASAF Runtime is the privileged governance kernel at the heart of KHEPRA — fail-closed actuation, pre/post state verification, and ML-DSA-65 attestation of every Governed State Transition." },
      { property: "og:title", content: "ASAF Runtime — Privileged Governance Kernel" },
      { property: "og:description", content: "Authorization, actuation, verification, attestation, and rollback in one sovereign kernel." },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "https://adinkhepra.com/asaf" }],
  }),
  component: AsafPage,
});

function AsafPage() {
  return (
    <>
      <PageHero
        eyebrow="ASAF Runtime · Privileged Governance Kernel"
        title={<>ASAF Runtime — Privileged Governance Kernel | <span className="text-gradient">KHEPRA</span></>}
        subtitle="ASAF is not a daemon and not a service. It is the privileged governance kernel that authorizes, actuates, verifies, attests, and — on failure — rolls back every Governed State Transition. Sovereign, air-gap-capable, fail-closed by construction."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-20 grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <Eyebrow>Layer model</Eyebrow>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              Hover a layer to trace its role.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              ASAF holds six kernel responsibilities: Authorization (policy + Adinkra symbol brokering), Actuation (fail-closed execution), Verification (pre/post state equality), Attestation (ML-DSA-65 signature), Rollback (deterministic reversal on failure), and Continuous Governance (ongoing state re-authorization).
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                ["Kernel model", "Privileged governance runtime"],
                ["Execution", "Fail-closed, rollback-armed"],
                ["Attestation", "ML-DSA-65 over canonical bytes"],
                ["Sovereignty", "Air-gap-capable, no phone-home"],
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
            eyebrow="Governance Graph"
            title="Every GST becomes an AEO on the Proof Ledger."
            subtitle="Intent flows into policy, policy into privilege, privilege into actuation, actuation into verification and attestation — each edge cryptographically anchored on the append-only Proof Ledger."
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
              ["Bounded privilege", "No unbounded agent authority. Every privilege is a scoped Adinkra symbol brokered by the kernel."],
              ["Fail-closed", "No default-allow. If intent, policy, or verification does not resolve, actuation is refused."],
              ["Canonical serialization", "AEOs are deterministically encoded so any verifier reproduces the same bytes and hash."],
              ["Independent replay", "The customer-run verifier reproduces the full GST chain from the Proof Ledger alone."],
              ["Sovereign deployment", "Runs identically on customer infrastructure, Kubernetes, SSH, or a local daemon. No cloud dependency."],
              ["Post-quantum", "ML-DSA-65 signatures over canonical GST bytes. Crypto-agile envelope for future rotation."],
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
              { t: "Sovereign", d: "Full ASAF Runtime + Proof Ledger in your environment. Air-gap-capable. Independent verifier ships with the release. Default posture for CUI, ITAR, and regulated workloads.", tag: "Regulated" },
              { t: "Hybrid", d: "Control plane managed by KHEPRA. ASAF Runtime and Proof Ledger in your VPC. Keys held on your HSMs.", tag: "Recommended" },
              { t: "Validation adapters", d: "Optional external harnesses (e.g. HackerAI) used only to demonstrate and certify ASAF behavior. Never a runtime dependency.", tag: "PoC" },
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