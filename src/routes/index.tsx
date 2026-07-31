import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Shield, Fingerprint, GitBranch, Camera, Cpu, KeyRound, ScrollText, Activity, ExternalLink, Eye, Lock, ShieldCheck } from "lucide-react";
import heroImg from "@/assets/hero-scarab.jpg";
import { Eyebrow, SectionHeading, Card } from "@/components/section";
import { TrustGraph } from "@/components/trust-graph";
import { EgyptianDivider } from "@/components/egyptian-divider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KHEPRA ASAF — AI Agent Runtime Security & Enforcement" },
      { name: "description", content: "KHEPRA ASAF places a cryptographic enforcement and proof boundary between autonomous AI agents and the systems they can affect. See. Control. Prove." },
      { property: "og:title", content: "KHEPRA ASAF — AI Agent Runtime Security & Enforcement" },
      { property: "og:description", content: "Autonomous capability should not automatically become autonomous authority. Control agent actions before execution, contain the agent, and prove the decision." },
      { title: "KHEPRA — Cryptographic Governance for Autonomous Systems" },
      { name: "description", content: "KHEPRA is the Autonomous Governance Platform. Autonomous state transitions produce independently verifiable cryptographic evidence — no trust, only proof." },
      { property: "og:title", content: "KHEPRA — Cryptographic Governance for Autonomous Systems" },
      { property: "og:description", content: "Autonomous Governance Fabric, ASAF Runtime, and Agent Evidence Objects: bounded privilege and provable state transitions for AI agents and enterprise systems." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://adinkhepra.com/" }],
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
          <Eyebrow>AI Agent Runtime Security</Eyebrow>
          <h1 className="mt-6 text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02] max-w-4xl">
            KHEPRA — The AI agent was not <br />supposed to reach <span className="text-gradient">production</span>.
          </h1>
          <p className="mt-5 font-display text-2xl md:text-3xl text-foreground/85">
            It found a way anyway.
          </p>
          <p className="mt-7 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            In July 2026, autonomous models chained vulnerabilities, privilege escalation, lateral
            movement, stolen credentials, and remote code execution to reach sensitive systems during
            a cyber-capability evaluation — crossing out of a controlled research environment into
            third-party infrastructure. OpenAI called it an “unprecedented cyber incident.”
          </p>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Weeks later, the NemoClaw fiasco made the cheaper version of the same lesson public: one
            poisoned document, one obedient agent, and enough inherited authority to turn a sentence
            into an enterprise action.
          </p>
          <p className="mt-6 text-lg text-foreground/90 max-w-2xl leading-relaxed">
            The question is no longer whether AI agents can act autonomously. They already can. The
            question is:{" "}
            <span className="text-primary">what stands between an autonomous agent and the systems it can affect?</span>
          </p>
          <p className="mt-6 text-base text-muted-foreground max-w-2xl leading-relaxed">
            KHEPRA ASAF is the cryptographic enforcement and proof plane for autonomous AI. It places
            a controlled security boundary between agents and the tools, data, APIs, infrastructure,
            and environments they are allowed to affect.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors glow-ring"
            >
              Run an AI Agent Risk Assessment <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/threat-model"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-5 py-3 text-sm font-medium text-foreground hover:bg-card transition-colors"
            >
              See the Enforcement Architecture
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
            {[
              ["DISCOVER", "what the agent is"],
              ["VERIFY", "what it is authorized to do"],
              ["CONTROL", "what it may execute"],
              ["PROVE", "what happened — and what was prevented"],
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
                title={<>You don't have an AI governance gap. <br />You have an AI <span className="text-gradient">authority</span> gap.</>}
                subtitle="Policies do not enforce themselves. Logs do not reverse actions. Once an agent can act, the security question changes."
              />
            </div>
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              {[
                { t: "Inherited authority", d: "Agents inherit credentials, plugins, browsers, and system permissions. A manipulated agent still possesses enough authority to act." },
                { t: "Detection after the fact", d: "Observability tells you an agent crossed a boundary. By the time the alert fires, the transfer has already completed." },
                { t: "No runtime verification", d: "Nobody re-checks, at the moment of execution, whether this agent may use this credential against this target for this purpose." },
                { t: "Unprovable incidents", d: "After an incident, fragmented logs cannot show what the agent was authorized to do, or whether your controls intervened." },
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
            eyebrow="The product promise"
            title={<>See. Control. Prove.</>}
            subtitle="See what AI agents are doing. Control what they are allowed to do. Prove what happened. Three security functions enterprises need — in one architecture."
          />
          <div className="mt-12 grid md:grid-cols-3 gap-4">
            {[
              { Icon: Eye, k: "01 · Visibility", t: "See", d: "Discover agentic systems, identify their tools and capabilities, establish behavioral baselines, and detect unexpected activity." },
              { Icon: Lock, k: "02 · Control", t: "Control", d: "Evaluate every action before execution and rule dynamically: ALLOW → CONSTRAIN → REQUIRE APPROVAL → DENY → QUARANTINE → LOCK." },
              { Icon: ShieldCheck, k: "03 · Proof", t: "Prove", d: "Cryptographically verifiable evidence of who acted, what authority was evaluated, what policy applied, what occurred — and what was prevented." },
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
            <span className="ml-auto text-muted-foreground">not: Observe → Alert → Investigate</span>
          </div>
        </div>
      </section>

      {/* CASE STUDIES */}
      <section className="border-b border-border/60">
        <div className="container-x py-20 md:py-28">
          <SectionHeading
            eyebrow="Hypothetical case studies"
            title={<>Two incidents. Two attack paths. <br />One <span className="text-gradient">missing boundary</span>.</>}
            subtitle="Not a claim of guaranteed prevention — a stage-by-stage reconstruction of where an enforcement boundary would have ruled, mapped to rule identifiers implemented in the ASAF engine."
          />
          <div className="mt-12 grid lg:grid-cols-2 gap-6">
            <div className="surface-card p-7">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[11px] uppercase tracking-widest text-primary/80">Case study 01</div>
                <span className="font-mono text-[10px] text-muted-foreground">cross-boundary escape</span>
              </div>
              <h3 className="mt-4 font-display text-2xl font-semibold">The OpenAI / Hugging Face crossing</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                A capability evaluation became a real incident: Internet access found, vulnerabilities
                chained, privileges escalated, systems traversed, sensitive data reached across an
                organizational boundary.
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
                The failure was not that the model was fooled. The failure was that a fooled model still
                held credentials, files, plugins, a browser, and tool execution — and nothing stood
                between the instruction and the transfer.
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
            Read both reconstructions <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* THE PRIVILEGED DAEMON */}
      <section className="border-b border-border/60">
        <div className="container-x py-20 md:py-28">
          <SectionHeading
            eyebrow="The enforcement plane"
            title={<>If the system detects a violation, <br />what actually <span className="text-gradient">stops</span> the agent?</>}
            subtitle="A privileged daemon sits beneath the agent runtime. The agent may decide it wants to call a tool. It does not thereby receive permission to execute."
          />
          <div className="mt-12 grid lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-5">
              <Eyebrow>The daemon asks, every call</Eyebrow>
              <ul className="mt-5 space-y-2 text-sm text-foreground/90">
                {[
                  "Who is the agent, and is it cryptographically identifiable?",
                  "Which tenant, environment, and policy domain does it belong to?",
                  "Which capabilities is it authorized to use?",
                  "Is this tool approved, and this action within scope?",
                  "Does the action create unacceptable risk or exceed the data-class ceiling?",
                  "Is human approval required?",
                  "Has it drifted from its behavioral baseline?",
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
                <Eyebrow>Then it rules — before execution</Eyebrow>
                <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 font-mono text-xs">
                  {["ALLOW", "CONSTRAIN", "REQUIRE APPROVAL", "DENY", "QUARANTINE", "LOCK"].map((s, i, a) => (
                    <span key={s} className="inline-flex items-center gap-2">
                      <span className="px-2 py-1 rounded border border-primary/40 text-primary">{s}</span>
                      {i < a.length - 1 && <span className="text-muted-foreground">→</span>}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
                  A denied action is not an alert about an action. The call never runs. Egress to an
                  unapproved destination fails at the transport, not in a report.
                </p>
              </Card>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  ["Attestation answers", "What happened?"],
                  ["Governance answers", "What should be allowed?"],
                  ["The daemon answers", "What is allowed to happen right now?"],
                ].map(([k, v], i) => (
                  <Card key={k} className={i === 2 ? "border-primary/40" : ""}>
                    <div className="font-mono text-[11px] uppercase tracking-widest text-primary/80">{k}</div>
                    <p className="mt-3 font-display text-lg">{v}</p>
                  </Card>
                ))}
              </div>
              <Card>
                <p className="text-base text-foreground/90 leading-relaxed">
                  KHEPRA ASAF combines all three: what happened, what was authorized, what was
                  prevented — and cryptographic proof of each.
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
            title={<>You do not have to kill the agent. <br />You can reduce its authority.</>}
            subtitle="Most organizations will not permanently disable a productive agent. They need to dial its authority down the moment its behavior changes — and dial it back up deliberately, by a named human."
          />
          <div className="mt-12 grid md:grid-cols-5 gap-3">
            {[
              ["NORMAL", "Approved knowledge bases, authorized APIs, draft reports, approved tools."],
              ["ELEVATED", "Drift or injection indicators. State-changing actions held for approval."],
              ["RESTRICTED", "Repeat violations. Read-only. Writes refused."],
              ["QUARANTINED", "Session isolated. Even benign reads refused."],
              ["LOCKED", "Credentials invalidated. Forensic state preserved."],
            ].map(([s, d], i) => (
              <Card key={s} className={i >= 3 ? "border-primary/30" : ""}>
                <div className="font-mono text-[11px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-2 font-mono text-sm text-primary">{s}</div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted-foreground max-w-3xl">
            Escalation is monotonic — containment never loosens as a side effect of evaluation. Only an
            explicit operator reinstatement restores authority, and that reinstatement is itself
            attested with the approver's identity.
          </p>
        </div>
      </section>

      {/* CATEGORY COMPARISON */}
      <section className="border-b border-border/60">
        <div className="container-x py-20 md:py-28">
          <SectionHeading
            eyebrow="The category"
            title={<>Policies do not enforce themselves. <br />Logs do not reverse actions.</>}
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
                  ["AI governance", "What should be allowed?", "Policy may not control execution"],
                  ["AI observability", "What did the agent do?", "Detection may occur after action"],
                  ["AI guardrails", "What should the model say?", "Tool use and downstream actions remain exposed"],
                  ["SIEM and logging", "What happened?", "The action may already be complete"],
                ].map(([a, b, c]) => (
                  <tr key={a} className="border-b border-border/40">
                    <td className="px-5 py-4 text-foreground/90">{a}</td>
                    <td className="px-5 py-4 text-muted-foreground">{b}</td>
                    <td className="px-5 py-4 text-muted-foreground">{c}</td>
                  </tr>
                ))}
                <tr className="bg-primary/5">
                  <td className="px-5 py-4 font-semibold text-primary">KHEPRA ASAF</td>
                  <td className="px-5 py-4 text-foreground/90">What is allowed to happen now?</td>
                  <td className="px-5 py-4 text-foreground/90">Controls, attests, and preserves proof at the agent-action boundary</td>
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
            eyebrow="Five planes · one fabric"
            title={<>The Autonomous Governance Fabric.</>}
            subtitle="KHEPRA coordinates governance across five cryptographic planes. No orchestration logic, no AI reasoning — pure governance coordination from intent to attested outcome."
          />
          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { Icon: ScrollText, t: "Intent Plane", d: "Missions, desired states, and constraints declared before any action. Every GST begins with a signed intent." },
              { Icon: KeyRound, t: "Identity Plane", d: "PQC identities for agents and humans, brokered under the Adinkra symbol hierarchy for bounded privilege." },
              { Icon: Shield, t: "Policy Plane", d: "Authorization rules and compliance frameworks compiled to code. Bounded scope, versioned, fail-closed." },
              { Icon: Cpu, t: "Actuation Plane", d: "The ASAF Runtime — the privileged governance kernel. Fail-closed execution with pre/post state verification." },
              { Icon: Fingerprint, t: "Evidence Plane", d: "Canonically-serialized AEOs written to the Proof Ledger. Content-addressed, replayable, no phone-home." },
              { Icon: GitBranch, t: "Governance Graph", d: "Intent → Policy → Privilege → Execution → Attestation → Outcome. Continuous, cryptographically verifiable." },
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
              title={<>Every state transition <br />is an Agent Evidence Object.</>}
              subtitle="Like Bitcoin has transactions, KHEPRA has AEOs. Each GST produces exactly one canonically-serialized, ML-DSA-65 signed evidence object, hash-linked to its parent on the append-only Proof Ledger."
            />
            <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
              {[
                ["100%", "state transitions attested"],
                ["ML-DSA-65", "post-quantum signatures"],
                ["∞", "independently replayable"],
                ["0", "trusted intermediaries"],
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
              title={<>Real traction. <br />Real cryptographic evidence.</>}
              subtitle="KHEPRA's PQC MCP server is deployed on Smithery — the largest public registry for Model Context Protocol tools. Every metric below is measured, not marketed."
            />
            <a
              href="https://smithery.ai/servers/skone/pqc-khepra-mcp#usage"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-mono"
            >
              View on Smithery <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { k: "93", suffix: "/100", label: "Registry score" },
              { k: "99.9", suffix: "%", label: "Uptime (30d)" },
              { k: "418", suffix: "ms", label: "p50 latency" },
              { k: "72", suffix: "", label: "Tools exposed" },
              { k: "944", suffix: "", label: "Attested calls" },
              { k: "2,341", suffix: "", label: "Sessions" },
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
                Every call becomes a signed DAG node.
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                The Stargate Console mirrors Smithery traffic into your private trust graph: every
                MCP tool invocation is anchored with a SHA-256 attestation, one-click replayable,
                and audit-exportable as CKLB + evidence manifest.
              </p>
              <div className="mt-auto pt-6 flex flex-wrap gap-3">
                <Link
                  to="/console/mcp"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors glow-ring"
                >
                  <Activity className="h-4 w-4" /> Open MCP Fabric
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
            title={<>Two flagships. One protocol.</>}
            subtitle="Built on KHEPRA's trust primitives. Interoperable with your existing stack via certified connectors."
          />
          <div className="mt-12 grid lg:grid-cols-2 gap-6">
            <ProductCard
              badge="Product 01"
              icon={Shield}
              title="AdinKhepra"
              tagline="CMMC Compliance Autopilot & Attestation Engine"
              body="Continuous CMMC control monitoring with signed evidence, auto-generated SSPs, and cryptographic attestation of every control state — reviewer-ready, always."
              to="/products/adinkhepra"
            />
            <ProductCard
              badge="Product 02"
              icon={Camera}
              title="SouHimBou AI"
              tagline="Runtime Enforcement, Containment & Flight Recorder for AI Agents"
              body="The privileged daemon at the agent-action boundary: it authorizes or refuses each tool call before execution, contains agents that drift, and records the whole decision chain as replayable signed evidence."
              to="/products/souhimbou"
            />
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
                Signed integrations across your stack.
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every connector ships with a signed manifest, capability scope, and per-call attestation.
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
              title={<>Four questions your clients are already asking.</>}
              subtitle="Deliver a security control layer for customer AI systems — not another dashboard. Multi-tenant, client-specific policy domains, and evidence you can hand to their auditor."
            />
          </div>
          <div className="lg:col-span-7 space-y-3">
            {[
              ["Can it find AI?", "Yes — AI and agent attack-surface discovery across the client estate."],
              ["Can it audit AI against policy?", "Yes — continuous policy evaluation and behavioral attestation per tenant."],
              ["Can it enforce policy?", "Yes — privileged runtime enforcement with approval gates, capability restriction, denial, isolation, and lockdown."],
              ["Can it prove enforcement occurred?", "Yes — signed, DAG-backed evidence and forensic replay, exportable for client reporting and incident response."],
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
              subtitle="If your agents cannot access sensitive data, call privileged APIs, modify infrastructure, execute tools, reach customer environments, or trigger consequential workflows — traditional governance and logging may be sufficient."
            />
            <div className="mt-8 space-y-3">
              {[
                "Who verifies its authority at runtime?",
                "Who constrains it when its behavior changes?",
                "Who stops an unauthorized action before it becomes an incident?",
                "After an incident, can you prove what the agent was authorized to do?",
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
              title={<>Your AI program is moving faster than your control architecture.</>}
              subtitle="Leaders are approving systems that access proprietary data, interact with customers, invoke APIs, modify cloud resources, and execute operational workflows — while relying on policy documents, application-level guardrails, fragmented logs, and manual reconstruction."
            />
            <Card className="mt-8 border-primary/30">
              <p className="text-base text-foreground/90 leading-relaxed">
                If an autonomous agent takes an unauthorized action tomorrow, can you show what it was
                allowed to do, what it actually did, and whether your controls intervened?
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                KHEPRA ASAF is designed to make that answer defensible.
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
                <Eyebrow>AI Agent Authority Assessment</Eyebrow>
                <h3 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">
                  Before your AI agents receive more authority, give your enterprise a way to control it.
                </h3>
                <p className="mt-4 text-muted-foreground max-w-xl">
                  We help you identify where autonomous agents operate, what tools and data they can
                  reach, where authority is inherited or excessive, where prompt injection becomes tool
                  execution, where policy lacks runtime enforcement, and where forensic replay is incomplete.
                </p>
              </div>
              <div className="lg:col-span-4 flex lg:justify-end flex-wrap gap-3">
                <Link to="/contact" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors glow-ring">
                  Assess Your Agent Attack Surface <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/contact" className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-6 py-3.5 text-sm font-medium text-foreground hover:bg-card transition-colors">
                  Schedule an Architecture Briefing
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
        Explore <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
