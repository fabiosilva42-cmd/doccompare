import { useState, useMemo } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useToast } from "@/hooks/useToast";
import {
  applyPedidoFilters,
  DEFAULT_PEDIDO_FILTERS,
  pedidosToExportRows,
  pedidoExportFieldDefs,
  type PedidoFilterState,
  type PedidoListItem,
} from "@/lib/pedidoFilters";
import { phaseLabel } from "@/lib/kanbanColumns";
import { PedidoAdvancedFilters } from "@/components/filters/PedidoAdvancedFilters";
import { ExportBuilderMenu } from "@/components/ExportBuilderMenu";
import {
  Eye,
  Trash2,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  AlertTriangle,
  Package,
  ClipboardList,
} from "lucide-react";
import { PageHeader } from "@/components/phase2/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SortField = "nome" | "faseAtual" | "createdAt" | "statusGeral";
type SortDir = "asc" | "desc";

const statusStyle: Record<string, { color: string; dot: string; bg: string }> = {
  pendente: { color: "text-slate-600 bg-slate-100 border-slate-300", dot: "bg-slate-400", bg: "bg-slate-50" },
  em_andamento: { color: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-500", bg: "bg-amber-50/50" },
  concluido: { color: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", bg: "bg-emerald-50/50" },
  arquivado: { color: "text-slate-400 bg-slate-50 border-slate-300", dot: "bg-slate-300", bg: "bg-slate-50/50" },
  cancelado: { color: "text-red-700 bg-red-50 border-red-200", dot: "bg-red-500", bg: "bg-red-50/50" },
};

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
  return sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-sky-600" /> : <ArrowDown className="w-3 h-3 text-sky-600" />;
}

function DeleteModal({ open, onClose, onConfirm, itemName, isPending }: { open: boolean; onClose: () => void; onConfirm: () => void; itemName: string; isPending: boolean }) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t("history.deleteTitle")}</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          {t("history.deleteConfirm", { name: itemName })}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="rounded-xl h-10">{t("common.cancel")}</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending} className="rounded-xl h-10">{isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("common.delete")}</Button>
        </div>
      </div>
    </div>
  );
}

