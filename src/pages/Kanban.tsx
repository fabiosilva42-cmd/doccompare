import { useMemo, useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useTranslation } from "@/i18n/LanguageProvider";
import {
  applyPedidoFilters,
  DEFAULT_PEDIDO_FILTERS,
  type PedidoFilterState,
  type PedidoListItem,
} from "@/lib/pedidoFilters";
import { buildKanbanColumns, groupPedidosByPhase } from "@/lib/kanbanColumns";
import { PedidoAdvancedFilters } from "@/components/filters/PedidoAdvancedFilters";
import { PageHeader } from "@/components/phase2/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Search,
  Eye,
  LayoutGrid,
  Headphones,
  Palette,
  ShieldCheck,
  CheckCircle2,
  Archive,
  Building2,
  AlertTriangle,
  ArrowRight,
  X,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const columnTheme: Record<
  string,
  { border: string; bg: string; header: string; dot: string; icon: LucideIcon; iconBg: string }
> = {
  atendimento: {
    border: "border-t-sky-500",
    bg: "bg-gradient-to-b from-sky-50/80 to-white",
    header: "text-sky-800",
    dot: "bg-sky-500",
    icon: Headphones,
    iconBg: "bg-sky-100 text-sky-700",
  },
  design: {
    border: "border-t-violet-500",
    bg: "bg-gradient-to-b from-violet-50/80 to-white",
    header: "text-violet-800",
    dot: "bg-violet-500",
    icon: Palette,
    iconBg: "bg-violet-100 text-violet-700",
  },
  cq: {
    border: "border-t-emerald-500",
    bg: "bg-gradient-to-b from-emerald-50/80 to-white",
    header: "text-emerald-800",
    dot: "bg-emerald-500",
    icon: ShieldCheck,
    iconBg: "bg-emerald-100 text-emerald-700",
  },
  concluido: {
    border: "border-t-slate-600",
    bg: "bg-gradient-to-b from-slate-50/80 to-white",
    header: "text-slate-800",
    dot: "bg-slate-500",
    icon: CheckCircle2,
    iconBg: "bg-slate-100 text-slate-700",
  },
  arquivado: {
    border: "border-t-slate-300",
    bg: "bg-gradient-to-b from-slate-50/50 to-white",
    header: "text-slate-600",
    dot: "bg-slate-300",
    icon: Archive,
    iconBg: "bg-slate-100 text-slate-500",
  },
};

const themePalette = [
  columnTheme.atendimento,
  columnTheme.design,
  columnTheme.cq,
  columnTheme.concluido,
  columnTheme.arquivado,
];

const defaultColumnTheme = {
  border: "border-t-indigo-500",
  bg: "bg-gradient-to-b from-indigo-50/80 to-white",
  header: "text-indigo-800",
  dot: "bg-indigo-500",
  icon: LayoutGrid,
  iconBg: "bg-indigo-100 text-indigo-700",
};

function getColumnTheme(phase: string, index: number) {
  return columnTheme[phase] ?? themePalette[index % themePalette.length] ?? defaultColumnTheme;
}

