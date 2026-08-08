import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { ProtocolStack } from "@/components/protocol-stack";
import { TrustGraph } from "@/components/trust-graph";
import { EgyptianDivider } from "@/components/egyptian-divider";

export const Route = createFileRoute("/asaf")({
  head: () => ({
    meta: [
      { title: "ASAF Runtime: The Kernel That Says No" },
      { name: "description", content: "ASAF checks every AI action before it runs. If it can't confirm the action is safe, it refuses. Every step gets signed." },
      { property: "og:title", content: "ASAF Runtime: The Kernel That Says No" },
      { property: "og:description", content: "Checks, blocks, and signs every AI action, or reverses it. All in your own system." },
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
        title={<>If it can't prove an action is safe, ASAF says no. <span className="text-gradient">Every time.</span></>}
        subtitle="ASAF checks, runs, verifies, and signs every action your AI agents take. If something goes wrong, it reverses the action on its own. It runs inside your own walls, even fully offline. It never defaults to yes."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-20 grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <Eyebrow>Layer model</Eyebrow>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              Six checks stand between your data and a rogue agent.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              ASAF does six jobs: it checks permission, runs the action safely, checks the result matches what was promised, signs it (ML-DSA-65, a crypto lock even quantum computers can't break), undoes it if something breaks, and keeps rechecking forever.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                ["Kernel model", "The system that decides yes or no"],
                ["Execution", "Blocks by default, undoes mistakes fast"],
                ["Attestation", "Every action signed and locked"],
                ["Sovereignty", "Runs fully offline, stays in your walls"],
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
            title="Every action leaves a signed record you can't erase."
            subtitle="Each step an agent takes, from asking permission to finishing the job, gets locked to the one before it. Nothing gets deleted. Nothing gets faked."
          />
          <div className="mt-10 surface-card p-4 md:p-8">
            <TrustGraph />
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <EgyptianDivider label="Rules that never bend" />
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              ["Bounded privilege", "No agent gets a blank check. Every permission is limited and controlled by the kernel."],
              ["Fail-closed", "When in doubt, it says no. If anything is unclear, the action is blocked."],
              ["Canonical serialization", "Every record is built the same way every time, so anyone can check it and get the same answer."],
              ["Independent replay", "You can replay the whole chain of events yourself. You don't have to trust us."],
              ["Sovereign deployment", "Runs the same on your own servers, Kubernetes, SSH, or a local machine. No cloud needed."],
              ["Post-quantum", "Locked with ML-DSA-65, a signature future quantum computers can't crack. Built to swap in new locks later."],
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
            title="Choose how much control you keep. We recommend all of it."
          />
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              { t: "Sovereign", d: "Everything runs inside your own walls, even fully offline. You get your own checker tool too. Best choice if you handle CUI, ITAR, or other regulated data.", tag: "Regulated" },
              { t: "Hybrid", d: "KHEPRA manages the controls. ASAF and your evidence stay in your own cloud. You hold the keys.", tag: "Recommended" },
              { t: "Validation adapters", d: "Optional outside tools (like HackerAI) used just to test and prove ASAF works. Never required to run it.", tag: "PoC" },
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