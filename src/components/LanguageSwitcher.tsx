import { Languages } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageProvider";
import type { Locale } from "@/i18n/types";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "sidebar" | "header" | "login";
  className?: string;
};

export function LanguageSwitcher({ variant = "header", className }: Props) {
  const { locale, setLocale, t } = useTranslation();

  const options: { value: Locale; label: string }[] = [
    { value: "en", label: t("language.en") },
    { value: "pt", label: t("language.pt") },
  ];

  if (variant === "sidebar") {
    return (
      <div className={cn("px-3 py-2", className)}>
        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-[0.15em] mb-1.5">
          <Languages className="w-3 h-3" />
          {t("language.label")}
        </label>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="w-full text-xs bg-slate-800/80 border border-slate-700 text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Languages className={cn("w-4 h-4", variant === "login" ? "text-slate-400" : "text-slate-500")} />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label={t("language.label")}
        className={cn(
          "text-xs font-medium rounded-lg px-2 py-1.5 border focus:outline-none focus:ring-2 focus:ring-sky-500",
          variant === "login"
            ? "bg-white/10 border-white/20 text-white"
            : "bg-white border-slate-200 text-slate-700"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
