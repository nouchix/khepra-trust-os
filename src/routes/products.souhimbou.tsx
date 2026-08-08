import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import souImg from "@/assets/souhimbou.jpg";
import { JsonLd, buildSoftwareAppSchema } from "@/components/seo-json-ld";

export const Route = createFileRoute("/products/souhimbou")({
  head: () => ({
    meta: [
      { title: "SouHimBou AI: Stop Rogue AI Agents Now" },
      { name: "description", content: "Your AI agents can act without you knowing. SouHimBou AI blocks bad actions and signs the proof." },
      { property: "og:title", content: "SouHimBou AI: Stop Rogue AI Agents Now" },
      { property: "og:description", content: "See every agent. Block bad moves before they happen. Prove it in court if you have to." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SouHimBouPage,
});

function SouHimBouPage() {
  return (
    <>
      <JsonLd
        data={buildSoftwareAppSchema({
          name: "SouHimBou AI",
          description: "SouHimBou AI records every move your AI agents make and blocks the ones that break the rules.",
          url: "https://adinkhepra.com/products/souhimbou",
          applicationCategory: "SecurityApplication",
        })}
      />
      <PageHero
        eyebrow="Product 02 · SouHimBou AI — Agentic SOC · Hub & Fleet"
        title={<>Your AI agents can act with no record. <span className="text-gradient">Not anymore.</span></>}
        subtitle="Every day you wait, your agents act with no one watching. SouHimBou AI checks every action before it runs. It blocks the bad ones and locks down agents that go off script. Every decision gets signed and saved, so you can replay it later and prove exactly what happened."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-16">
          <SectionHeading
            eyebrow="Three functions, one architecture"
            title={<>Knowing an agent broke the rules is too late. <br />Stop it before it happens.</>}
          />
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              ["01 · See", "Find every AI agent in your systems. See what tools and data they can touch. Flag anything strange fast."],
              ["02 · Control", "Check every action before it runs. Allow it, limit it, hold it for approval, or shut it down. Blocked actions never run."],
              ["03 · Prove", "Every decision, even a block, gets signed and saved. Play it back any time. Hand it to an auditor with confidence."],
            ].map(([t, d]) => (
              <Card key={t} className="hover:border-primary/40 transition-colors">
                <div className="font-mono text-[11px] uppercase tracking-widest text-primary/80">{t}</div>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
          <div className="mt-8 surface-card p-6">
            <p className="text-base text-foreground/90 leading-relaxed max-w-3xl">
              Other tools tell you what an agent already did. That's too late.
              SouHimBou AI stops the bad action before it happens, and proves it stopped.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-16 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <Eyebrow>Why it matters</Eyebrow>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              If you can't stop an agent, you don't control it.
            </h2>
            <ul className="mt-6 space-y-3">
              {[
                "A blocked action never runs. Period. Bad data never leaves your walls.",
                "Agents that act strange get locked down step by step. No one gets their access back without a signed OK.",
                "Risky actions wait for a real person to say yes. That person's name goes on the record.",
                "Every prompt, every file touched, every rule applied gets captured. Nothing is missed.",
                "The full timeline is signed and can't be altered. Replay any session, any time.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/90">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-6 surface-card overflow-hidden">
            <img src={souImg} alt="SouHimBou AI flight recorder visualization" loading="lazy" width={1400} height={800} className="w-full h-auto" />
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <SectionHeading eyebrow="What gets recorded" title="Nothing your agents do goes unrecorded." />
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ["Session identity", "Who the agent is, who it acted for, and what rules it was running under."],
              ["Prompt & context", "The full prompt and every piece of data the agent pulled in, source and all."],
              ["Tool invocations", "Every tool call the agent made, what it asked for, and what was decided."],
              ["External effects", "Every change the agent made outside itself, before and after, so you can undo it."],
              ["Model responses", "The full answer the model gave, and whether it was flagged as risky."],
              ["Policy decisions", "Every yes and no the system made, and exactly which rule caused it."],
              ["Drift signals", "Any time an agent starts acting different from normal, you get an alert."],
              ["Reviewer actions", "Who looked at the evidence, when they looked, and why they were allowed to."],
            ].map(([t, d]) => (
              <Card key={t}>
                <div className="font-display text-base font-semibold">{t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container-x py-20">
          <div className="surface-card p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Are your agents already live? You need this now.</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">SouHimBou AI drops into your systems with SDKs for Python, TS, and a gRPC sidecar. Alpha access is open to a limited number of teams. Don't wait for an incident to sign up.</p>
            </div>
            <Link to="/developers" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Request alpha <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}