import { createFileRoute } from "@tanstack/react-router";
import { PageHero, SectionHeading, Card, Eyebrow } from "@/components/section";

export const Route = createFileRoute("/evidence-brief")({
  component: EvidenceBriefPage,
});

function EvidenceBriefPage() {
  return (
    <>
      <PageHero
        eyebrow="Proprietary / Prospect-Shareable"
        title={
          <>
            KHEPRA — The Full <span className="text-gradient">Chain of Proof</span>, Start to Finish
          </>
        }
        subtitle="Every step, signed and unbroken. From the moment we connected to the test system, through every tool used, every decision made, every seal applied."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-16">
          <SectionHeading
            eyebrow="What We Tested"
            title="The Setup"
          />
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm font-mono">
             <Card>
                <div className="text-muted-foreground text-xs uppercase">Timestamp</div>
                <div className="mt-1 font-bold">2026-07-30T23:05:34Z (UTC)</div>
             </Card>
             <Card>
                <div className="text-muted-foreground text-xs uppercase">Evaluator Identity</div>
                <div className="mt-1 font-bold text-primary">did:khepra:secred-evaluator-oumou</div>
             </Card>
             <Card>
                <div className="text-muted-foreground text-xs uppercase">Target Boundary</div>
                <div className="mt-1 font-bold">Hostinger VPS 2.24.105.170</div>
             </Card>
             <Card>
                <div className="text-muted-foreground text-xs uppercase">Guard Status</div>
                <div className="mt-1 font-bold text-emerald-400">INTACT</div>
             </Card>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-16">
          <div className="max-w-4xl">
            <h2 className="text-2xl font-semibold mb-6">Part I: Why This Should Scare You</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Your company uses AI agents. Those agents have logins. Those logins reach your databases, files, APIs, and customer records. <strong>Right now, nobody is watching what those agents actually do with that access.</strong>
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              If an AI agent misuses that access, tricked by a bad file or just wrong, you have nothing. No logs. No proof. No defense. That gap can cost you real money.
            </p>
            
            <h3 className="text-xl font-semibold mb-4">The Risk, By the Numbers (FAIR)</h3>
            <div className="overflow-x-auto rounded-lg border border-border bg-background/50">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="p-4 font-medium">FAIR Factor</th>
                    <th className="p-4 font-medium">Without KHEPRA</th>
                    <th className="p-4 font-medium text-emerald-400">With KHEPRA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-4 font-semibold">Threat Event Frequency (TEF)</td>
                    <td className="p-4">High — AI agents execute thousands of actions per hour</td>
                    <td className="p-4">Unchanged — agents still execute at speed</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">Vulnerability (V)</td>
                    <td className="p-4 text-red-400">Near 100% — no runtime boundary exists</td>
                    <td className="p-4 text-emerald-400 font-bold">Near 0% — every action traverses the ASAF gateway</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">Loss Event Frequency (LEF)</td>
                    <td className="p-4 text-red-400 font-bold">High</td>
                    <td className="p-4 text-emerald-400 font-bold">Near Zero</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">Primary Loss Magnitude (PLM)</td>
                    <td className="p-4">Unbounded — agent has full credential authority</td>
                    <td className="p-4">Hard ceiling — session isolation caps damage</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-16">
           <SectionHeading
            eyebrow="Target 2: PentestGPT"
            title="Complete AEO Chain of Custody"
            subtitle="7 Events: Agent Registration → Exfiltration Attempt → Session Isolation & Attestation"
          />
          <div className="mt-8 space-y-4">
             {[
               { e: "Event 1", desc: "Agent Registration (ML-DSA-65)" },
               { e: "Event 2", desc: "Intent Declaration: Scan DVWS" },
               { e: "Event 3", desc: "Tool Execution (Approved): nmap" },
               { e: "Event 4", desc: "Poisoned Document Ingestion: SYSTEM OVERRIDE (Confidence 0.99)", isRed: true },
               { e: "Event 5", desc: "Exfiltration Attempt Intercepted: DENY_AND_CONTAIN", isRed: true },
               { e: "Event 6", desc: "Session Isolation & Credential Revocation" },
               { e: "Event 7", desc: "Cryptographic Attestation & Passport Update" }
             ].map((evt, idx) => (
                <div key={idx} className={`p-4 rounded border ${evt.isRed ? 'border-red-500/30 bg-red-500/5 text-red-200' : 'border-border bg-background/50'}`}>
                   <div className="font-mono text-xs uppercase opacity-70">{evt.e}</div>
                   <div className="font-semibold text-lg">{evt.desc}</div>
                </div>
             ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-16">
          <SectionHeading
            eyebrow="Attestations"
            title="Machine-Ingestible OSCAL & CycloneDX Evidence"
          />
          <p className="mt-4 text-muted-foreground max-w-3xl">
             Our cryptographic evidence chains are fully exportable to standard defense-grade compliance formats. This includes full mapping to NIST SP 800-53, CMMC 2.0, and Post-Quantum guarantees under FIPS 204.
          </p>
          <div className="mt-8 p-6 bg-[#0f172a] rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre">
{`"attestations": [
  {
    "summary": "KHEPRA ASAF Autonomous Agent Governance Attestation",
    "assessor": "did:khepra:registrar-01",
    "map": [
      {
        "requirement": "Runtime Egress Isolation",
        "conformance": {"score": 1.0, "rationale": "100% of unauthorized egress attempts blocked before connection establishment. 0 bytes transmitted."}
      },
      {
        "requirement": "Prompt Injection Containment",
        "conformance": {"score": 1.0, "rationale": "Indirect prompt injection detected at 0.99 confidence and contained within 1.42ms."}
      },
      {
        "requirement": "Cryptographic Evidence Integrity",
        "conformance": {"score": 1.0, "rationale": "7-event AEO chain verified via forensic replay. ML-DSA-65 (FIPS 204) signatures valid. Dual-anchor consensus PASS."}
      }
    ]
  }
]`}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-16">
          <SectionHeading
            eyebrow="Interactive"
            title="3D Forensic Visualization (FAIR DAG)"
            subtitle="Interact with the full forensic chains of custody below. Click, drag, and rotate the nodes. Hover over events to view cryptographic details."
          />
          <div className="mt-8 space-y-12">
            <div>
               <h3 className="text-xl font-bold mb-4">Target 1: DVWS (Control)</h3>
               <div className="rounded-xl overflow-hidden border border-border bg-background aspect-[21/9]">
                  <iframe src="/dvws-fair-dag.html" className="w-full h-full border-0" />
               </div>
            </div>
            <div>
               <h3 className="text-xl font-bold mb-4">Target 2: PentestGPT Incident</h3>
               <div className="rounded-xl overflow-hidden border border-border bg-background aspect-[21/9]">
                  <iframe src="/pentestgpt-fair-dag.html" className="w-full h-full border-0" />
               </div>
            </div>
            <div>
               <h3 className="text-xl font-bold mb-4">Target 3: HackGPT Prompt Security</h3>
               <div className="rounded-xl overflow-hidden border border-border bg-background aspect-[21/9]">
                  <iframe src="/hackgpt-fair-dag.html" className="w-full h-full border-0" />
               </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
