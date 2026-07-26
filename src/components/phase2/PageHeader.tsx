import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Matches sidebar solid brand color */
export const BRAND_SURFACE = "#0B1120";

type Props = {
  badge?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
  stats?: { label: string; value: string | number }[];
  className?: string;
  /** @deprecated kept for call-site compatibility — ignored */
  gradient?: "sky" | "violet" | "slate";
  /** @deprecated kept for call-site compatibility — ignored */
  compact?: boolean;
};

/**
 * Shared page header — solid brand color matching the sidebar.
 */
export function PageHeader({
  badge,
  title,
  subtitle,
  icon: Icon,
  children,
  stats,
  className,
}: Props) {
  return (
    <header
      className={cn(
        "rounded-2xl border border-white/5 px-4 py-4 text-white sm:px-5 sm:py-5",
        className
      )}
      style={{ backgroundColor: BRAND_SURFACE }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          {(badge || Icon) && (
            <div className="mb-2 flex items-center gap-2">
              {Icon && (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-sky-300">
                  <Icon className="h-3.5 w-3.5" />
                </div>
              )}
              {badge && (
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {badge}
                </span>
              )}
            </div>
          )}
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-[1.35rem]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
              {subtitle}
            </p>
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
        {children && (
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
