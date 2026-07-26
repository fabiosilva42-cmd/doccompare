import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import {
  DEFAULT_PEDIDO_FILTERS,
  loadFilterPresets,
  saveFilterPresets,
  type FilterPreset,
  type PedidoFilterState,
} from "@/lib/pedidoFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  X,
  SlidersHorizontal,
  BookmarkPlus,
  Trash2,
  Calendar,
  Percent,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PHASE_OPTIONS = ["todos", "atendimento", "design", "cq", "concluido", "arquivado"] as const;
const DEPT_OPTIONS = ["todos", "atendimento", "design", "cq"] as const;
const STATUS_OPTIONS = ["todos", "pendente", "em_andamento", "concluido", "arquivado", "cancelado"] as const;

type Props = {
  filters: PedidoFilterState;
  onChange: (next: PedidoFilterState) => void;
  onResetPage?: () => void;
  showPresets?: boolean;
  variant?: "default" | "elevated";
};

function countActiveFilters(filters: PedidoFilterState) {
  let n = 0;
  if (filters.search) n++;
  if (filters.status !== "todos") n++;
  if (filters.phase !== "todos") n++;
  if (filters.department !== "todos") n++;
  if (filters.dateFrom) n++;
  if (filters.dateTo) n++;
  if (filters.divergenceMin) n++;
  if (filters.divergenceMax) n++;
  return n;
}

export function PedidoAdvancedFilters({
  filters,
  onChange,
  onResetPage,
  showPresets = true,
  variant = "default",
}: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id;
  const [expanded, setExpanded] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState("");

  useEffect(() => {
    setPresets(loadFilterPresets(userId));
  }, [userId]);

  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  const patch = (partial: Partial<PedidoFilterState>) => {
    onChange({ ...filters, ...partial });
    onResetPage?.();
  };

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const next: FilterPreset[] = [
      ...presets.filter((p) => p.name !== name),
      { id: crypto.randomUUID(), name, filters: { ...filters }, createdAt: new Date().toISOString() },
    ];
    setPresets(next);
    saveFilterPresets(next, userId);
    setPresetName("");
  };

  const applyPreset = (preset: FilterPreset) => {
    onChange({ ...DEFAULT_PEDIDO_FILTERS, ...preset.filters });
    onResetPage?.();
  };

  const deletePreset = (id: string) => {
    const next = presets.filter((p) => p.id !== id);
    setPresets(next);
    saveFilterPresets(next, userId);
  };

  const clearAll = () => {
    onChange({ ...DEFAULT_PEDIDO_FILTERS });
    onResetPage?.();
  };

  return (
    <Card
      className={cn(
        "border-2 border-slate-300 overflow-hidden transition-shadow",
        variant === "elevated" ? "shadow-md" : "shadow-sm"
      )}
    >
      <CardContent className="p-0">
        <div className="p-4 sm:p-5 space-y-4 bg-gradient-to-br from-white via-white to-slate-50/80">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
              <Input
                placeholder={t("phase2.filters.searchPlaceholder")}
                value={filters.search}
                onChange={(e) => patch({ search: e.target.value })}
                className="pl-10 h-11 rounded-xl border-2 border-slate-300 bg-white shadow-sm focus:shadow-md focus:border-sky-500 transition-all"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => patch({ search: "" })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Button
                type="button"
                variant={expanded ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-xl h-11 px-4 font-semibold shadow-sm",
                  expanded && "bg-sky-700 hover:bg-sky-800"
                )}
                onClick={() => setExpanded((e) => !e)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                {expanded ? t("phase2.filters.hideAdvanced") : t("phase2.filters.showAdvanced")}
                {activeCount > 0 && (
                  <Badge className="ml-2 bg-white/20 text-inherit border-0 h-5 min-w-5 px-1.5">
                    {activeCount}
                  </Badge>
                )}
                <ChevronDown className={cn("w-4 h-4 ml-1 transition-transform", expanded && "rotate-180")} />
              </Button>
              {activeCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-xl h-11 text-slate-500 hover:text-red-600 hover:bg-red-50"
                  onClick={clearAll}
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  {t("phase2.filters.clearAll")}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_OPTIONS.map((s) => {
              const active = filters.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => patch({ status: s })}
                  className={cn(
                    "text-xs h-8 px-3.5 rounded-full font-semibold border-2 transition-all duration-200",
                    active
                      ? "bg-sky-700 text-white border-sky-700 shadow-md shadow-sky-500/20 scale-[1.02]"
                      : "bg-white text-slate-600 border-slate-300 hover:border-sky-500 hover:bg-sky-50"
                  )}
                >
                  {s === "todos" ? t("status.todos") : t(`status.${s}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={cn(
            "grid transition-all duration-300 ease-out border-t-2 border-slate-300 bg-slate-50",
            expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="p-4 sm:p-5 pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3 h-3" />
                    {t("phase2.filters.department")}
                  </label>
                  <Select value={filters.department} onValueChange={(v) => patch({ department: v })}>
                    <SelectTrigger className="rounded-xl h-10 bg-white border-2 border-slate-300 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPT_OPTIONS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d === "todos" ? t("status.todos") : t(`phase.${d}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3 h-3" />
                    {t("history.colPhase")}
                  </label>
                  <Select value={filters.phase} onValueChange={(v) => patch({ phase: v })}>
                    <SelectTrigger className="rounded-xl h-10 bg-white border-2 border-slate-300 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PHASE_OPTIONS.map((ph) => (
                        <SelectItem key={ph} value={ph}>
                          {ph === "todos" ? t("status.todos") : t(`phase.${ph}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {t("phase2.filters.dateFrom")}
                  </label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => patch({ dateFrom: e.target.value })}
                    className="rounded-xl h-10 bg-white border-2 border-slate-300 shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {t("phase2.filters.dateTo")}
                  </label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => patch({ dateTo: e.target.value })}
                    className="rounded-xl h-10 bg-white border-2 border-slate-300 shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="w-3 h-3" />
                    {t("phase2.filters.divergenceRate")}
                  </label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="0"
                      value={filters.divergenceMin}
                      onChange={(e) => patch({ divergenceMin: e.target.value })}
                      className="rounded-xl h-10 bg-white border-2 border-slate-300 shadow-sm"
                    />
                    <span className="text-slate-300 font-light">—</span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="100"
                      value={filters.divergenceMax}
                      onChange={(e) => patch({ divergenceMax: e.target.value })}
                      className="rounded-xl h-10 bg-white border-2 border-slate-300 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {showPresets && (
                <div className="pt-4 border-t-2 border-slate-300 space-y-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {t("phase2.filters.savedPresets")}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder={t("phase2.filters.presetName")}
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && savePreset()}
                      className="rounded-xl h-10 bg-white border-2 border-slate-300 shadow-sm flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl h-10 shrink-0 bg-sky-700 hover:bg-sky-800 shadow-sm font-semibold"
                      onClick={savePreset}
                      disabled={!presetName.trim()}
                    >
                      <BookmarkPlus className="w-4 h-4 mr-1.5" />
                      {t("phase2.filters.savePreset")}
                    </Button>
                  </div>
                  {presets.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {presets.map((p) => (
                        <div
                          key={p.id}
                          className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-white border-2 border-slate-300 shadow-sm hover:border-sky-500 hover:shadow transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => applyPreset(p)}
                            className="text-xs font-semibold text-slate-700 hover:text-sky-700"
                          >
                            {p.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePreset(p.id)}
                            className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
