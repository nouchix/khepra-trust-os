import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero, Eyebrow, Card, SectionHeading } from "@/components/section";
import { Mail, Phone, CalendarClock, Globe, ArrowRight } from "lucide-react";
import { JsonLd, buildBreadcrumbSchema, buildFaqSchema } from "@/components/seo-json-ld";
import { AnswerBlock, Byline, LastUpdated, FaqBlock } from "@/components/seo-blocks";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "How Do I Book a Call With KHEPRA? Contact Us" },
      { name: "description", content: "Find out what your AI agents can access before someone else does. Book a call with the KHEPRA team today." },
      { property: "og:title", content: "How Do I Book a Call With KHEPRA? Contact Us" },
      { property: "og:description", content: "See what your AI agents can reach. Get proof your auditors and lawyers will accept." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://adinkhepra.com/contact" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(buildFaqSchema(FAQS)) }],
  }),
  component: ContactPage,
});

const FAQS = [
  {
    question: "How do I book a call with KHEPRA?",
    answer: "Email cybersouhimbou@secredknowledgeinc.tech, call +1-518-528-4019, or grab time directly at calendly.com/cybersouhimbou. Someone from the KHEPRA team will call you back within one business day.",
  },
  {
    question: "Who should reach out to KHEPRA?",
    answer: "MSPs and MSSPs managing multiple clients, organizations with a live or past CMMC requirement, SaaS or eCommerce teams shipping AI agents, and IT or security leaders who own vendor risk.",
  },
  {
    question: "What happens after I submit the contact form?",
    answer: "We read every message. If it's a fit, a real person from the KHEPRA team calls you within one business day to talk through what your agents can reach and what to do about it.",
  },
  {
    question: "Does KHEPRA work with validation partners?",
    answer: "Yes. Validation partners run a real assessment with us, get early access to the product, and get a published case study in return. We're actively looking for one or two right now.",
  },
  {
    question: "Is KHEPRA a real, registered company?",
    answer: "Yes. SAM.gov UEI 24M6XQCZLYM7, a pending SDVOSB filing, a patent-pending application (USPTO #73565085), Claude Partner Network membership, and HPE Tier-2 Solutions Provider status.",
  },
];

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", url: "https://adinkhepra.com/" },
          { name: "Contact", url: "https://adinkhepra.com/contact" },
        ])}
      />
      <PageHero
        eyebrow="Book a call now"
        title={<>How do I see what my AI agents can really reach? Book a call.</>}
        subtitle="We find every agent running in your company. We show you what each one can touch, where it has too much access, and where a bad prompt could turn into a real breach. Then we show you exactly what's missing to stop it."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-10">
          <Byline updated="August 2026" />
          <div className="mt-6">
            <AnswerBlock>
              Email, call, or book time on Calendly directly with our founder. We'll walk through
              which AI agents are running in your company today, what they can touch, and where a
              bad prompt could turn into a breach — then hand you a plan to lock it down before an
              auditor or attacker finds it first.
            </AnswerBlock>
          </div>
          <div className="mt-4">
            <LastUpdated date="August 2026" />
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-16 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-4">
            <Card>
              <Eyebrow>Founder & CEO</Eyebrow>
              <div className="mt-3 font-display text-xl font-semibold">Souhimbou Doh Kone</div>
              <p className="mt-1 text-sm text-muted-foreground">
                SecRed Knowledge Inc. (NouchiX) · SGT, NY Army National Guard
              </p>
              <div className="mt-5 space-y-3">
                {[
                  { Icon: Mail, label: "cybersouhimbou@secredknowledgeinc.tech", href: "mailto:cybersouhimbou@secredknowledgeinc.tech" },
                  { Icon: Phone, label: "+1-518-528-4019", href: "tel:+15185284019" },
                  { Icon: CalendarClock, label: "calendly.com/cybersouhimbou", href: "https://calendly.com/cybersouhimbou" },
                  { Icon: Globe, label: "nouchix.com", href: "https://nouchix.com" },
                  { Icon: Globe, label: "souhimbou.ai", href: "https://souhimbou.ai" },
                ].map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-3 font-mono text-xs text-primary hover:underline break-all"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </a>
                ))}
              </div>
              <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground leading-relaxed">
                Pending SDVOSB · USPTO Patent Pending #73565085 · Claude Partner Network · HPE T2
                Solutions Provider · SAM.gov UEI 24M6XQCZLYM7
              </p>
            </Card>

            <Card>
              <Eyebrow>Who to introduce us to</Eyebrow>
              <ul className="mt-4 space-y-2.5">
                {[
                  "MSPs & MSSPs managing multi-client security",
                  "Organizations with a live or past CMMC requirement",
                  "SaaS / eCommerce teams shipping AI agents",
                  "Companies drafting an AI governance policy",
                  "IT and security leaders who own vendor risk",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-sm text-foreground/90">
                    <span className="font-mono text-primary shrink-0">→</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <div className="surface-card p-8">
              <Eyebrow>Send a message</Eyebrow>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">Tell us what your agents can reach.</h2>
              {submitted ? (
                <div className="mt-8 rounded-md border border-primary/40 bg-primary/5 p-6 text-sm text-foreground/90">
                  Got it. Someone from the KHEPRA team will call you within one business day.
                </div>
              ) : (
                <form
                  className="mt-6 grid gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitted(true);
                  }}
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Name" name="name" placeholder="Full name" required />
                    <Field label="Work email" name="email" type="email" placeholder="you@company.com" required />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Company" name="company" placeholder="Company name" />
                    <Field label="Role" name="role" placeholder="Your role" />
                  </div>
                  <div className="grid gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                      Interest
                    </span>
                    <select
                      name="interest"
                      className="rounded-md border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
                    >
                      <option>AI Agent Authority Assessment</option>
                      <option>Validation partner (early access + case study)</option>
                      <option>MSP / MSSP resale</option>
                      <option>Sovereign CMMC deployment</option>
                      <option>Federal / DIB contracting</option>
                      <option>Press & analyst briefing</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Message</span>
                    <textarea
                      name="message"
                      rows={5}
                      required
                      placeholder="Which agents are running today, and what can they reach?"
                      className="rounded-md border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/60"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors glow-ring w-fit"
                  >
                    Send message <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container-x py-20">
          <SectionHeading
            eyebrow="What we're asking partners for"
            title={<>Introduce us to one or two real decision-makers — <br />not a mass list.</>}
          />
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              ["Priority 01", "A validation partner", "Run a real assessment with us. Get early access and a published case study in return."],
              ["Priority 02", "MSPs & MSSPs", "Sell your clients the AI control layer they are already asking you for."],
              ["Priority 03", "SaaS & AI teams", "Teams running agents in production. Any other good partner fit, tell us too."],
            ].map(([k, t, d]) => (
              <Card key={k}>
                <div className="font-mono text-[11px] uppercase tracking-widest text-primary/80">{k}</div>
                <div className="mt-3 font-display text-lg font-semibold">{t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <FaqBlock items={FAQS} />
    </>
  );
}

function Field({
  label, name, type = "text", placeholder, required,
}: { label: string; name: string; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="grid gap-2">
      <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="rounded-md border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/60"
      />
    </label>
  );
}
