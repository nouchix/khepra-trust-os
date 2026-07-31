import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/threat-model", label: "Threat Model" },
  { to: "/protocol", label: "Protocol" },
  { to: "/evidence-brief", label: "Evidence" },
  { to: "/demo", label: "Demo" },
  { to: "/asaf", label: "ASAF" },
  { to: "/trust-network", label: "Trust Network" },
  { to: "/empty-lane", label: "The Lane" },
  { to: "/products/adinkhepra", label: "AdinKhepra" },
  { to: "/products/souhimbou", label: "SouHimBou" },
  { to: "/connectors", label: "Connectors" },
  { to: "/docs", label: "Docs" },
  { to: "/developers", label: "Developers" },
  { to: "/about", label: "Company" },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-mono text-[13px] font-bold shadow-[0_0_20px_-4px_var(--color-primary)]">
            K
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight">
            KHEPRA<span className="text-muted-foreground font-normal"> / Trust Network</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Link
            to="/contact"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            Book a briefing
          </Link>
          {authed ? (
            <Link
              to="/console/timeline"
              className="inline-flex items-center rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Open Console
            </Link>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

        <button
          className="lg:hidden p-2 text-foreground"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border/60 bg-background/95">
          <div className="container-x py-4 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="py-2 text-sm text-muted-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/developers"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground"
            >
              Request Access
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}