export default function Historico() {
  const { t, locale } = useTranslation();
  const [filters, setFilters] = useState<PedidoFilterState>({ ...DEFAULT_PEDIDO_FILTERS });
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [deleteModal, setDeleteModal] = useState<{ id: number; name: string } | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  const { data: pedidosList, isLoading } = trpc.pedido.list.useQuery();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.pedido.delete.useMutation({
    onSuccess: () => { utils.pedido.list.invalidate(); setDeleteModal(null); toastSuccess(t("history.deleted"), t("history.deletedDesc")); },
    onError: (err) => toastError(t("history.deleteError"), err.message),
  });

  const duplicateMutation = trpc.pedido.duplicar.useMutation({
    onSuccess: () => { utils.pedido.list.invalidate(); toastSuccess(t("history.duplicated"), t("history.duplicatedDesc")); },
    onError: (err) => toastError(t("history.duplicateError"), err.message),
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) { setSortDir((d) => (d === "asc" ? "desc" : "asc")); }
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const list = (pedidosList ?? []) as PedidoListItem[];
    const base = applyPedidoFilters(list, filters);
    return [...base].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "nome": cmp = a.nome.localeCompare(b.nome); break;
        case "faseAtual": cmp = (a.faseAtual ?? "").localeCompare(b.faseAtual ?? ""); break;
        case "statusGeral": cmp = (a.statusGeral ?? "").localeCompare(b.statusGeral ?? ""); break;
        case "createdAt": cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [pedidosList, filters, sortField, sortDir]);

  const exportLabels = useMemo(
    () => ({
      code: t("history.colCode"),
      name: t("history.colName"),
      phase: t("history.colPhase"),
      status: t("history.colStatus"),
      department: t("phase2.filters.department"),
      client: t("phase2.export.client"),
      po: t("phase2.export.po"),
      assignee: t("phase2.kanban.assignee"),
      docs: t("history.docs"),
      comparisons: t("phase2.export.comparisons"),
      divergence: t("phase2.filters.divergenceRate"),
      created: t("history.colDate"),
    }),
    [t]
  );

  const exportRows = useMemo(
    () =>
      pedidosToExportRows(
        filtered,
        exportLabels,
        (ph) => phaseLabel(t, ph),
        (st) => t(`status.${st}`),
        (dept) => phaseLabel(t, dept),
        locale
      ),
    [filtered, exportLabels, t, locale]
  );

  const exportFields = useMemo(() => pedidoExportFieldDefs(exportLabels), [exportLabels]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const hasActiveFilters =
    filters.search ||
    filters.status !== "todos" ||
    filters.phase !== "todos" ||
    filters.department !== "todos" ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.divergenceMin ||
    filters.divergenceMax;

  const totalCount = (pedidosList ?? []).length;

  return (
    <PageShell width="wide" className="pb-4">
      <DeleteModal open={deleteModal !== null} onClose={() => setDeleteModal(null)} onConfirm={() => { if (deleteModal) deleteMutation.mutate({ id: deleteModal.id }); }} itemName={deleteModal?.name ?? ""} isPending={deleteMutation.isPending} />

      <PageHeader
        badge={t("history.records")}
        title={t("history.title")}
        subtitle={t("history.subtitle")}
        icon={ClipboardList}
        stats={[
          { label: t("phase2.history.totalOrders"), value: totalCount },
          { label: t("phase2.history.showing"), value: filtered.length },
        ]}
      >
        <ExportBuilderMenu rows={exportRows} fields={exportFields} filename="doccompare-pedidos" sheetName="Pedidos" variant="hero" />
      </PageHeader>

      <PedidoAdvancedFilters filters={filters} onChange={setFilters} onResetPage={() => setPage(1)} variant="elevated" />

      <Card className="border-2 border-slate-300 shadow-sm shadow-slate-900/[0.03] overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Package className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 font-medium">{hasActiveFilters ? t("history.noResults") : t("history.empty")}</p>
              {!hasActiveFilters && (
                <Link to="/nova-comparacao" className="mt-3 inline-block">
                  <Button variant="link" className="text-sky-700 font-semibold">{t("dashboard.createFirstOrder")}</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-50/80">
                    <th className="text-left py-3 px-4 font-bold text-[10px] text-slate-500 uppercase tracking-[0.1em] cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort("nome")}>
                      <span className="flex items-center gap-1">{t("history.orderCol")} <SortIcon field="nome" sortField={sortField} sortDir={sortDir} /></span>
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-[10px] text-slate-500 uppercase tracking-[0.1em] cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort("faseAtual")}>
                      <span className="flex items-center gap-1">{t("history.colPhase")} <SortIcon field="faseAtual" sortField={sortField} sortDir={sortDir} /></span>
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-[10px] text-slate-500 uppercase tracking-[0.1em]">{t("history.docs")}</th>
                    <th className="text-left py-3 px-4 font-bold text-[10px] text-slate-500 uppercase tracking-[0.1em] cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort("createdAt")}>
                      <span className="flex items-center gap-1">{t("history.colDate")} <SortIcon field="createdAt" sortField={sortField} sortDir={sortDir} /></span>
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-[10px] text-slate-500 uppercase tracking-[0.1em] cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort("statusGeral")}>
                      <span className="flex items-center gap-1">{t("history.colStatus")} <SortIcon field="statusGeral" sortField={sortField} sortDir={sortDir} /></span>
                    </th>
                    <th className="text-right py-3 px-4 font-bold text-[10px] text-slate-500 uppercase tracking-[0.1em]">{t("history.colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((pedido) => {
                    const status = statusStyle[pedido.statusGeral] ?? statusStyle.pendente;
                    const statusLabel = t(`status.${pedido.statusGeral}`);
                    return (
                      <tr key={pedido.id} className="border-b border-slate-100 hover:bg-sky-50/40 transition-colors group">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-3.5 h-3.5 text-sky-600" />
                            </div>
                            <span className="font-semibold text-slate-900 truncate">{pedido.codigoPedido} — {pedido.nome}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-medium bg-white">{phaseLabel(t, pedido.faseAtual)}</Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium tabular-nums">{pedido.documentoCount ?? 0}</td>
                        <td className="py-3 px-4 text-slate-500 text-xs font-medium whitespace-nowrap">{new Date(pedido.createdAt).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US")}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${status.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />{statusLabel}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Link to={`/resultado/${pedido.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-sky-50 hover:text-sky-600" title={t("history.viewDetails")}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-emerald-50 hover:text-emerald-600" title={t("history.duplicateOrder")} onClick={() => duplicateMutation.mutate({ id: pedido.id })} disabled={duplicateMutation.isPending}>
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-500" title={t("history.deleteOrder")} onClick={() => setDeleteModal({ id: pedido.id, name: `${pedido.codigoPedido} — ${pedido.nome}` })}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-300 bg-slate-50/50">
              <p className="text-xs text-slate-500 font-medium">{t("history.resultsCount", { count: filtered.length })} — {t("history.pageOf", { page, total: totalPages })}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-300" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                  return (
                    <Button key={pageNum} variant={page === pageNum ? "default" : "outline"} size="sm"
                      className={`h-8 w-8 text-xs p-0 rounded-lg font-semibold ${page === pageNum ? "bg-sky-700 text-white hover:bg-sky-800" : "border-slate-300 text-slate-600"}`}
                      onClick={() => setPage(pageNum)}>{pageNum}</Button>
                  );
                })}
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-300" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
