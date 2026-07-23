import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NxShield } from "@/components/console/NxShield";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign In · KHEPRA Trust OS Fabric" },
      { name: "description", content: "Access the KHEPRA Stargate Console — the operator surface for the Trust OS Fabric." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const redirectTo = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/console/timeline";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirectTo, replace: true });
    });
  }, [navigate, redirectTo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}${redirectTo}` },
        });
        if (error) throw error;
      }
      navigate({ to: redirectTo, replace: true });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Authentication failed");
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setErr(null);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { setErr(result.error.message ?? "Google sign-in failed"); return; }
    if (result.redirected) return;
    navigate({ to: redirectTo, replace: true });
  }

  return (
    <div className="console-shell min-h-screen flex items-center justify-center px-6" style={{ background: "var(--nx-bg)" }}>
      <div className="w-full max-w-[420px] p-8 rounded-lg" style={{ background: "var(--nx-bg2)", border: "1px solid var(--nx-border2)" }}>
        <div className="flex items-center gap-3 mb-6">
          <NxShield size={32} />
          <div>
            <div className="font-semibold tracking-[1px]" style={{ color: "var(--nx-blue)", fontSize: 15 }}>KHEPRA</div>
            <div className="cs-mono uppercase" style={{ color: "var(--nx-text2)", fontSize: 8, letterSpacing: 2 }}>Stargate Console</div>
          </div>
        </div>
        <h1 className="text-xl mb-1" style={{ color: "var(--nx-text)" }}>{mode === "signin" ? "Sign in" : "Create account"}</h1>
        <p className="cs-mono mb-6" style={{ color: "var(--nx-text2)", fontSize: 11 }}>
          {mode === "signin" ? "Access the Trust OS Fabric." : "New tenant provisioned automatically."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input type="email" placeholder="operator@tenant.gov" value={email} onChange={(e) => setEmail(e.target.value)} required
            style={{ background: "var(--nx-bg3)", borderColor: "var(--nx-border2)", color: "var(--nx-text)" }} />
          <Input type="password" placeholder="passphrase" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            style={{ background: "var(--nx-bg3)", borderColor: "var(--nx-border2)", color: "var(--nx-text)" }} />
          {err && <div className="cs-mono text-[11px]" style={{ color: "#f87171" }}>{err}</div>}
          <Button type="submit" disabled={loading} className="w-full"
            style={{ background: "var(--nx-blue)", color: "#050c16", fontWeight: 600 }}>
            {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: "var(--nx-border)" }} />
          <span className="cs-mono" style={{ fontSize: 9, color: "var(--nx-muted)", letterSpacing: 2 }}>OR</span>
          <div className="flex-1 h-px" style={{ background: "var(--nx-border)" }} />
        </div>

        <Button type="button" onClick={handleGoogle} variant="outline" className="w-full"
          style={{ borderColor: "var(--nx-border2)", color: "var(--nx-text)", background: "var(--nx-bg3)" }}>
          Continue with Google
        </Button>

        <div className="mt-6 text-center cs-mono" style={{ fontSize: 11, color: "var(--nx-text2)" }}>
          {mode === "signin" ? (
            <button onClick={() => setMode("signup")} style={{ color: "var(--sb-cyan)" }}>Need an account? Create one</button>
          ) : (
            <button onClick={() => setMode("signin")} style={{ color: "var(--sb-cyan)" }}>Already have an account? Sign in</button>
          )}
        </div>
        <div className="mt-4 text-center">
          <Link to="/" className="cs-mono" style={{ fontSize: 10, color: "var(--nx-muted)", letterSpacing: 1 }}>← Back to protocol site</Link>
        </div>
      </div>
    </div>
  );
}