import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useToast } from "@/hooks/useToast";
import {
  Search,
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
  X,
  AlertTriangle,
  Filter,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type SortField = "nome" | "faseAtual" | "createdAt" | "statusGeral";
type SortDir = "asc" | "desc";

const statusConfig: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  pendente: { label: "Pendente", color: "text-slate-600 bg-slate-100 border-slate-200", dot: "bg-slate-400", bg: "bg-slate-50" },
  em_andamento: { label: "Em Andamento", color: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-500", bg: "bg-amber-50/50" },
  concluido: { label: "Concluido", color: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", bg: "bg-emerald-50/50" },
  arquivado: { label: "Arquivado", color: "text-slate-400 bg-slate-50 border-slate-200", dot: "bg-slate-300", bg: "bg-slate-50/50" },
  cancelado: { label: "Cancelado", color: "text-red-700 bg-red-50 border-red-200", dot: "bg-red-500", bg: "bg-red-50/50" },
};

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
  return sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-sky-600" /> : <ArrowDown className="w-3 h-3 text-sky-600" />;
}

function DeleteModal({ open, onClose, onConfirm, itemName, isPending }: { open: boolean; onClose: () => void; onConfirm: () => void; itemName: string; isPending: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Excluir pedido?</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6">Tem certeza que deseja excluir permanentemente <strong className="text-slate-700">{itemName}</strong>? Esta acao nao pode ser desfeita.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="rounded-xl h-10">Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending} className="rounded-xl h-10">{isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Excluir"}</Button>
        </div>
      </div>
    </div>
  );
}

export default function Historico() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [deleteModal, setDeleteModal] = useState<{ id: number; name: string } | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  const { data: pedidosList, isLoading } = trpc.pedido.list.useQuery();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.pedido.delete.useMutation({
    onSuccess: () => { utils.pedido.list.invalidate(); setDeleteModal(null); toastSuccess("Pedido excluido", "O pedido foi removido permanentemente."); },
    onError: (err) => toastError("Erro ao excluir", err.message),
  });

  const duplicateMutation = trpc.pedido.duplicar.useMutation({
    onSuccess: () => { utils.pedido.list.invalidate(); toastSuccess("Pedido duplicado", "Uma copia do pedido foi criada."); },
    onError: (err) => toastError("Erro ao duplicar", err.message),
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) { setSortDir((d) => (d === "asc" ? "desc" : "asc")); }
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  };

  const filtered = pedidosList
    ?.filter((p) => {
      const matchSearch = !search || p.nome.toLowerCase().includes(search.toLowerCase()) || p.codigoPedido.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "todos" || p.statusGeral === statusFilter;
      return matchSearch && matchStatus;
    })
    ?.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "nome": cmp = a.nome.localeCompare(b.nome); break;
        case "faseAtual": cmp = (a.faseAtual ?? "").localeCompare(b.faseAtual ?? ""); break;
        case "statusGeral": cmp = (a.statusGeral ?? "").localeCompare(b.statusGeral ?? ""); break;
        case "createdAt": cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    }) ?? [];

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const statusOptions = ["todos", "concluido", "em_andamento", "pendente", "arquivado", "cancelado"];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <DeleteModal open={deleteModal !== null} onClose={() => setDeleteModal(null)} onConfirm={() => { if (deleteModal) deleteMutation.mutate({ id: deleteModal.id }); }} itemName={deleteModal?.name ?? ""} isPending={deleteMutation.isPending} />

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-sky-500" />
          <span className="text-[10px] font-bold text-sky-600 uppercase tracking-[0.15em]">Registros</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Historico</h1>
        <p className="text-sm text-slate-500 mt-1">Visualize e gerencie todos os seus pedidos.</p>
      </div>

      {/* Filters */}
      <Card className="border-slate-200/80 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Buscar por nome ou codigo..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-colors" />
              {search && (
                <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-slate-400 sm:block hidden" />
              {statusOptions.map((s) => (
                <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`rounded-lg text-xs capitalize h-8 font-semibold ${statusFilter === s ? "bg-sky-700 text-white hover:bg-sky-800 shadow-sm" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {s === "todos" ? "Todos" : statusConfig[s]?.label || s}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-200/80 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Package className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 font-medium">{search || statusFilter !== "todos" ? "Nenhum pedido encontrado com os filtros aplicados." : "Nenhum pedido criado ainda."}</p>
              {!search && statusFilter === "todos" && (
                <Link to="/nova-comparacao" className="mt-3 inline-block">
                  <Button variant="link" className="text-sky-700 font-semibold">Criar primeiro pedido</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="text-left py-3.5 px-4 font-bold text-[10px] text-slate-500 uppercase tracking-[0.1em] cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort("nome")}>
                      <span className="flex items-center gap-1">Pedido <SortIcon field="nome" sortField={sortField} sortDir={sortDir} /></span>
                    </th>
                    <th className="text-left py-3.5 px-4 font-bold text-[10px] text-slate-500 uppercase tracking-[0.1em] cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort("faseAtual")}>
                      <span className="flex items-center gap-1">Fase <SortIcon field="faseAtual" sortField={sortField} sortDir={sortDir} /></span>
                    </th>
                    <th className="text-left py-3.5 px-4 font-bold text-[10px] text-slate-500 uppercase tracking-[0.1em]">Docs</th>
                    <th className="text-left py-3.5 px-4 font-bold text-[10px] text-slate-500 uppercase tracking-[0.1em] cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort("createdAt")}>
                      <span className="flex items-center gap-1">Data <SortIcon field="createdAt" sortField={sortField} sortDir={sortDir} /></span>
                    </th>
                    <th className="text-left py-3.5 px-4 font-bold text-[10px] text-slate-500 uppercase tracking-[0.1em] cursor-pointer select-none hover:text-slate-700 transition-colors" onClick={() => handleSort("statusGeral")}>
                      <span className="flex items-center gap-1">Status <SortIcon field="statusGeral" sortField={sortField} sortDir={sortDir} /></span>
                    </th>
                    <th className="text-right py-3.5 px-4 font-bold text-[10px] text-slate-500 uppercase tracking-[0.1em]">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((pedido) => {
                    const status = statusConfig[pedido.statusGeral] ?? statusConfig.pendente;
                    return (
                      <tr key={pedido.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-50 to-slate-100 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-sky-600" />
                            </div>
                            <span className="font-semibold text-slate-900 truncate max-w-[200px]">{pedido.codigoPedido} — {pedido.nome}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-medium bg-slate-50">{pedido.faseAtual}</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{pedido.documentoCount ?? 0}</td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs font-medium">{new Date(pedido.createdAt).toLocaleDateString("pt-BR")}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${status.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />{status.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link to={`/resultado/${pedido.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-sky-50 hover:text-sky-600 opacity-0 group-hover:opacity-100 transition-all" title="Ver detalhes">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all" title="Duplicar pedido" onClick={() => duplicateMutation.mutate({ id: pedido.id })} disabled={duplicateMutation.isPending}>
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all" title="Excluir pedido" onClick={() => setDeleteModal({ id: pedido.id, name: `${pedido.codigoPedido} — ${pedido.nome}` })}>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
              <p className="text-xs text-slate-500 font-medium">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""} — Pagina {page} de {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
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
                      className={`h-8 w-8 text-xs p-0 rounded-lg font-semibold ${page === pageNum ? "bg-sky-700 text-white hover:bg-sky-800" : "border-slate-200 text-slate-600"}`}
                      onClick={() => setPage(pageNum)}>{pageNum}</Button>
                  );
                })}
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
