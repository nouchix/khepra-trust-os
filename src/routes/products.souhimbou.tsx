import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import souImg from "@/assets/souhimbou.jpg";
import { JsonLd, buildSoftwareAppSchema } from "@/components/seo-json-ld";

export const Route = createFileRoute("/products/souhimbou")({
  head: () => ({
    meta: [
      { title: "SouHimBou AI — Runtime Enforcement & Flight Recorder for AI Agents" },
      { name: "description", content: "Authorize or refuse every agent tool call before execution, contain agents that drift, and prove the decision with signed, replayable evidence." },
      { property: "og:title", content: "SouHimBou AI — Runtime Enforcement for AI Agents" },
      { property: "og:description", content: "See what AI agents are doing. Control what they are allowed to do. Prove what happened." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "SouHimBou AI — Security Camera for AI Agents" },
      { name: "description", content: "Record every prompt, retrieval, tool call, and mutation as a replayable signed timeline. Detect drift, prove intent, reconstruct incidents." },
      { property: "og:title", content: "SouHimBou AI — Security Camera for AI Agents" },
      { property: "og:description", content: "Record every prompt, retrieval, tool call, and mutation as a replayable signed timeline. Detect drift, prove intent, reconstruct incidents." },
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
          description: "Record every prompt, retrieval, tool call, and mutation as a replayable signed timeline. Detect drift, prove intent, reconstruct incidents.",
          url: "https://adinkhepra.com/products/souhimbou",
          applicationCategory: "SecurityApplication",
        })}
      />
      <PageHero
        eyebrow="Product 02 · SouHimBou AI"
        title={<>See it. <span className="text-gradient">Control</span> it. Prove it.</>}
        subtitle="SouHimBou AI is the privileged enforcement and proof plane at the agent-action boundary. It authorizes or refuses each tool call before execution, contains agents whose behavior changes, and records the entire decision chain as signed, replayable evidence. The security camera and flight recorder are what it leaves behind — the daemon is what it does."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-16">
          <SectionHeading
            eyebrow="Three functions, one architecture"
            title={<>Detection tells you an agent crossed the line. <br />Enforcement is what keeps it from crossing.</>}
          />
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              ["01 · See", "Discover agentic systems, map their tools and reachable data, baseline behavior, and flag drift and injection indicators."],
              ["02 · Control", "Evaluate each action before execution and rule: ALLOW → CONSTRAIN → REQUIRE APPROVAL → DENY → QUARANTINE → LOCK. Denied calls never run."],
              ["03 · Prove", "Every ruling — including the ones that refused an action — becomes a signed, hash-chained evidence object you can replay and export."],
            ].map(([t, d]) => (
              <Card key={t} className="hover:border-primary/40 transition-colors">
                <div className="font-mono text-[11px] uppercase tracking-widest text-primary/80">{t}</div>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
          <div className="mt-8 surface-card p-6">
            <p className="text-base text-foreground/90 leading-relaxed max-w-3xl">
              Other platforms tell you what an agent did. SouHimBou AI is designed to control what the
              agent is permitted to do — and prove the control was enforced.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-16 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <Eyebrow>Why it matters</Eyebrow>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              You can't govern what you can't stop — or replay.
            </h2>
            <ul className="mt-6 space-y-3">
              {[
                "Interdiction in the call path: a denied tool call is never invoked, and unapproved egress fails at the transport.",
                "Adaptive containment: normal, elevated, restricted, quarantined, locked — escalation is monotonic, reinstatement is explicit.",
                "Human-in-the-loop gates: held actions queue for a named approver, and the approver's identity lands in the evidence.",
                "Full-fidelity capture: prompts, retrievals, tool I/O, external mutations, and every policy ruling.",
                "Signed, tamper-evident timeline on the KHEPRA DAG, with forensic replay of any session.",
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
          <SectionHeading eyebrow="What gets recorded" title="Every step of the agent, signed." />
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ["Session identity", "Actor DID, on-behalf-of chain, policy bundle version, runtime fingerprint."],
              ["Prompt & context", "Full prompt, system messages, retrieved chunks with source hashes."],
              ["Tool invocations", "Signed connector calls, arguments, latency, decision, and obligations applied."],
              ["External effects", "Every downstream mutation with pre/post hashes and reversal metadata."],
              ["Model responses", "Complete model output, token stream digest, safety classifications."],
              ["Policy decisions", "Every allow/deny with rule references and applied obligations."],
              ["Drift signals", "Detected deltas in prompts, tools, or model behavior vs. baseline."],
              ["Reviewer actions", "Who accessed what evidence, when, and under which authorization."],
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
              <h2 className="text-2xl font-semibold tracking-tight">Deploying agents to production?</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">SouHimBou AI drops into your runtime with SDKs for Python, TS, and gRPC sidecar. Alpha access is open to a limited cohort.</p>
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