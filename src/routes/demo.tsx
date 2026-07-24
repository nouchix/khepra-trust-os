import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "KHEPRA Trust OS — Live Public Demo" },
      {
        name: "description",
        content:
          "Invoke a read-only subset of the KHEPRA Trust Fabric without signing up. Every call is anchored on the shared evidence DAG and shown in the Console.",
      },
      { property: "og:title", content: "KHEPRA Trust OS — Live Public Demo" },
      {
        property: "og:description",
        content:
          "Read-only public demo of the KHEPRA Trust Fabric — SHA-256 anchored, replayable, no login required.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DemoPage,
});

type DemoResult = {
  verdict: "ok" | "error";
  durationMs: number;
  responseSha256: string;
  error: string | null;
  result: unknown;
  evidence: {
    tenant: string;
    sessionRef: string | null;
    toolAeoId: string | null;
    attestAeoId: string | null;
  };
};

async function callDemo(tool: string, args: Record<string, unknown>): Promise<DemoResult> {
  const res = await fetch("/api/public/demo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tool, args }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }
  return (await res.json()) as DemoResult;
}

function DemoPage() {
  const [controls, setControls] = useState<DemoResult | null>(null);
  const [stig, setStig] = useState<DemoResult | null>(null);
  const [family, setFamily] = useState("");
  const [stigId, setStigId] = useState("application_security_and_development");
  const [busy, setBusy] = useState<"controls" | "stig" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(tool: "list_controls" | "khepra_query_stig") {
    setError(null);
    setBusy(tool === "list_controls" ? "controls" : "stig");
    try {
      const args =
        tool === "list_controls"
          ? family
            ? { family }
            : {}
          : { stig_id: stigId };
      const r = await callDemo(tool, args);
      if (tool === "list_controls") setControls(r);
      else setStig(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Public Demo · No login"
        title={<>Try the Trust Fabric live.</>}
        subtitle="Two read-only tools from the KHEPRA MCP server, exposed without auth. Every call is SHA-256 anchored to the shared evidence DAG and viewable in the Console."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-16 grid lg:grid-cols-2 gap-8">
          <Card>
            <Eyebrow>Tool · list_controls</Eyebrow>
            <h3 className="mt-3 font-display text-xl font-semibold">CMMC 2.0 control catalog</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Returns the canonical control set the AdinKhepra engine assesses against. Filter by family to narrow.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <input
                value={family}
                onChange={(e) => setFamily(e.target.value)}
                placeholder="Filter by family (optional)"
                className="flex-1 rounded-md border border-border bg-background/60 px-3 py-2 text-sm"
              />
              <button
                onClick={() => run("list_controls")}
                disabled={busy === "controls"}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {busy === "controls" ? "Running…" : "Run"}
              </button>
            </div>
            {controls && <ResultBlock r={controls} />}
          </Card>

          <Card>
            <Eyebrow>Tool · khepra_query_stig</Eyebrow>
            <h3 className="mt-3 font-display text-xl font-semibold">DISA STIG lookup</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Proxied read against the STIG Viewer catalog. The response is hashed and anchored on the DAG so downstream replays can prove parity.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <input
                value={stigId}
                onChange={(e) => setStigId(e.target.value)}
                placeholder="stig_id"
                className="flex-1 rounded-md border border-border bg-background/60 px-3 py-2 text-sm font-mono"
              />
              <button
                onClick={() => run("khepra_query_stig")}
                disabled={busy === "stig"}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {busy === "stig" ? "Running…" : "Run"}
              </button>
            </div>
            {stig && <ResultBlock r={stig} />}
          </Card>
        </div>
        {error && (
          <div className="container-x pb-8 text-sm text-red-400">Error: {error}</div>
        )}
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-16">
          <SectionHeading
            eyebrow="What just happened"
            title="Every call left a signed trail."
          />
          <div className="mt-8 grid md:grid-cols-3 gap-4 text-sm">
            {[
              ["1 · Invoke", "You hit /api/public/demo — a read-only, rate-limited public endpoint on the KHEPRA fabric."],
              ["2 · Anchor", "The response bytes were SHA-256 hashed and emitted as two AEO nodes (tool + attest) into the demo tenant's DAG."],
              ["3 · Replay", "Sign in and open /console/timeline — the public-demo session is pre-seeded with your calls, ready to replay and verify."],
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

function ResultBlock({ r }: { r: DemoResult }) {
  const preview = JSON.stringify(r.result, null, 2);
  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <span>
          verdict:{" "}
          <span className={r.verdict === "ok" ? "text-emerald-400" : "text-red-400"}>
            {r.verdict}
          </span>
        </span>
        <span className="text-muted-foreground">{r.durationMs}ms</span>
        <span className="font-mono text-muted-foreground truncate max-w-full">
          sha256:{r.responseSha256.slice(0, 24)}…
        </span>
        {r.evidence.sessionRef && (
          <span className="text-muted-foreground">
            session: <span className="font-mono">{r.evidence.sessionRef}</span>
          </span>
        )}
      </div>
      <pre className="max-h-72 overflow-auto rounded-md border border-border bg-background/60 p-3 text-xs font-mono leading-relaxed">
        {preview.length > 4000 ? preview.slice(0, 4000) + "\n…" : preview}
      </pre>
    </div>
  );
}