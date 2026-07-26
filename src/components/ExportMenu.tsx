import { useTranslation } from "@/i18n/LanguageProvider";
import { downloadCsv, downloadExcel } from "@/lib/exportData";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  rows: Record<string, string | number | null | undefined>[];
  filename: string;
  sheetName?: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost" | "premium" | "hero";
  size?: "default" | "sm" | "lg";
  className?: string;
};

export function ExportMenu({
  rows,
  filename,
  sheetName,
  disabled,
  variant = "premium",
  size = "sm",
  className,
}: Props) {
  const { t } = useTranslation();
  const empty = rows.length === 0;

  if (variant === "hero") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={disabled || empty}
            size={size}
            className={cn(
              "rounded-xl h-11 px-5 font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]",
              empty && "opacity-50 cursor-not-allowed",
              className
            )}
          >
            <Download className="w-4 h-4 mr-2" />
            {t("phase2.export.metrics")}
            <ChevronDown className="w-4 h-4 ml-2 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-xl p-1 shadow-xl border-2 border-slate-300">
          <DropdownMenuLabel className="text-xs text-slate-500 font-medium px-2 py-1.5">
            {t("phase2.export.chooseFormat")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => downloadCsv(rows, filename)} className="rounded-lg cursor-pointer py-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mr-3">
              <FileText className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("phase2.export.csv")}</p>
              <p className="text-[10px] text-slate-500">.csv</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadExcel(rows, filename, sheetName)} className="rounded-lg cursor-pointer py-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center mr-3">
              <FileSpreadsheet className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("phase2.export.excel")}</p>
              <p className="text-[10px] text-slate-500">.xlsx</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "premium") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={disabled || empty}
            size={size}
            className={cn(
              "rounded-xl h-11 px-5 font-semibold shadow-lg shadow-sky-500/15 bg-gradient-to-r from-sky-700 to-sky-600 hover:from-sky-800 hover:to-sky-700 text-white border-0 transition-all hover:scale-[1.02] active:scale-[0.98]",
              empty && "opacity-50 cursor-not-allowed shadow-none",
              className
            )}
          >
            <Download className="w-4 h-4 mr-2" />
            {t("phase2.export.label")}
            {!empty && (
              <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-bold tabular-nums">
                {rows.length}
              </span>
            )}
            <ChevronDown className="w-4 h-4 ml-2 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-xl p-1 shadow-xl border-2 border-slate-300">
          <DropdownMenuLabel className="text-xs text-slate-500 font-medium px-2 py-1.5">
            {t("phase2.export.chooseFormat")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => downloadCsv(rows, filename)}
            className="rounded-lg cursor-pointer py-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mr-3">
              <FileText className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("phase2.export.csv")}</p>
              <p className="text-[10px] text-slate-500">.csv</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => downloadExcel(rows, filename, sheetName)}
            className="rounded-lg cursor-pointer py-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center mr-3">
              <FileSpreadsheet className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("phase2.export.excel")}</p>
              <p className="text-[10px] text-slate-500">.xlsx</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={disabled || empty} className={cn("rounded-xl", className)}>
          <Download className="w-4 h-4 mr-1.5" />
          {t("phase2.export.label")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        <DropdownMenuItem onClick={() => downloadCsv(rows, filename)} className="rounded-lg">
          <FileText className="w-4 h-4 mr-2" />
          {t("phase2.export.csv")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadExcel(rows, filename, sheetName)} className="rounded-lg">
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          {t("phase2.export.excel")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
