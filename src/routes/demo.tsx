import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";
import { FabricConsole } from "@/components/fabric-console";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "KHEPRA Trust OS — Live Public Demo" },
      {
        name: "description",
        content:
          "Try a read-only slice of KHEPRA with no signup. Watch every call get locked into the shared evidence chain.",
      },
      { property: "og:title", content: "KHEPRA Trust OS — Live Public Demo" },
      {
        property: "og:description",
        content:
          "See the KHEPRA Trust Fabric in action. SHA-256 locked, replayable, no login required.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DemoPage,
});

function DemoPage() {
  return (
    <>
      <PageHero
        eyebrow="Public Demo · No login"
        title={<>KHEPRA Trust OS — <span className="text-gradient">Live Public Demo</span></>}
        subtitle="Watch an AI agent build a proof trail you can check step by step. Quantum-safe identity. Hash-chained evidence. Every record is built, hashed, and signed by our server. Your browser just shows it to you. No login needed."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-12">
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
                <iframe src="/dvws-fair-dag.html" className="w-full h-full border-0" />
             </div>
          </div>

          <div>
             <h3 className="text-xl font-bold mb-4">Target 2: PentestGPT Incident</h3>
             <div className="rounded-xl overflow-hidden border border-border bg-background aspect-[21/9] shadow-2xl">
                <iframe src="/pentestgpt-fair-dag.html" className="w-full h-full border-0" />
             </div>
          </div>

          <div>
             <h3 className="text-xl font-bold mb-4">Target 3: HackGPT Incident</h3>
             <div className="rounded-xl overflow-hidden border border-border bg-background aspect-[21/9] shadow-2xl">
                <iframe src="/hackgpt-fair-dag.html" className="w-full h-full border-0" />
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
    </>
  );
}
