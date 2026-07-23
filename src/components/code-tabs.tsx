import { useState } from "react";

export function CodeTabs({
  tabs,
}: {
  tabs: { label: string; language?: string; code: string }[];
}) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const current = tabs[active]!;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/60 bg-background/40 px-2 py-1.5">
        <div className="flex flex-wrap gap-1">
          {tabs.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setActive(i)}
              className={`font-mono text-[11px] px-3 py-1.5 rounded transition-colors ${
                i === active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={copy}
          className="font-mono text-[10px] px-2.5 py-1 rounded text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>
      <pre className="p-6 text-[12.5px] leading-relaxed text-foreground/90 overflow-x-auto"><code>{current.code}</code></pre>
    </div>
  );
}