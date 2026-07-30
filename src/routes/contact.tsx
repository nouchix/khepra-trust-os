import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero, Eyebrow, Card } from "@/components/section";
import { Mail, ShieldCheck, Building2, Code2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — KHEPRA Trust Network" },
      { name: "description", content: "Contact the KHEPRA team regarding alpha access, enterprise deployments, connector certification, technical partnerships, and media inquiries." },
      { property: "og:title", content: "Contact — KHEPRA Trust Network" },
      { property: "og:description", content: "Contact the KHEPRA team regarding alpha access, enterprise deployments, connector certification, technical partnerships, and media inquiries." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <>
      <PageHero
        eyebrow="Contact KHEPRA"
        title={<>Contact KHEPRA Trust Network — <span className="text-gradient">Get in Touch</span></>}
        subtitle="Alpha access, enterprise deployment, connector partnership, certification, or press — reach the right person on the first hop."
      />

      <section className="border-b border-border/60">
        <div className="container-x py-16 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-4">
            {[
              { Icon: ShieldCheck, t: "Alpha access", d: "Design-partner cohort for AdinKhepra and SouHimBou AI.", email: "alpha@khepra.network" },
              { Icon: Building2, t: "Enterprise", d: "Regulated, sovereign, or hybrid deployments.", email: "enterprise@khepra.network" },
              { Icon: Code2, t: "Partners & certification", d: "Connector publishing and Trust Network certification.", email: "partners@khepra.network" },
              { Icon: Mail, t: "Press & speaking", d: "Media, analyst briefings, conferences.", email: "press@khepra.network" },
            ].map(({ Icon, t, d, email }) => (
              <Card key={t}>
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/30 shrink-0">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-display font-semibold">{t}</div>
                    <div className="text-sm text-muted-foreground">{d}</div>
                    <a href={`mailto:${email}`} className="mt-2 inline-block font-mono text-xs text-primary hover:underline break-all">
                      {email}
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-7">
            <div className="surface-card p-8">
              <Eyebrow>Send a message</Eyebrow>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">Tell us what you're building.</h2>
              {submitted ? (
                <div className="mt-8 rounded-md border border-primary/40 bg-primary/5 p-6 text-sm text-foreground/90">
                  Thanks — we've got it. Someone from the KHEPRA team will follow up within one business day.
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
                      <option>Alpha access</option>
                      <option>Enterprise deployment</option>
                      <option>Certification / partnership</option>
                      <option>Press</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Message</span>
                    <textarea
                      name="message"
                      rows={5}
                      required
                      placeholder="What are you trying to attest?"
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