export default function Kanban() {
  const { t, locale } = useTranslation();
  const [filters, setFilters] = useState<PedidoFilterState>({ ...DEFAULT_PEDIDO_FILTERS });
  const [boardSearch, setBoardSearch] = useState("");

  const { data: pedidosList, isLoading: pedidosLoading } = trpc.pedido.list.useQuery();
  const { data: promptsList, isLoading: promptsLoading } = trpc.prompt.list.useQuery();

  const isLoading = pedidosLoading || promptsLoading;

  const filtered = useMemo(() => {
    const list = (pedidosList ?? []) as PedidoListItem[];
    let result = applyPedidoFilters(list, filters);
    const q = boardSearch.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.codigoPedido.toLowerCase().includes(q) ||
          p.nome.toLowerCase().includes(q) ||
          (p.dadosCliente?.nomeCliente?.toLowerCase().includes(q) ?? false)
      );
    }
    return result;
  }, [pedidosList, filters, boardSearch]);

  const kanbanColumns = useMemo(
    () => buildKanbanColumns(promptsList, (pedidosList ?? []).map((p) => p.faseAtual)),
    [promptsList, pedidosList]
  );

  const byPhase = useMemo(
    () => groupPedidosByPhase(filtered, kanbanColumns),
    [filtered, kanbanColumns]
  );

  const dateFmt = locale === "pt" ? "pt-BR" : "en-US";

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      <PageHeader
        badge={t("phase2.kanban.badge")}
        title={t("phase2.kanban.title")}
        subtitle={t("phase2.kanban.subtitle")}
        icon={LayoutGrid}
        stats={[
          { label: t("phase2.kanban.totalVisible"), value: filtered.length },
          { label: t("phase2.kanban.columns"), value: kanbanColumns.length },
        ]}
      >
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <Input
            placeholder={t("phase2.kanban.boardSearch")}
            value={boardSearch}
            onChange={(e) => setBoardSearch(e.target.value)}
            className="pl-9 pr-9 rounded-xl h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 focus:ring-white/20"
          />
          {boardSearch && (
            <button
              type="button"
              onClick={() => setBoardSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </PageHeader>

      <PedidoAdvancedFilters filters={filters} onChange={setFilters} showPresets variant="elevated" />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
          <p className="text-sm text-slate-500">{t("common.loading")}</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 min-h-[480px] snap-x snap-mandatory scrollbar-thin">
          {kanbanColumns.map((phase, columnIndex) => {
            const theme = getColumnTheme(phase, columnIndex);
            const ColIcon = theme.icon;
            const items = byPhase[phase] ?? [];
            return (
              <div
                key={phase}
                className={cn(
                  "flex-shrink-0 w-[300px] snap-start rounded-2xl border border-slate-200/80 border-t-[3px] shadow-sm hover:shadow-md transition-shadow",
                  theme.border,
                  theme.bg
                )}
              >
                <div className="p-4 border-b border-slate-200/50 flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm", theme.iconBg)}>
                    <ColIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className={cn("text-sm font-bold truncate", theme.header)}>{t(`phase.${phase}`)}</h2>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {items.length} {items.length === 1 ? t("phase2.kanban.order") : t("phase2.kanban.orders")}
                    </p>
                  </div>
                  <Badge className="bg-white/90 text-slate-700 border border-slate-200/80 shadow-sm font-bold tabular-nums">
                    {items.length}
                  </Badge>
                </div>
                <div className="p-3 space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200/80 bg-white/50">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                        <ColIcon className="w-4 h-4 text-slate-300" />
                      </div>
                      <p className="text-xs text-slate-400 font-medium">{t("phase2.kanban.emptyColumn")}</p>
                    </div>
                  ) : (
                    items.map((pedido) => (
                      <Card
                        key={pedido.id}
                        className="group border-slate-200/80 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-lg hover:border-sky-200/80 hover:-translate-y-0.5 transition-all duration-300"
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold text-sky-600 tracking-wide">{pedido.codigoPedido}</p>
                              <p className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug mt-0.5">
                                {pedido.nome}
                              </p>
                            </div>
                            <span className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5", theme.dot)} />
                          </div>
                          {pedido.responsavelNome && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 rounded-lg px-2 py-1.5">
                              <UserRound className="w-3 h-3 shrink-0 text-slate-400" />
                              <span className="truncate">{pedido.responsavelNome}</span>
                            </div>
                          )}
                          {pedido.dadosCliente?.nomeCliente && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 rounded-lg px-2 py-1.5">
                              <Building2 className="w-3 h-3 shrink-0 text-slate-400" />
                              <span className="truncate">{pedido.dadosCliente.nomeCliente}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                                pedido.statusGeral === "concluido"
                                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                  : pedido.statusGeral === "em_andamento"
                                    ? "text-amber-700 bg-amber-50 border-amber-200"
                                    : "text-slate-600 bg-slate-50 border-slate-200"
                              )}
                            >
                              {t(`status.${pedido.statusGeral}`)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                              {new Date(pedido.createdAt).toLocaleDateString(dateFmt)}
                            </span>
                          </div>
                          {pedido.taxaDivergencia != null && pedido.taxaDivergencia > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] text-amber-800 font-semibold bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                              <AlertTriangle className="w-3 h-3" />
                              {t("phase2.kanban.divergence")}: {pedido.taxaDivergencia}%
                            </div>
                          )}
                          <Link to={`/resultado/${pedido.id}`} className="block">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full h-9 text-xs rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-700 font-semibold group-hover:bg-sky-50/80 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1.5" />
                              {t("history.viewDetails")}
                              <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
