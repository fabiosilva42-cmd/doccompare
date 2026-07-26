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
import { buildKanbanColumns, groupPedidosByPhase, phaseLabel } from "@/lib/kanbanColumns";
import { PedidoAdvancedFilters } from "@/components/filters/PedidoAdvancedFilters";
import { PageHeader } from "@/components/phase2/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
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

/** Clear column identity: solid accent + readable icon chip */
const columnMeta: Record<
  string,
  { accent: string; bar: string; icon: LucideIcon; chip: string }
> = {
  atendimento: {
    accent: "border-sky-500",
    bar: "bg-sky-500",
    icon: Headphones,
    chip: "bg-sky-100 text-sky-800 border-sky-300",
  },
  design: {
    accent: "border-violet-500",
    bar: "bg-violet-500",
    icon: Palette,
    chip: "bg-violet-100 text-violet-800 border-violet-300",
  },
  cq: {
    accent: "border-emerald-500",
    bar: "bg-emerald-500",
    icon: ShieldCheck,
    chip: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  concluido: {
    accent: "border-slate-700",
    bar: "bg-slate-700",
    icon: CheckCircle2,
    chip: "bg-slate-200 text-slate-800 border-slate-400",
  },
  arquivado: {
    accent: "border-slate-400",
    bar: "bg-slate-400",
    icon: Archive,
    chip: "bg-slate-100 text-slate-600 border-slate-300",
  },
};

const fallbackAccent = [
  { accent: "border-sky-500", bar: "bg-sky-500", chip: "bg-sky-100 text-sky-800 border-sky-300" },
  { accent: "border-slate-500", bar: "bg-slate-500", chip: "bg-slate-100 text-slate-800 border-slate-300" },
  { accent: "border-emerald-500", bar: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-800 border-emerald-300" },
];

function getColumnMeta(phase: string, index: number) {
  if (columnMeta[phase]) return columnMeta[phase];
  const fb = fallbackAccent[index % fallbackAccent.length];
  return { ...fb, icon: LayoutGrid as LucideIcon };
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
    <PageShell width="full" dense>
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          <Input
            placeholder={t("phase2.kanban.boardSearch")}
            value={boardSearch}
            onChange={(e) => setBoardSearch(e.target.value)}
            className="h-10 rounded-xl border-2 border-white/35 bg-white/10 pl-9 pr-9 text-white placeholder:text-white/50 focus-visible:border-white/60 focus-visible:ring-white/25"
          />
          {boardSearch && (
            <button
              type="button"
              onClick={() => setBoardSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </PageHeader>

      <PedidoAdvancedFilters filters={filters} onChange={setFilters} showPresets variant="elevated" />

      {/* How to read the board */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-600">
        <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        <span className="font-semibold text-slate-800">{t("phase2.kanban.phaseGuide")}:</span>
        {kanbanColumns.map((phase, i) => {
          const meta = getColumnMeta(phase, i);
          return (
            <span
              key={phase}
              className="inline-flex items-center gap-1.5 rounded-md border-2 border-slate-300 bg-slate-50 px-2 py-0.5 font-medium text-slate-700"
            >
              <span className={cn("h-2 w-2 rounded-full", meta.bar)} />
              {phaseLabel(t, phase)}
            </span>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          <p className="text-sm text-slate-600">{t("common.loading")}</p>
        </div>
      ) : (
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-4 pt-1 snap-x snap-mandatory scrollbar-thin">
          {kanbanColumns.map((phase, columnIndex) => {
            const meta = getColumnMeta(phase, columnIndex);
            const ColIcon = meta.icon;
            const items = byPhase[phase] ?? [];
            return (
              <section
                key={phase}
                className={cn(
                  "flex w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border-2 bg-slate-50 shadow-sm sm:w-[300px]",
                  meta.accent
                )}
              >
                {/* Column header */}
                <div className="border-b-2 border-slate-300 bg-white px-3.5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg border-2",
                        meta.chip
                      )}
                    >
                      <ColIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-bold text-slate-900">
                        {phaseLabel(t, phase)}
                      </h2>
                      <p className="text-[11px] font-medium text-slate-500">
                        {items.length}{" "}
                        {items.length === 1 ? t("phase2.kanban.order") : t("phase2.kanban.orders")}
                      </p>
                    </div>
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg border-2 border-slate-300 bg-slate-100 px-2 text-xs font-bold tabular-nums text-slate-800">
                      {items.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="max-h-[calc(100dvh-320px)] space-y-2.5 overflow-y-auto p-3 scrollbar-thin">
                  {items.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white px-3 py-10 text-center">
                      <ColIcon className="mx-auto mb-2 h-5 w-5 text-slate-400" />
                      <p className="text-xs font-semibold text-slate-500">
                        {t("phase2.kanban.emptyColumn")}
                      </p>
                    </div>
                  ) : (
                    items.map((pedido) => (
                      <Card
                        key={pedido.id}
                        className="group gap-0 border-2 border-slate-300 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:shadow-md"
                      >
                        <CardContent className="space-y-2.5 p-3.5">
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold tracking-wide text-sky-700">
                              {pedido.codigoPedido}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
                              {pedido.nome}
                            </p>
                          </div>

                          {(pedido.responsavelNome || pedido.dadosCliente?.nomeCliente) && (
                            <div className="space-y-1 rounded-lg border-2 border-slate-300 bg-slate-50 px-2 py-1.5">
                              {pedido.responsavelNome && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                                  <UserRound className="h-3 w-3 shrink-0 text-slate-500" />
                                  <span className="truncate">{pedido.responsavelNome}</span>
                                </div>
                              )}
                              {pedido.dadosCliente?.nomeCliente && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                                  <Building2 className="h-3 w-3 shrink-0 text-slate-500" />
                                  <span className="truncate">{pedido.dadosCliente.nomeCliente}</span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "inline-flex rounded-md border-2 px-1.5 py-0.5 text-[10px] font-bold",
                                pedido.statusGeral === "concluido"
                                  ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                                  : pedido.statusGeral === "em_andamento"
                                    ? "border-amber-400 bg-amber-50 text-amber-800"
                                    : "border-slate-300 bg-slate-50 text-slate-700"
                              )}
                            >
                              {t(`status.${pedido.statusGeral}`)}
                            </span>
                            <span className="text-[10px] font-semibold tabular-nums text-slate-500">
                              {new Date(pedido.createdAt).toLocaleDateString(dateFmt)}
                            </span>
                          </div>

                          {pedido.taxaDivergencia != null && pedido.taxaDivergencia > 0 && (
                            <div className="flex items-center gap-1.5 rounded-md border-2 border-amber-400 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-900">
                              <AlertTriangle className="h-3 w-3" />
                              {t("phase2.kanban.divergence")}: {pedido.taxaDivergencia}%
                            </div>
                          )}

                          <Link to={`/resultado/${pedido.id}`} className="block">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-full rounded-lg border-2 border-slate-300 text-xs font-semibold text-slate-800 hover:border-slate-500 hover:bg-slate-50"
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              {t("history.viewDetails")}
                              <ArrowRight className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
