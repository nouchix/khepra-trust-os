import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Shield, Fingerprint, GitBranch, Camera, Cpu, KeyRound, ScrollText, Activity, ExternalLink } from "lucide-react";
import heroImg from "@/assets/hero-scarab.jpg";
import { Eyebrow, SectionHeading, Card } from "@/components/section";
import { TrustGraph } from "@/components/trust-graph";
import { EgyptianDivider } from "@/components/egyptian-divider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KHEPRA Trust Network — Trust OS for Autonomous Work" },
      { name: "description", content: "Protocol-first cryptographic identity, policy enforcement, provenance, and immutable attestation for AI agents and enterprise systems." },
      { property: "og:title", content: "KHEPRA Trust Network — Trust OS for Autonomous Work" },
      { property: "og:description", content: "Protocol-first cryptographic identity, policy enforcement, provenance, and immutable attestation for AI agents and enterprise systems." },
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
          <Eyebrow>Trust Operating System · v0.1 Alpha</Eyebrow>
          <h1 className="mt-6 text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02] max-w-4xl">
            Trust, made <span className="text-gradient">executable</span>
            <br />
            for autonomous work.
          </h1>
          <p className="mt-7 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            KHEPRA is a protocol-first trust network: cryptographic identity, policy enforcement,
            provenance, and immutable DAG-backed attestation for every AI agent, connector, and
            enterprise system in your operation.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/protocol"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors glow-ring"
            >
              Read the Protocol <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-5 py-3 text-sm font-medium text-foreground hover:bg-card transition-colors"
            >
              Explore the Platform
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
            {[
              ["PQC", "Post-quantum identity"],
              ["DAG", "Immutable attestation"],
              ["OPA", "Policy enforcement"],
              ["Replay", "Full agent evidence"],
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
                title={<>Autonomous systems <br />outrun human oversight.</>}
              />
            </div>
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              {[
                { t: "Unverifiable actions", d: "Agents call tools and mutate systems without cryptographic proof of who acted, on whose behalf, or under what policy." },
                { t: "No shared evidence", d: "SIEMs capture logs, not intent. Auditors ask for provenance the stack cannot produce." },
                { t: "Policy in prompts", d: "Guardrails written in natural language are advisory, not enforced. Every model change is a compliance change." },
                { t: "Broken chain of custody", d: "Retrieval, tool calls, and downstream writes have no shared identity graph across vendors." },
              ].map((it) => (
                <Card key={it.t}>
                  <div className="font-mono text-[11px] uppercase tracking-widest text-primary/80">01 · gap</div>
                  <div className="mt-3 font-display text-lg font-semibold">{it.t}</div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{it.d}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROTOCOL PILLARS */}
      <section className="border-b border-border/60">
        <div className="container-x py-20 md:py-28">
          <SectionHeading
            eyebrow="Protocol pillars"
            title={<>Six primitives. One trust plane.</>}
            subtitle="KHEPRA collapses identity, policy, provenance, and evidence into a single protocol so every actor — human, agent, or system — participates on the same signed graph."
          />
          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { Icon: KeyRound, t: "PQC Identity", d: "Post-quantum signing keys per actor, workload, and tool. Verifiable, revocable, portable." },
              { Icon: Shield, t: "Policy Engine", d: "OPA/Rego + declarative allow/deny. Every action is authorized against a versioned policy set." },
              { Icon: Fingerprint, t: "Provenance", d: "Signed lineage for every prompt, retrieval, tool call, and mutation — attached to a canonical actor graph." },
              { Icon: GitBranch, t: "DAG Attestation", d: "Immutable, hash-linked directed acyclic graph. Tamper-evident by construction, replayable end-to-end." },
              { Icon: ScrollText, t: "Evidence Recorder", d: "Structured, queryable evidence packages for auditors, incident response, and model governance." },
              { Icon: Cpu, t: "Agent Runtime", d: "Sandboxed execution with signed tool manifests, mediated I/O, and per-step attestation hooks." },
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
              eyebrow="The trust graph"
              title={<>Every action becomes <br />a signed, replayable node.</>}
              subtitle="KHEPRA writes every authorized action to an append-only DAG. Nodes are hash-linked, cryptographically signed, and cross-referenced across actors — so evidence is native, not reconstructed."
            />
            <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
              {[
                ["100%", "actions attested"],
                ["<50ms", "policy decision"],
                ["∞", "replayable history"],
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
              rel="noreferrer"
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
              tagline="Security Camera & Flight Recorder for AI Agents"
              body="Records every prompt, retrieval, tool call, and mutation as a replayable signed timeline. Detect drift, prove intent, and reconstruct incidents step by step."
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
                <Eyebrow>Design partners · Q3 cohort open</Eyebrow>
                <h3 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">
                  Bring cryptographic trust to your autonomous stack.
                </h3>
                <p className="mt-4 text-muted-foreground max-w-xl">
                  Join the KHEPRA alpha for early access to AdinKhepra, SouHimBou AI, and the trust protocol SDKs.
                </p>
              </div>
              <div className="lg:col-span-4 flex lg:justify-end">
                <Link to="/developers" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors glow-ring">
                  Request Access <ArrowRight className="h-4 w-4" />
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
