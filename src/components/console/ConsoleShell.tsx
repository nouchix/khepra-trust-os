import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LogOut, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NxShield } from "./NxShield";
import type { ReactNode } from "react";

const TABS = [
  { to: "/console/timeline", label: "Timeline" },
  { to: "/console/agents", label: "Agents" },
  { to: "/console/findings", label: "Findings" },
  { to: "/console/controls", label: "Controls" },
  { to: "/console/rulepacks", label: "Rulepacks" },
  { to: "/console/stig", label: "STIG" },
] as const;

export interface ConsoleShellProps {
  tenant: { name: string; classification: string; role: string } | null;
  sessionRef?: string;
  stats?: { tools?: number; findings?: number; sigs?: number };
  leftPanel: ReactNode;
  children: ReactNode;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
}

export function ConsoleShell({
  tenant, sessionRef, stats, leftPanel, children, searchValue = "", onSearchChange, searchPlaceholder,
}: ConsoleShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div
      className="console-shell flex flex-col h-[100dvh] overflow-hidden"
      style={{ background: "var(--nx-bg)" }}
    >
      {/* Classification banner */}
      <div
        className="text-center cs-mono font-semibold flex-shrink-0"
        style={{
          background: "rgba(204,42,54,.12)", borderBottom: "1px solid rgba(204,42,54,.4)",
          color: "rgba(204,42,54,.9)", padding: "3px 0", fontSize: 9, letterSpacing: 2.5,
        }}
      >
        {tenant?.classification ?? "UNCLASSIFIED"}
      </div>

      {/* Header */}
      <div
        className="flex items-center justify-between px-5 flex-shrink-0"
        style={{ height: 52, background: "var(--nx-bg2)", borderBottom: "1px solid var(--nx-border2)" }}
      >
        <div className="flex items-center gap-3">
          <NxShield />
          <div className="flex flex-col gap-[1px]">
            <div className="font-semibold tracking-[1px]" style={{ color: "var(--nx-blue)", fontSize: 14 }}>KHEPRA</div>
            <div className="cs-mono uppercase" style={{ color: "var(--nx-text2)", fontSize: 8, letterSpacing: 2 }}>Trust OS Fabric</div>
          </div>
          <div className="w-px h-[30px] mx-2" style={{ background: "var(--nx-border2)" }} />
          <div className="cs-mono font-semibold" style={{ color: "var(--ak-gold)", fontSize: 11, letterSpacing: 1.5 }}>
            {tenant?.name ?? "…"}
          </div>
          {tenant?.role && (
            <span className="cs-mono" style={{ color: "var(--nx-text2)", fontSize: 9, letterSpacing: 1 }}>· {tenant.role}</span>
          )}
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 cs-mono" style={{ color: "var(--nx-text2)", fontSize: 10 }}>
            <span className="cs-pulse inline-block rounded-full" style={{ width: 6, height: 6, background: "var(--cat3)", boxShadow: "0 0 6px var(--cat3)" }} />
            LIVE
          </div>
          {stats && (
            <div className="cs-mono rounded-full px-2.5 py-1" style={{ fontSize: 10, color: "var(--nx-text2)", border: "1px solid var(--nx-border)", background: "var(--nx-bg3)" }}>
              <span style={{ color: "var(--ak-gold)", fontWeight: 600 }}>{stats.tools ?? 0}</span> tools ·{" "}
              <span style={{ color: "var(--ak-gold)", fontWeight: 600 }}>{stats.findings ?? 0}</span> findings ·{" "}
              <span style={{ color: "var(--ak-gold)", fontWeight: 600 }}>{stats.sigs ?? 0}</span> sigs
            </div>
          )}
          <button
            onClick={signOut}
            className="cs-mono flex items-center gap-1.5 rounded-md px-2 py-1"
            style={{ fontSize: 10, color: "var(--nx-text2)", border: "1px solid var(--nx-border)" }}
            title="Sign out"
          >
            <LogOut size={12} /> SIGN OUT
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 py-2 flex-shrink-0" style={{ background: "var(--nx-bg2)", borderBottom: "1px solid var(--nx-border)" }}>
        <div className="max-w-[680px] mx-auto flex items-center gap-2.5 px-3.5 py-1.5 rounded-md"
             style={{ background: "var(--nx-bg3)", border: "1px solid var(--nx-border2)" }}>
          <Search size={12} style={{ color: "var(--sb-cyan)" }} />
          <input
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder ?? "filter this view…"}
            className="flex-1 bg-transparent outline-none cs-mono"
            style={{ fontSize: 13, color: "var(--nx-text)", caretColor: "var(--nx-blue)" }}
          />
          <span className="cs-mono" style={{ fontSize: 9, color: "var(--nx-muted)", letterSpacing: 0.5 }}>ctrl · k</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-5 flex-shrink-0" style={{ background: "var(--nx-bg2)", borderBottom: "1px solid var(--nx-border)" }}>
        {TABS.map((t) => {
          const active = pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className="cs-mono uppercase"
              style={{
                padding: "8px 18px", fontSize: 10, letterSpacing: 1.5,
                color: active ? "var(--nx-blue)" : "var(--nx-text2)",
                borderBottom: `2px solid ${active ? "var(--nx-blue)" : "transparent"}`,
              }}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        <aside
          className="flex-shrink-0 flex flex-col overflow-hidden"
          style={{ width: 288, background: "var(--nx-bg2)", borderRight: "1px solid var(--nx-border)" }}
        >
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--nx-border)" }}>
            <div className="cs-mono uppercase" style={{ fontSize: 9, letterSpacing: 2, color: "var(--nx-text2)" }}>Detail</div>
            <span className="cs-mono" style={{ fontSize: 8, padding: "2px 6px", border: "1px solid var(--nx-border2)", borderRadius: 3, color: "var(--nx-blue)", background: "var(--nx-blue-glow)" }}>
              {tenant?.role?.toUpperCase() ?? "GUEST"}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{leftPanel}</div>
        </aside>
        <main className="flex-1 relative overflow-hidden" style={{ background: "var(--nx-bg)" }}>
          {children}
        </main>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-5 flex-shrink-0"
        style={{ padding: "5px 20px", background: "var(--nx-bg2)", borderTop: "1px solid var(--nx-border)" }}
      >
        <div className="cs-mono" style={{ fontSize: 9, color: "var(--nx-muted)", letterSpacing: 0.5 }}>
          KHEPRA TRUST OS FABRIC · <span style={{ color: "var(--nx-text2)" }}>STARGATE v1</span>
          {sessionRef && <> · <span style={{ color: "var(--nx-text2)" }}>SESSION: {sessionRef}</span></>}
        </div>
        <div className="flex items-center gap-2.5">
          <span className="cs-mono" style={{ fontSize: 8, padding: "3px 8px", borderRadius: 3, color: "var(--ak-gold)", border: "1px solid rgba(229,165,75,.4)", letterSpacing: 1.5 }}>◈ CMMC AUTOPILOT</span>
          <span className="cs-mono" style={{ fontSize: 8, padding: "3px 8px", borderRadius: 3, color: "var(--sb-cyan)", border: "1px solid rgba(6,182,212,.4)", letterSpacing: 1.5 }}>⬡ PQC-STIG v1.0</span>
        </div>
      </div>
    </div>
  );
}