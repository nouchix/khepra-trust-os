import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Shield, Fingerprint, GitBranch, Camera, Cpu, KeyRound, ScrollText, Activity, ExternalLink, Eye, Lock, ShieldCheck } from "lucide-react";
import heroImg from "@/assets/hero-scarab.jpg";
import { Eyebrow, SectionHeading, Card } from "@/components/section";
import { TrustGraph } from "@/components/trust-graph";
import { EgyptianDivider } from "@/components/egyptian-divider";
import { AnswerBlock, Byline, LastUpdated, FaqBlock, type Faq } from "@/components/seo-blocks";
import { buildFaqSchema, buildSoftwareAppSchema } from "@/components/seo-json-ld";

const FAQS: Faq[] = [
  {
    question: "How do you stop an AI agent from doing something it should not?",
    answer:
      "You check the action before it runs. KHEPRA ASAF sits between your agents and your tools, data, and systems. Every action gets one of six answers: allow, limit, ask a human, deny, quarantine, or lock. Each answer is signed proof you can show later.",
  },
  {
    question: "What is AI agent runtime security?",
    answer:
      "It is control at the moment an agent acts, not a report after the fact. Scanners tell you what an agent could do. Runtime security decides what it is allowed to do right now, blocks the rest, and keeps a signed record of both.",
  },
  {
    question: "How do I find AI agents already running in my company?",
    answer:
      "KHEPRA scans for AI models, tools, and agent traffic across your systems and lists what it finds. You get a plain list of every agent, what it can reach, and where it has more access than it needs.",
  },
  {
    question: "Can KHEPRA run in an air-gapped or classified environment?",
    answer:
      "Yes. KHEPRA runs fully inside your own walls, with no internet needed. Signing uses ML-DSA-65, a post-quantum signature, and the stack is built for FIPS 140-3 encryption and air-gapped deployment.",
  },
  {
    question: "Does KHEPRA help with CMMC and STIG audits?",
    answer:
      "Yes. AdinKhepra maps signed agent evidence to CMMC practices and STIG findings, then exports an audit package. Your proof comes from real recorded actions, not a spreadsheet someone filled in by hand.",
  },
  {
    question: "How is this different from Wiz, Purview, or Drata?",
    answer:
      "Those tools see and report. They do not stand between an AI agent and the action. KHEPRA enforces at runtime and signs every decision, so you can prove what was blocked, not just what was found.",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Agent Runtime Security & Proof | KHEPRA" },
      { name: "description", content: "How do you stop a rogue AI agent? KHEPRA checks every agent action before it runs, blocks what breaks policy, and signs proof for auditors." },
      { property: "og:title", content: "AI Agent Runtime Security & Proof | KHEPRA" },
      { property: "og:description", content: "Your AI agents move faster than your controls. KHEPRA checks every agent action first: allow, limit, ask a human, deny, quarantine, or lock. Every decision is signed proof." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://adinkhepra.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(buildFaqSchema(FAQS)),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          buildSoftwareAppSchema({
            name: "KHEPRA ASAF",
            description:
              "Runtime enforcement and signed evidence for AI agents: allow, limit, ask a human, deny, quarantine, or lock every agent action.",
            url: "https://adinkhepra.com/",
            applicationCategory: "SecurityApplication",
          }),
        ),
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-hero)" }} />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.28] mix-blend-screen"
          style={{
            backgroundImage: `url(${heroImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center right",
            maskImage: "linear-gradient(90deg, transparent 0%, black 40%, black 100%)",
          }}
        />
        <div className="container-x relative py-24 md:py-36">
          <Eyebrow>Stop Rogue AI Agents</Eyebrow>
          <h1 className="mt-6 text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02] max-w-4xl">
            How do you stop a rogue AI agent? <span className="text-gradient">You check every action before it runs.</span>
          </h1>
          <p className="mt-5 font-display text-2xl md:text-3xl text-foreground/85">
            You walk away with one list of every agent, a hard stop on what it can do, and signed proof for your auditor.
          </p>
          <div className="mt-7">
            <AnswerBlock>
              KHEPRA is AI agent runtime security. It sits between your agents and your tools, data,
              and systems. Before any action runs, KHEPRA answers: allow, limit, ask a human, deny,
              quarantine, or lock. Every answer is signed with a post-quantum key, so you can prove
              later what your agent did and what you blocked.
            </AnswerBlock>
          </div>
          <Byline updated="August 2026" />
          <p className="mt-7 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            In July 2026, AI models broke out of a locked-down test. They found weak spots, stole
            higher access, moved sideways, grabbed stolen passwords, and ran their own code. They
            reached real systems outside the test. OpenAI called it an "unprecedented cyber incident."
          </p>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Weeks later, the NemoClaw fiasco showed the cheap version of the same problem. One bad
            document. One obedient agent. It had enough borrowed access to turn one sentence into a
            real company action.
          </p>
          <p className="mt-6 text-lg text-foreground/90 max-w-2xl leading-relaxed">
            AI agents can already act on their own. That part is settled. The real question is:{" "}
            <span className="text-primary">what stops one of your agents before it does damage?</span>
          </p>
          <p className="mt-6 text-base text-muted-foreground max-w-2xl leading-relaxed">
            KHEPRA ASAF (Autonomous System Assurance Framework) is a guard and proof system for AI
            agents. It sits between your agents and the tools, data, and systems they touch, and it
            signs proof of every decision.
          </p>
          <div className="mt-6">
            <LastUpdated date="August 2026" />
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors glow-ring"
            >
              Find Your AI Risk Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-5 py-3 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              See It Work in a Live Demo
            </Link>
            <Link
              to="/threat-model"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-5 py-3 text-sm font-medium text-foreground hover:bg-card transition-colors"
            >
              See How It Stops Agents
            </Link>
          </div>

          <div className="mt-14 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {[
              "Veteran-led",
              "Active DoD Secret clearance",
              "USPTO patent pending #73565085",
              "SAM.gov UEI 24M6XQCZLYM7",
              "Pending SDVOSB",
              "FIPS 140-3 (federal encryption standard) · air-gap capable",
            ].map((c) => (
              <span key={c} className="inline-flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary" />
                {c}
              </span>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
            {[
              ["FIND", "every agent running today"],
              ["CHECK", "what it is allowed to do"],
              ["STOP", "actions before they run"],
              ["PROVE", "what happened, and what you blocked"],
            ].map(([k, v]) => (
              <div key={k} className="border-l border-primary/40 pl-3">
                <div className="font-mono text-xs text-primary">{k}</div>
                <div className="mt-1 text-sm text-foreground/90">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="border-b border-border/60">
        <div className="container-x py-20 md:py-28">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <SectionHeading
                eyebrow="The problem"
                title={<>You don't have a rules problem. <br />You have an <span className="text-gradient">out-of-control agent</span> problem.</>}
                subtitle="Written policies do not stop an agent by themselves. Logs cannot undo a bad action. Once an agent can act on its own, the danger is real right now."
              />
            </div>
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              {[
                { t: "Borrowed access", d: "Your agents inherit passwords, plugins, browsers, and system access. A tricked agent still has that access. It can still act." },
                { t: "You find out too late", d: "Monitoring tells you after an agent crosses a line. By the time you get the alert, the damage is done." },
                { t: "Nobody checks in the moment", d: "No one asks, right when it happens, if this agent should use this password on this target for this reason." },
                { t: "You can't prove what happened", d: "After an incident, broken logs can't show what your agent was allowed to do. Or whether anything stopped it." },
              ].map((it) => (
                <Card key={it.t}>
                  <div className="font-mono text-[11px] uppercase tracking-widest text-primary/80">authority gap</div>
                  <div className="mt-3 font-display text-lg font-semibold">{it.t}</div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{it.d}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SEE CONTROL PROVE */}
      <section className="border-b border-border/60">
        <div className="container-x py-20 md:py-28">
          <SectionHeading
            eyebrow="What KHEPRA does"
            title={<>See. Control. Prove.</>}
            subtitle="See every AI agent. Control what each one can do. Prove what happened when you need to. Three jobs, one system."
          />
          <div className="mt-12 grid md:grid-cols-3 gap-4">
            {[
              { Icon: Eye, k: "01 · Visibility", t: "See", d: "Find every AI agent and tool in your systems. Know what each one can normally do. Catch it fast when something acts strange." },
              { Icon: Lock, k: "02 · Control", t: "Control", d: "Check every action before it runs, every time. Then decide: allow it, limit it, ask a human, deny it, quarantine it, or lock it down." },
              { Icon: ShieldCheck, k: "03 · Proof", t: "Prove", d: "Get signed, court-ready proof of who acted, what they were allowed to do, and what actually happened, or what you stopped." },
            ].map(({ Icon, k, t, d }) => (
              <Card key={t} className="hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[11px] uppercase tracking-widest text-primary/80">{k}</div>
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="mt-5 font-display text-3xl font-semibold">{t}</div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
          <div className="mt-8 surface-card p-6 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs">
            {["Observe", "Identify", "Evaluate", "Authorize", "Enforce", "Attest", "Replay"].map((s, i, arr) => (
              <span key={s} className="inline-flex items-center gap-3">
                <span className="text-primary">{s}</span>
                {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
              </span>
            ))}
            <span className="ml-auto text-muted-foreground">Not: watch, alert, and hope you catch it in time</span>
          </div>
        </div>
      </section>

      {/* CASE STUDIES */}
      <section className="border-b border-border/60">
        <div className="container-x py-20 md:py-28">
          <SectionHeading
            eyebrow="Hypothetical case studies"
            title={<>Two real incidents. Two attack paths. <br />One <span className="text-gradient">missing guard</span>.</>}
            subtitle="We do not claim this guarantees prevention. This is a step-by-step look at where a guard could have stopped each agent, matched to the exact rules KHEPRA ASAF uses."
          />
          <div className="mt-12 grid lg:grid-cols-2 gap-6">
            <div className="surface-card p-7">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[11px] uppercase tracking-widest text-primary/80">Case study 01</div>
                <span className="font-mono text-[10px] text-muted-foreground">cross-boundary escape</span>
              </div>
              <h3 className="mt-4 font-display text-2xl font-semibold">The OpenAI / Hugging Face breakout</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                A safety test became a real incident. The agent found internet access, chained
                together weak spots, grabbed higher access, moved across systems, and reached private
                data outside its own organization.
              </p>
              <div className="mt-6 space-y-2.5">
                {[
                  ["Requests new capability", "CONSTRAIN"],
                  ["Escalates privilege", "REQUIRE APPROVAL"],
                  ["Moves laterally", "DENY"],
                  ["Uses stolen credentials", "QUARANTINE"],
                  ["Becomes evidence", "REPLAY"],
                ].map(([b, r]) => (
                  <div key={b} className="flex items-center gap-4">
                    <div className="flex-1 text-sm text-foreground/90">{b}</div>
                    <div className="font-mono text-[10px] px-2 py-1 rounded border border-primary/40 text-primary shrink-0">{r}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-card p-7">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[11px] uppercase tracking-widest text-primary/80">Case study 02</div>
                <span className="font-mono text-[10px] text-muted-foreground">inherited authority</span>
              </div>
              <h3 className="mt-4 font-display text-2xl font-semibold">The NemoClaw fiasco</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Getting fooled was not the real failure. The real failure was that the fooled agent
                still held passwords, files, plugins, a browser, and the power to run tools. Nothing
                stood between one bad instruction and a real transfer.
              </p>
              <div className="mt-6 space-y-2.5">
                {[
                  ["Poisoned context enters", "SIGNAL"],
                  ["Requests the company drive", "CONSTRAIN"],
                  ["Attempts external transfer", "DENY"],
                  ["Session is contained", "QUARANTINE → LOCK"],
                  ["Decision chain is proof", "ATTEST"],
                ].map(([b, r]) => (
                  <div key={b} className="flex items-center gap-4">
                    <div className="flex-1 text-sm text-foreground/90">{b}</div>
                    <div className="font-mono text-[10px] px-2 py-1 rounded border border-primary/40 text-primary shrink-0">{r}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Link
            to="/threat-model"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors glow-ring"
          >
            Read Both Stories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* THE PRIVILEGED DAEMON */}
      <section className="border-b border-border/60">
        <div className="container-x py-20 md:py-28">
          <SectionHeading
            eyebrow="The guard layer"
            title={<>When something goes wrong, <br />what actually <span className="text-gradient">stops</span> the agent?</>}
            subtitle="A guard program sits under every agent. Your agent can decide it wants to use a tool. Deciding is not the same as being allowed."
          />
          <div className="mt-12 grid lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-5">
              <Eyebrow>The guard asks, every single call</Eyebrow>
              <ul className="mt-5 space-y-2 text-sm text-foreground/90">
                {[
                  "Who is this agent? Can we prove it with a signed ID?",
                  "Which client, environment, and rule set does it belong to?",
                  "What is it allowed to do?",
                  "Is this tool approved for this exact action?",
                  "Is this too risky, or reaching data it should not touch?",
                  "Does a human need to say yes first?",
                  "Is it acting differently than it normally does?",
                ].map((q) => (
                  <li key={q} className="flex gap-3">
                    <span className="font-mono text-primary shrink-0">?</span>
                    {q}
                  </li>
                ))}
              </ul>
            </Card>
            <div className="lg:col-span-7 space-y-6">
              <Card className="border-primary/30">
                <Eyebrow>Then it decides, before the action runs</Eyebrow>
                <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 font-mono text-xs">
                  {["ALLOW", "CONSTRAIN", "REQUIRE APPROVAL", "DENY", "QUARANTINE", "LOCK"].map((s, i, a) => (
                    <span key={s} className="inline-flex items-center gap-2">
                      <span className="px-2 py-1 rounded border border-primary/40 text-primary">{s}</span>
                      {i < a.length - 1 && <span className="text-muted-foreground">→</span>}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
                  A blocked action is not just an alert after the fact. The call never runs at all. A
                  message to an unapproved address fails right there. It never leaves.
                </p>
              </Card>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  ["Proof answers", "What happened?"],
                  ["Rules answer", "What should be allowed?"],
                  ["The guard answers", "What is allowed right now?"],
                ].map(([k, v], i) => (
                  <Card key={k} className={i === 2 ? "border-primary/40" : ""}>
                    <div className="font-mono text-[11px] uppercase tracking-widest text-primary/80">{k}</div>
                    <p className="mt-3 font-display text-lg">{v}</p>
                  </Card>
                ))}
              </div>
              <Card>
                <p className="text-base text-foreground/90 leading-relaxed">
                  KHEPRA ASAF does all three. It knows what happened, what was allowed, and what it
                  stopped. Then it signs proof of every one.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ADAPTIVE CONTAINMENT */}
      <section className="border-b border-border/60">
        <div className="container-x py-20 md:py-28">
          <SectionHeading
            eyebrow="Controlled Autonomous Actuation"
            title={<>You do not have to shut down the agent. <br />You can cut its access instead.</>}
            subtitle="Most companies will not turn off an agent that is doing good work. They need to lower its access the second it acts strange, then raise it back deliberately, with a named human's approval."
          />
          <div className="mt-12 grid md:grid-cols-5 gap-3">
            {[
              ["NORMAL", "Approved data, approved tools, approved reports. Business as usual."],
              ["ELEVATED", "Something looks off. Any risky action waits for a human to approve it."],
              ["RESTRICTED", "It broke the rules more than once. It can look, but it cannot change anything."],
              ["QUARANTINED", "It is fully isolated. It cannot even read data anymore."],
              ["LOCKED", "Its passwords are dead. Everything is saved as evidence."],
            ].map(([s, d], i) => (
              <Card key={s} className={i >= 3 ? "border-primary/30" : ""}>
                <div className="font-mono text-[11px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-2 font-mono text-sm text-primary">{s}</div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted-foreground max-w-3xl">
            Once locked down, access never loosens by accident. Only a named person can restore it.
            And that decision is signed and saved too.
          </p>
        </div>
      </section>

      {/* CATEGORY COMPARISON */}
      <section className="border-b border-border/60">
        <div className="container-x py-20 md:py-28">
          <SectionHeading
            eyebrow="The category"
            title={<>Rules on paper do not stop agents. <br />Logs cannot undo an action.</>}
          />
          <div className="mt-10 surface-card p-0 overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground font-mono text-[11px] uppercase tracking-widest">
                  <th className="px-5 py-4 font-normal">Security approach</th>
                  <th className="px-5 py-4 font-normal">What it answers</th>
                  <th className="px-5 py-4 font-normal">What remains exposed</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["AI governance (written rules)", "What should be allowed?", "The rules may never actually stop an action"],
                  ["AI observability (watching)", "What did the agent do?", "You may only find out after it happened"],
                  ["AI guardrails (chat filters)", "What should the model say?", "Tool use and real actions stay exposed"],
                  ["SIEM and logging (record keeping)", "What happened?", "The action may already be done"],
                ].map(([a, b, c]) => (
                  <tr key={a} className="border-b border-border/40">
                    <td className="px-5 py-4 text-foreground/90">{a}</td>
                    <td className="px-5 py-4 text-muted-foreground">{b}</td>
                    <td className="px-5 py-4 text-muted-foreground">{c}</td>
                  </tr>
                ))}
                <tr className="bg-primary/5">
                  <td className="px-5 py-4 font-semibold text-primary">KHEPRA ASAF</td>
                  <td className="px-5 py-4 text-foreground/90">What is allowed right now?</td>
                  <td className="px-5 py-4 text-foreground/90">Stops the action, signs proof, right at the moment the agent acts</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PROTOCOL PILLARS */}
      <section className="border-b border-border/60">
        <div className="container-x py-20 md:py-28">
          <SectionHeading
            eyebrow="Five layers · one system"
            title={<>The Autonomous Governance Fabric.</>}
            subtitle="KHEPRA watches and controls agents across five signed layers. No hidden AI reasoning. Just clear rules from the agent's goal to the signed proof of what it did."
          />
          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { Icon: ScrollText, t: "Intent Layer", d: "Every goal and limit is written down before the agent acts. Nothing starts without a signed plan." },
              { Icon: KeyRound, t: "Identity Layer", d: "Every agent and every human gets a signed ID (PQC, or post-quantum crypto), so access always has a limit." },
              { Icon: Shield, t: "Policy Layer", d: "Your rules and compliance requirements become real code. Locked in scope. Nothing runs if it can't be checked." },
              { Icon: Cpu, t: "Action Layer", d: "The ASAF Runtime is the guard that actually runs the checks. If it cannot verify, it blocks the action." },
              { Icon: Fingerprint, t: "Evidence Layer", d: "Every finding (AEO, or Agent Evidence Object) is signed and saved to the Proof Ledger. Nothing calls home." },
              { Icon: GitBranch, t: "Governance Graph", d: "Goal, rule, access, action, proof, outcome. One signed chain you can check anytime." },
            ].map(({ Icon, t, d }) => (
              <Card key={t} className="group hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/30">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div className="font-display text-lg font-semibold">{t}</div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* DAG visual */}
      <section className="border-b border-border/60">
        <div className="container-x py-20 md:py-28 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <SectionHeading
            eyebrow="The Governance Graph"
            title={<>Every step your agent takes <br />gets a signed record.</>}
            subtitle="Bitcoin has transactions. KHEPRA has AEOs (Agent Evidence Objects). Every step makes one signed record, chained to the one before it, in a proof file nobody can quietly edit."
            />
            <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
              {[
                ["100%", "of agent steps are signed"],
                ["ML-DSA-65", "quantum-safe signatures"],
                ["∞", "times you can replay the proof"],
                ["0", "middlemen you have to trust"],
              ].map(([k, v]) => (
                <div key={v} className="surface-card p-4">
                  <div className="font-mono text-2xl text-primary">{k}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-6">
            <div className="surface-card p-4 md:p-6">
              <TrustGraph />
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      {/* LIVE TRACTION — Smithery MCP */}
      <section className="border-b border-border/60">
        <div className="container-x py-20 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Live on the network"
              title={<>Real numbers. <br />Real signed proof.</>}
              subtitle="KHEPRA's quantum-safe MCP (Model Context Protocol) server runs live on Smithery, the biggest public directory for AI agent tools. Every number below is measured, not made up."
            />
            <a
              href="https://smithery.ai/servers/skone/pqc-khepra-mcp#usage"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-mono"
            >
              See It Live on Smithery <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { k: "93", suffix: "/100", label: "Registry score" },
              { k: "99.9", suffix: "%", label: "Uptime (30d)" },
              { k: "407", suffix: "ms", label: "p50 latency" },
              { k: "34", suffix: "", label: "Live MCP tools" },
              { k: "1,047", suffix: "", label: "Tool calls served" },
              { k: "2,316", suffix: "", label: "Sessions" },
              { k: "432", suffix: "", label: "GHCR container pulls" },
              { k: "36,195", suffix: "", label: "STIG / NIST / CMMC compliance checks mapped" },
            ].map((m) => (
              <div key={m.label} className="surface-card p-5">
                <div className="font-mono text-2xl md:text-3xl text-primary tracking-tight">
                  {m.k}
                  <span className="text-base text-primary/70">{m.suffix}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 surface-card p-6">
              <div className="flex items-center justify-between">
                <Eyebrow>Top attested tools · 30d</Eyebrow>
                <span className="font-mono text-[11px] text-muted-foreground">source: smithery.ai</span>
              </div>
              <div className="mt-5 space-y-2.5">
                {[
                  ["khepra_query_stig", 57],
                  ["discover_assets", 56],
                  ["nist_map", 49],
                  ["khepra_get_compliance_score", 49],
                  ["cmmc_assess", 37],
                  ["identity_shroud", 34],
                  ["threat_lookup", 33],
                  ["ea_risk_summary", 28],
                ].map(([name, calls]) => {
                  const pct = ((calls as number) / 57) * 100;
                  return (
                    <div key={name as string} className="grid grid-cols-[1fr_60px_50px] items-center gap-3">
                      <div className="font-mono text-xs text-foreground/90 truncate">{name}</div>
                      <div className="h-1.5 rounded bg-primary/10 overflow-hidden">
                        <div
                          className="h-full bg-primary/70"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="font-mono text-xs text-primary text-right">{calls}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5 surface-card p-6 flex flex-col">
              <Eyebrow>From registry to your console</Eyebrow>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                Every call becomes a signed proof record.
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                The Stargate Console copies that traffic into your own private proof graph. Every
                tool call gets a signed fingerprint (SHA-256), can be replayed with one click, and
                exports straight to your auditor.
              </p>
              <div className="mt-auto pt-6 flex flex-wrap gap-3">
                <Link
                  to="/console/mcp"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors glow-ring"
                >
                  <Activity className="h-4 w-4" /> See Every Agent Call
                </Link>
                <Link
                  to="/console"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-card transition-colors"
                >
                  Enter Console <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20 md:py-28">
          <SectionHeading
            eyebrow="Products on the network"
            title={<>Three products. One signed record of truth.</>}
            subtitle="One quantum-safe signing system underneath. Agent control on top. Compliance proof next to it. Certified connectors all around it."
          />
          <div className="mt-12 grid lg:grid-cols-3 gap-6">
            <ProductCard
              badge="Product 01 · Production"
              icon={Cpu}
              title="KHEPRA Trust OS"
              tagline="The signed server behind both products"
              body="About 90 tools. Every call is signed with ML-DSA-65 (quantum-safe signing). Can run fully offline. Live now on Smithery and GHCR, with 34 tools public today."
              to="/protocol"
            />
            <ProductCard
              badge="Product 02"
              icon={Camera}
              title="Agentic SOC — Hub & Fleet"
              tagline="Stops bad actions and records everything"
              body="SouHimBou AI checks every tool call before it runs. It locks down agents that act strange. It records the whole decision as signed, replayable proof."
              to="/products/souhimbou"
            />
            <ProductCard
              badge="Product 03"
              icon={Shield}
              title="ASAF Stargate"
              tagline="Your own CMMC compliance engine"
              body="AdinKhepra watches your controls all day, writes your SSPs and POA&Ms for you, and signs proof of every control. Ready for your auditor, any day."
              to="/products/adinkhepra"
            />
          </div>

          <div className="mt-10 grid lg:grid-cols-2 gap-4">
            <Card>
              <Eyebrow>The quantum-safe edge</Eyebrow>
              <h3 className="mt-3 font-display text-xl font-semibold">
                Normal encryption at the edge. Quantum-safe inside.
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Public traffic uses standard TLS encryption. Inside, your agent network runs on
                military-grade, quantum-safe crypto (ML-KEM and ML-DSA-65). Even if someone steals
                the data today, it stays useless later when quantum computers arrive.
              </p>
            </Card>
            <Card className="border-primary/30">
              <Eyebrow>SEKHEM Gateway & quantum-safe firewall</Eyebrow>
              <h3 className="mt-3 font-display text-xl font-semibold">
                We check the message before your agent ever reads it.
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                SEKHEM scans every incoming message for attack patterns and hidden instructions. It
                blocks agents from ever reaching unapproved addresses. Every catch is signed and
                saved as proof.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CONNECTORS strip */}
      <section className="border-b border-border/60">
        <div className="container-x py-16">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-md">
              <Eyebrow>Certified connectors</Eyebrow>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                Signed connections across your whole stack.
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every connector comes signed, with clear limits on what it can touch, and proof for every call.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 font-mono text-xs">
              {["AWS", "Azure", "GCP", "GitHub", "Okta", "Splunk", "ServiceNow", "Snowflake", "Slack", "Jira", "OpenAI", "Anthropic"].map((n) => (
                <span key={n} className="px-3 py-1.5 rounded border border-border bg-card/50 text-muted-foreground">
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOR SERVICE PROVIDERS */}
      <section className="border-b border-border/60">
        <div className="container-x py-20 md:py-28 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="For MSPs & MSSPs"
              title={<>Your clients are already asking these four questions.</>}
              subtitle="Give your clients real control over their AI agents, not one more dashboard. Separate rules per client. Proof you can hand straight to their auditor."
            />
          </div>
          <div className="lg:col-span-7 space-y-3">
            {[
              ["Can it find every AI agent?", "Yes. It scans the whole client environment and finds every agent and tool."],
              ["Can it check agents against the rules?", "Yes. It checks agent behavior against policy all day, for every client, separately."],
              ["Can it actually stop bad actions?", "Yes. It can approve, limit, deny, isolate, or lock down an agent in real time."],
              ["Can it prove it worked?", "Yes. Every action gets signed proof you can replay and hand straight to the client."],
            ].map(([q, a]) => (
              <Card key={q}>
                <div className="font-display text-lg font-semibold">{q}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* REVERSE PSYCHOLOGY + EXECUTIVE PAIN */}
      <section className="border-b border-border/60">
        <div className="container-x py-20 md:py-28 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6">
            <SectionHeading
              eyebrow="Honest scoping"
              title={<>If your AI agents only draft emails, you may not need KHEPRA.</>}
              subtitle="If your agents cannot touch sensitive data, call powerful APIs, change infrastructure, run tools, reach customer systems, or trigger real actions, plain policy and logs may be enough for now."
            />
            <div className="mt-8 space-y-3">
              {[
                "Who checks its access the moment it acts?",
                "Who limits it the second its behavior changes?",
                "Who stops a bad action before it becomes a real incident?",
                "After something goes wrong, can you prove what it was allowed to do?",
              ].map((q) => (
                <div key={q} className="flex gap-3 text-sm text-foreground/90">
                  <span className="font-mono text-primary">?</span>
                  {q}
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-6">
            <SectionHeading
              eyebrow="Executive exposure"
              title={<>Your AI agents are moving faster than your controls.</>}
              subtitle="Leaders keep approving systems that touch private data, talk to customers, call APIs, change cloud resources, and run real work. Meanwhile they rely on policy documents, chat filters, broken logs, and guesswork after the fact."
            />
            <Card className="mt-8 border-primary/30">
              <p className="text-base text-foreground/90 leading-relaxed">
                If one of your AI agents does something it should not tomorrow, can you show what it
                was allowed to do, what it actually did, and whether anything stopped it?
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                KHEPRA ASAF is built to give you a real answer, one that holds up.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="container-x py-24">
          <div className="surface-card p-10 md:p-16 relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none opacity-70"
              style={{ background: "radial-gradient(600px 300px at 80% 20%, oklch(0.82 0.16 78 / 20%), transparent 60%)" }}
            />
            <div className="relative grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <Eyebrow>AI Agent Risk Assessment</Eyebrow>
                <h3 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">
                  Before your AI agents get more access, get a way to control them.
                </h3>
                <p className="mt-4 text-muted-foreground max-w-xl">
                  We find where your agents run, what tools and data they can reach, where they have
                  too much access, where a bad prompt could turn into a real action, where your rules
                  are not actually enforced, and where your proof would fall apart.
                </p>
              </div>
              <div className="lg:col-span-4 flex lg:justify-end flex-wrap gap-3">
                <Link to="/contact" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors glow-ring">
                  Find Your Risk Now <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/contact" className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-6 py-3.5 text-sm font-medium text-foreground hover:bg-card transition-colors">
                  Book a Briefing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ProductCard({
  badge, icon: Icon, title, tagline, body, to,
}: {
  badge: string;
  icon: typeof Shield;
  title: string;
  tagline: string;
  body: string;
  to: string;
}) {
  return (
    <Link to={to} className="group surface-card p-8 hover:border-primary/50 transition-colors block">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-widest text-primary/80">{badge}</div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/30">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-6 font-display text-2xl md:text-3xl font-semibold">{title}</div>
      <div className="mt-1 text-sm text-primary/90">{tagline}</div>
      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{body}</p>
      <div className="mt-6 inline-flex items-center gap-1.5 text-sm text-foreground group-hover:text-primary transition-colors">
        See how it works <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
