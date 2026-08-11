import type { ReactNode } from "react";

/** 40–60 word direct answer to the page's H1 question. Placed above the fold. */
export function AnswerBlock({ children }: { children: ReactNode }) {
  return (
    <div className="surface-card border-l-2 border-primary/70 p-5 max-w-2xl">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/90">
        Short answer
      </div>
      <p className="mt-2 text-base md:text-lg text-foreground/90 leading-relaxed">{children}</p>
    </div>
  );
}

/** Named author byline so a real person stands behind the page. */
export function Byline({
  name = "Yao Nouchi",
  role = "Founder & Principal Engineer, SecRed Knowledge Inc.",
  credentials = "U.S. Army veteran · Active DoD Secret clearance · CMMC & STIG practitioner",
  href = "/about",
  updated,
}: {
  name?: string;
  role?: string;
  credentials?: string;
  href?: string;
  updated?: string;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <span>
        By{" "}
        <a href={href} className="text-foreground underline underline-offset-4">
          {name}
        </a>
        , {role}
      </span>
      <span className="hidden md:inline text-border">|</span>
      <span className="text-xs">{credentials}</span>
      {updated && (
        <>
          <span className="hidden md:inline text-border">|</span>
          <span className="font-mono text-xs">Last updated {updated}</span>
        </>
      )}
    </div>
  );
}

/** Visible last-updated stamp. */
export function LastUpdated({ date }: { date: string }) {
  return (
    <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
      Last updated {date}
    </p>
  );
}

export interface Faq {
  question: string;
  answer: string;
}

/** Real questions as headings with clean, quotable answers. */
export function FaqBlock({
  items,
  title = "Questions people ask before they buy",
}: {
  items: Faq[];
  title?: string;
}) {
  return (
    <section className="border-b border-border/60">
      <div className="container-x py-16">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">{title}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map((f) => (
            <div key={f.question} className="surface-card p-6">
              <h3 className="font-display text-lg font-semibold">{f.question}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}