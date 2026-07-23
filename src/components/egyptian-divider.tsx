export function EgyptianDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-4 my-2" aria-hidden={!label}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      <svg width="180" height="24" viewBox="0 0 180 24" className="text-primary/70">
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M2 12 L30 12" />
          <path d="M30 4 L38 12 L30 20 Z" />
          <circle cx="46" cy="12" r="3" />
          <path d="M52 12 L64 12" />
          <path d="M64 4 L76 4 L76 20 L64 20 Z" />
          <path d="M76 12 L92 12" />
          <circle cx="90" cy="12" r="5" fill="currentColor" fillOpacity="0.15" />
          <path d="M98 12 L114 12" />
          <path d="M114 4 L126 4 L126 20 L114 20 Z" />
          <path d="M126 12 L138 12" />
          <circle cx="134" cy="12" r="3" />
          <path d="M142 12 L150 20 L150 4 Z" />
          <path d="M150 12 L178 12" />
        </g>
      </svg>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      {label && (
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
          {label}
        </div>
      )}
    </div>
  );
}