interface BrandLogoProps {
  compact?: boolean;
  showIcon?: boolean;
}

const BrandLogo = ({ compact = false, showIcon = false }: BrandLogoProps) => {
  return (
    <div className="flex items-center gap-3">
      {showIcon ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-primary/10 text-primary shadow-[0_12px_32px_hsl(var(--background)/0.28)]">
          D
        </div>
      ) : null}
      {compact ? null : (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="bg-[linear-gradient(135deg,hsl(var(--foreground)),hsl(var(--primary)),hsl(190_80%_70%))] bg-clip-text text-lg font-semibold leading-none tracking-[0.24em] text-transparent drop-shadow-[0_0_18px_hsl(var(--primary)/0.22)]">
              DEV404
            </div>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-primary">
              AI
            </span>
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.28em] text-foreground/45">
            Creative Code Lab
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
