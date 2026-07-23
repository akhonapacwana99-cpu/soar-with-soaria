import emblem from "@/assets/careerpilot-emblem.png";

export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <img
      src={emblem}
      alt="CareerPilot AI emblem — phoenix and dragon"
      width={64}
      height={64}
      className={className}
      loading="eager"
    />
  );
}

export function WordMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo className="h-9 w-9" />
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-lg font-semibold tracking-tight text-foreground">
            CareerPilot <span className="text-gradient-brand">AI</span>
          </div>
          <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Powered by Soaria
          </div>
        </div>
      )}
    </div>
  );
}
