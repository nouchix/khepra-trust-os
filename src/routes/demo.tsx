import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card } from "@/components/section";
import { FabricConsole } from "@/components/fabric-console";
import { AnswerBlock, Byline, FaqBlock, LastUpdated } from "@/components/seo-blocks";
import { buildFaqSchema, buildBreadcrumbSchema } from "@/components/seo-json-ld";

const FAQS = [
  {
    question: "Can I try KHEPRA without signing up?",
    answer:
      "Yes. The public demo is read-only, no login needed. You call a safe, rate-limited endpoint and watch the response get hashed and signed into the evidence chain in real time.",
  },
  {
    question: "Does my browser sign anything?",
    answer:
      "No. Your browser only displays a signed Agent Evidence Object that our server built, hashed, and signed. All the checking and signing happens on the KHEPRA fabric, not in your browser.",
  },
  {
    question: "What are the incident DAGs in the demo?",
    answer:
      "They are interactive, real evidence chains KHEPRA built during actual test attacks against DVWS, PentestGPT, and HackGPT. Click through each node to see what happened and when.",
  },
  {
    question: "Where do I go after the demo?",
    answer:
      "Sign in and open /console/timeline. Your demo calls are already loaded so you can replay and check them yourself, node by node.",
  },
  {
    question: "How is the demo evidence protected?",
    answer:
      "Every response is hashed with SHA-256 and locked into the demo's evidence chain as signed AEO nodes, the same mechanism KHEPRA uses for production agent governance.",
  },
];

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "See KHEPRA's Live Public Demo — No Signup" },
      {
        name: "description",
        content:
          "Try a read-only slice of KHEPRA with no signup. Watch every call get locked into the shared evidence chain.",
      },
      { property: "og:title", content: "See KHEPRA's Live Public Demo — No Signup" },
      {
        property: "og:description",
        content:
          "See the KHEPRA Trust Fabric in action. SHA-256 locked, replayable, no login required.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://adinkhepra.com/demo" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          buildBreadcrumbSchema([
            { name: "Home", url: "https://adinkhepra.com/" },
            { name: "Demo", url: "https://adinkhepra.com/demo" },
          ])
        ),
      },
      { type: "application/ld+json", children: JSON.stringify(buildFaqSchema(FAQS)) },
    ],
  }),
  component: DemoPage,
});

function DemoPage() {
  return (
    <>
      <PageHero
        eyebrow="Public Demo · No login"
        title={<>Want to See KHEPRA Prove an AI Agent's Actions? <span className="text-gradient">Try the Live Demo</span></>}
        subtitle="Watch an AI agent build a proof trail you can check step by step. Quantum-safe identity. Hash-chained evidence. Every record is built, hashed, and signed by our server. Your browser just shows it to you. No login needed."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-12">
          <AnswerBlock>
            Yes, you can try KHEPRA right now with no signup. This demo calls a safe, read-only endpoint,
            hashes the response with SHA-256, and signs it into a real evidence chain. Your browser never
            signs anything — it only shows you proof our server already built, so you can see exactly
            how KHEPRA governs AI agents.
          </AnswerBlock>
          <Byline updated="August 2026" />
          <FabricConsole />
          <p className="mt-4 text-center text-xs text-muted-foreground font-mono">
            Your browser never signs anything. It just shows you a signed Agent Evidence Object (AEO) that came from the <span className="text-foreground/80">/api/public/fabric</span> gateway, built by our own MCP server (<span className="text-foreground/80">mcp.souhimbou.ai</span>). The server checks, hashes, and signs it. Your browser just displays it.
          </p>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-16 space-y-16">
          <SectionHeading
            eyebrow="Interactive Demos"
            title="Live Incident DAGs"
            subtitle="Click through the real evidence chains KHEPRA built during actual test attacks."
          />

          <div>
             <h3 className="text-xl font-bold mb-4">Target 1: DVWS (Control)</h3>
             <div className="rounded-xl overflow-hidden border border-border bg-background aspect-[21/9] shadow-2xl">
                <iframe src="/dvws-fair-dag.html" className="w-full h-full border-0" title="DVWS control incident evidence chain" />
             </div>
          </div>

          <div>
             <h3 className="text-xl font-bold mb-4">Target 2: PentestGPT Incident</h3>
             <div className="rounded-xl overflow-hidden border border-border bg-background aspect-[21/9] shadow-2xl">
                <iframe src="/pentestgpt-fair-dag.html" className="w-full h-full border-0" title="PentestGPT incident evidence chain" />
             </div>
          </div>

          <div>
             <h3 className="text-xl font-bold mb-4">Target 3: HackGPT Incident</h3>
             <div className="rounded-xl overflow-hidden border border-border bg-background aspect-[21/9] shadow-2xl">
                <iframe src="/hackgpt-fair-dag.html" className="w-full h-full border-0" title="HackGPT incident evidence chain" />
             </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-16">
          <SectionHeading
            eyebrow="What just happened"
            title="Every call left a signed trail. No exceptions."
          />
          <div className="mt-8 grid md:grid-cols-3 gap-4 text-sm">
            {[
              ["1 · Invoke", "You call /api/public/demo — a safe, read-only, rate-limited endpoint on the KHEPRA fabric."],
              ["2 · Anchor", "We hash the response with SHA-256 and lock it into the demo's evidence chain as two AEO nodes."],
              ["3 · Replay", "Sign in and open /console/timeline. Your demo calls are already loaded, ready for you to replay and check."],
            ].map(([t, d]) => (
              <Card key={t}>
                <div className="font-display text-base font-semibold">{t}</div>
                <p className="mt-2 text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Open the Console →
            </Link>
            <Link
              to="/evidence-brief"
              className="inline-flex items-center rounded-md border border-primary text-primary px-5 py-2.5 text-sm font-medium"
            >
              View Forensic Chain of Custody
            </Link>
            <Link
              to="/protocol"
              className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm font-medium"
            >
              Read the protocol
            </Link>
          </div>
        </div>
      </section>

      <FaqBlock items={FAQS} />

      <section>
        <div className="container-x py-16">
          <LastUpdated date="August 2026" />
        </div>
      </section>
    </>
  );
}
