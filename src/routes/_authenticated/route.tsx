import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedGate,
});

function AuthenticatedGate() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "allowed">("checking");

  useEffect(() => {
    let active = true;

    const redirectToAuth = () => {
      const intendedPath = window.location.pathname.startsWith("/console")
        ? `${window.location.pathname}${window.location.search}`
        : "/console/timeline";
      navigate({ to: "/auth", search: { redirect: intendedPath }, replace: true });
    };

    // getSession() reads the persisted session locally, so an unauthenticated
    // visitor is redirected immediately instead of blocking on a network round
    // trip. Wrapped so a rejected promise — or a supabase client that throws
    // synchronously (e.g. missing env vars) — fails safe to /auth rather than
    // leaving the gate stuck on "Verifying console access…" forever.
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;
        if (error || !data.session) {
          redirectToAuth();
          return;
        }
        setStatus("allowed");
      } catch {
        if (active) redirectToAuth();
      }
    })();

    return () => {
      active = false;
    };
  }, [navigate]);

  if (status === "checking") {
    return (
      <div className="console-shell flex min-h-[60vh] items-center justify-center" style={{ background: "var(--nx-bg)" }}>
        <div className="cs-mono uppercase" style={{ color: "var(--nx-text2)", fontSize: 11, letterSpacing: 2 }}>
          Verifying console access…
        </div>
      </div>
    );
  }

  return <Outlet />;
}