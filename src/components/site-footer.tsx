import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="container-x py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-mono text-[13px] font-bold">
              K
            </span>
            <span className="font-display font-semibold">KHEPRA</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            Find every AI agent. Control it. Prove it. See. Control. Prove.
          </p>
          <p className="mt-4 text-xs text-muted-foreground/80 max-w-xs leading-relaxed">
            SecRed Knowledge Inc. d/b/a NouchiX — veteran-led cybersecurity and sovereign
            engineering.
          </p>
          <p className="mt-4 font-mono text-[11px] text-muted-foreground/70 leading-relaxed">
            adinkhepra.com · souhimbou.ai · nouchix.com
            <br />
            UEI 24M6XQCZLYM7 · DUNS 119450090
          </p>
        </div>

        <FooterCol
          title="Protocol"
          items={[
            { to: "/protocol", label: "Overview" },
            { to: "/asaf", label: "ASAF Architecture" },
            { to: "/trust-network", label: "Trust Network" },
            { to: "/roadmap", label: "Roadmap" },
          ]}
        />
        <FooterCol
          title="Products"
          items={[
            { to: "/products/adinkhepra", label: "AdinKhepra" },
            { to: "/products/souhimbou", label: "SouHimBou AI" },
            { to: "/connectors", label: "Certified Connectors" },
            { to: "/pricing", label: "Enterprise" },
          ]}
        />
        <FooterCol
          title="Build"
          items={[
            { to: "/developers", label: "Developer Portal" },
            { to: "/docs", label: "Documentation" },
            { to: "/about", label: "Company" },
            { to: "/contact", label: "Book a briefing" },
          ]}
        />
      </div>
      <div className="border-t border-border/60">
        <div className="container-x py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} SecRed Knowledge Inc. (NouchiX). All rights reserved.</div>
          <div className="font-mono">
            USPTO Patent Pending #73565085 · Pending SDVOSB · NIST/CMMC-ready
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { to: string; label: string }[] }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70">
        {title}
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((it, i) => (
          <li key={i}>
            <Link
              to={it.to}
              className="text-sm text-foreground/80 hover:text-foreground transition-colors"
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}