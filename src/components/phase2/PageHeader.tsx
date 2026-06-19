import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  badge: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient?: "sky" | "violet" | "slate";
  children?: React.ReactNode;
  stats?: { label: string; value: string | number }[];
};

const gradients = {
  sky: "from-[#0F172A] via-[#1E293B] to-[#0369A1]",
  violet: "from-[#1e1b4b] via-[#312e81] to-[#6d28d9]",
  slate: "from-slate-900 via-slate-800 to-slate-700",
};

export function PageHeader({
  badge,
  title,
  subtitle,
  icon: Icon,
  gradient = "sky",
  children,
  stats,
}: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10",
        gradients[gradient]
      )}
    >
      <div className="absolute inset-0 opacity-25 pointer-events-none">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-sky-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
      </div>
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
              <Icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-[0.2em]">{badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{title}</h1>
          <p className="text-sm text-white/75 max-w-xl leading-relaxed">{subtitle}</p>
          {stats && stats.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-5">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur border border-white/15 text-xs"
                >
                  <span className="text-white/60">{s.label}: </span>
                  <span className="font-bold text-white">{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {children && <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">{children}</div>}
      </div>
    </div>
  );
}
