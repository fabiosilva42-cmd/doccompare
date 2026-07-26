import { useMemo, useState } from "react";
import { useTranslation } from "@/i18n/LanguageProvider";
import { downloadCsv, downloadExcel } from "@/lib/exportData";
import { defaultSelectedKeys, pickExportRows, type ExportFieldDef } from "@/lib/exportBuilder";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, ChevronDown, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  rows: Record<string, string | number | null | undefined>[];
  fields: ExportFieldDef[];
  filename: string;
  sheetName?: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost" | "premium" | "hero";
  size?: "default" | "sm" | "lg";
  className?: string;
};

export function ExportBuilderMenu({
  rows,
  fields,
  filename,
  sheetName,
  disabled,
  variant = "premium",
  size = "sm",
  className,
}: Props) {
  const { t } = useTranslation();
  const empty = rows.length === 0;
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(() => defaultSelectedKeys(fields));

  const exportRows = useMemo(() => pickExportRows(rows, selected), [rows, selected]);

  const toggleField = (key: string) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const triggerClass =
    variant === "hero"
      ? "rounded-xl h-11 px-5 font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-sm"
      : variant === "premium"
        ? "rounded-xl h-11 px-5 font-semibold shadow-lg shadow-sky-500/15 bg-gradient-to-r from-sky-700 to-sky-600 hover:from-sky-800 hover:to-sky-700 text-white border-0"
        : "rounded-xl";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={disabled || empty}
            size={size}
            variant={variant === "premium" || variant === "hero" ? "default" : variant}
            className={cn(triggerClass, empty && "opacity-50", className)}
          >
            <Download className="w-4 h-4 mr-2" />
            {variant === "hero" ? t("phase2.export.metrics") : t("phase2.export.label")}
            {!empty && variant === "premium" && (
              <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-bold tabular-nums">
                {rows.length}
              </span>
            )}
            <ChevronDown className="w-4 h-4 ml-2 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-xl p-1 shadow-xl border-2 border-slate-300">
          <DropdownMenuLabel className="text-xs text-slate-500 font-medium px-2 py-1.5">
            {t("phase2.export.chooseFormat")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => downloadCsv(exportRows, filename)}
            className="rounded-lg cursor-pointer py-2.5"
          >
            <FileText className="w-4 h-4 mr-2 text-emerald-600" />
            {t("phase2.export.csv")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => downloadExcel(exportRows, filename, sheetName)}
            className="rounded-lg cursor-pointer py-2.5"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-sky-600" />
            {t("phase2.export.excel")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setBuilderOpen(true)} className="rounded-lg cursor-pointer py-2.5">
            <Settings2 className="w-4 h-4 mr-2 text-violet-600" />
            {t("phase2.export.customize")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>{t("phase2.export.builderTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">{t("phase2.export.builderHint")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto py-2">
            {fields.map((field) => (
              <label
                key={field.key}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-sm"
              >
                <Checkbox
                  checked={selected.includes(field.key)}
                  onCheckedChange={() => toggleField(field.key)}
                />
                <span className="text-slate-700">{field.label}</span>
              </label>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setSelected(defaultSelectedKeys(fields))}>
              {t("phase2.export.resetFields")}
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-sky-700 hover:bg-sky-800"
              disabled={selected.length === 0}
              onClick={() => {
                downloadExcel(exportRows, filename, sheetName);
                setBuilderOpen(false);
              }}
            >
              {t("phase2.export.excel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
