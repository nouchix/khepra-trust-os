import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { ProtocolStack } from "@/components/protocol-stack";
import { TrustGraph } from "@/components/trust-graph";
import { EgyptianDivider } from "@/components/egyptian-divider";
import { JsonLd, buildSoftwareAppSchema, buildFaqSchema, buildBreadcrumbSchema } from "@/components/seo-json-ld";
import { AnswerBlock, Byline, LastUpdated, FaqBlock, type Faq } from "@/components/seo-blocks";

const FAQS: Faq[] = [
  {
    question: "What does ASAF do when it can't confirm an action is safe?",
    answer: "It says no. ASAF fails closed by default, so any unclear or unverified AI action is blocked instead of allowed through on a guess.",
  },
  {
    question: "What are the six checks ASAF runs on every action?",
    answer: "It checks permission, runs the action safely, checks the result matches what was promised, signs it with ML-DSA-65, undoes it if something breaks, and keeps rechecking forever.",
  },
  {
    question: "Can ASAF run fully offline, on my own servers?",
    answer: "Yes. ASAF runs the same on your own servers, Kubernetes, SSH, or a local machine, even fully offline. No cloud is required for sovereign deployments.",
  },
  {
    question: "Can I verify ASAF's records myself, without trusting KHEPRA?",
    answer: "Yes. Every record is built the same way every time and can be independently replayed. You don't have to take our word for it.",
  },
  {
    question: "Is ASAF's signing protected against quantum computers?",
    answer: "Yes. Every action is locked with ML-DSA-65, a post-quantum signature that today's or tomorrow's quantum computers can't break, and it's built to swap in new locks later.",
  },
  {
    question: "What deployment options does ASAF offer?",
    answer: "Sovereign (fully in your own walls, best for CUI or ITAR data), Hybrid (KHEPRA manages controls, you hold the keys), and Validation adapters for outside tools like HackerAI to test and prove it works.",
  },
];

export const Route = createFileRoute("/asaf")({
  head: () => ({
    meta: [
      { title: "ASAF Runtime: The Kernel That Says No" },
      { name: "description", content: "ASAF checks every AI action before it runs. If it can't confirm the action is safe, it refuses. Every step gets signed." },
      { property: "og:title", content: "ASAF Runtime: The Kernel That Says No" },
      { property: "og:description", content: "Checks, blocks, and signs every AI action, or reverses it. All in your own system." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://adinkhepra.com/asaf" }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(buildFaqSchema(FAQS)) },
    ],
  }),
  component: AsafPage,
});

function AsafPage() {
  return (
    <>
      <JsonLd
        data={buildSoftwareAppSchema({
          name: "ASAF Runtime",
          description: "ASAF is the privileged governance kernel that checks, runs, verifies, and signs every AI agent action, and reverses it when something breaks.",
          url: "https://adinkhepra.com/asaf",
          applicationCategory: "SecurityApplication",
        })}
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", url: "https://adinkhepra.com/" },
          { name: "ASAF Runtime", url: "https://adinkhepra.com/asaf" },
        ])}
      />
      <PageHero
        eyebrow="ASAF Runtime · Privileged Governance Kernel"
        title={<>What stops an AI agent when it can't prove an action is safe? <span className="text-gradient">ASAF says no.</span></>}
        subtitle="ASAF checks, runs, verifies, and signs every action your AI agents take. If something goes wrong, it reverses the action on its own. It runs inside your own walls, even fully offline. It never defaults to yes."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-8">
          <AnswerBlock>
            ASAF is a privileged governance kernel that checks every AI agent action before it runs, signs it with ML-DSA-65, and reverses it automatically if something breaks. It fails closed by default and can run fully offline inside your own walls.
          </AnswerBlock>
          <Byline updated="August 2026" />
          <div className="mt-4">
            <LastUpdated date="August 2026" />
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20 grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <Eyebrow>Layer model</Eyebrow>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              What stands between your data and a rogue agent?
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
            title="How do you prove an AI action can't be erased?"
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

      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <SectionHeading
            eyebrow="Deployment topology"
            title="How much control should you keep? We recommend all of it."
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

      <FaqBlock items={FAQS} title="Questions people ask about ASAF" />
    </>
  );
}
