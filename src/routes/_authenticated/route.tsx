import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedGate,
});

function AuthenticatedGate() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const intendedPathRef = useRef(pathname);
  const [status, setStatus] = useState<"checking" | "allowed">("checking");

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        window.setTimeout(() => {
          navigate({ to: "/auth", search: { redirect: intendedPathRef.current }, replace: true });
        }, 0);
        return;
      }
      setStatus("allowed");
    });

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