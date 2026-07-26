import { cn } from "@/lib/utils";
import { BRAND_SURFACE } from "@/components/phase2/PageHeader";

type Width = "full" | "wide" | "content" | "narrow";

const widthClass: Record<Width, string> = {
  full: "max-w-none",
  wide: "max-w-[1600px]",
  content: "max-w-[1280px]",
  narrow: "max-w-[720px]",
};

type Props = {
  children: React.ReactNode;
  className?: string;
  width?: Width;
  dense?: boolean;
};

export function PageShell({ children, className, width = "content", dense }: Props) {
  return (
    <div
      className={cn(
        "mx-auto w-full animate-in fade-in duration-300",
        widthClass[width],
        dense ? "space-y-4" : "space-y-5 sm:space-y-6",
        className
      )}
    >
      {children}
    </div>
  );
}

type PageTitleProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  stats?: { label: string; value: string | number }[];
  className?: string;
};

/** Same solid brand header as PageHeader (for pages using ReactNode icons) */
export function PageTitle({
  title,
  subtitle,
  badge,
  icon,
  actions,
  stats,
  className,
}: PageTitleProps) {
  return (
    <header
      className={cn(
        "rounded-2xl border border-white/5 px-4 py-4 text-white sm:px-5 sm:py-5",
        className
      )}
      style={{ backgroundColor: BRAND_SURFACE }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-sky-300">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            {badge && (
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {badge}
              </p>
            )}
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-[1.35rem]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">{subtitle}</p>
            )}
            {stats && stats.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs"
                  >
                    <span className="text-slate-400">{s.label}</span>
                    <span className="font-semibold tabular-nums text-white">{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
