import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Filter,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const tipoLabel: Record<string, { label: string; color: string }> = {
  falso_positivo: { label: "Falso Positivo", color: "text-amber-600 bg-amber-50" },
  falso_negativo: { label: "Falso Negativo", color: "text-red-600 bg-red-50" },
};

export default function Divergencias() {
  const [filtroDept, setFiltroDept] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroResolvido, setFiltroResolvido] = useState<string>("todos");

  const utils = trpc.useUtils();

  const { data: divergencias, isLoading } = trpc.metricas.listarDivergencias.useQuery({
    departamento: filtroDept !== "todos" ? (filtroDept as any) : undefined,
    tipo: filtroTipo !== "todos" ? (filtroTipo as any) : undefined,
    resolvido: filtroResolvido !== "todos" ? filtroResolvido === "sim" : undefined,
  });

  const resolverMutation = trpc.metricas.resolverDivergencia.useMutation({
    onSuccess: () => utils.metricas.listarDivergencias.invalidate(),
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
            Divergências IA vs Humano
          </h1>
          <p className="text-sm text-slate-500">
            Casos onde o validador humano discordou da análise da IA.
          </p>
        </div>
      </div>

      {/* Taxa Geral */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-5 flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm text-amber-800">
              <strong>Importante:</strong> Cada divergência registrada aqui indica um ponto de calibração
              para os prompts. O objetivo é que essa taxa <strong>diminua ao longo do tempo</strong>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500">Departamento:</span>
          <select
            value={filtroDept}
            onChange={(e) => setFiltroDept(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
          >
            <option value="todos">Todos</option>
            <option value="atendimento">Atendimento</option>
            <option value="design">Design</option>
            <option value="cq">CQ</option>

          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Tipo:</span>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
          >
            <option value="todos">Todos</option>
            <option value="falso_positivo">Falso Positivo</option>
            <option value="falso_negativo">Falso Negativo</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Status:</span>
          <select
            value={filtroResolvido}
            onChange={(e) => setFiltroResolvido(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
          >
            <option value="todos">Todos</option>
            <option value="nao">Pendentes</option>
            <option value="sim">Resolvidos</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : divergencias && divergencias.length > 0 ? (
        <div className="space-y-3">
          {divergencias.map((d) => (
            <Card key={d.id} className={`border-slate-200 ${d.resolvido ? "opacity-60" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${tipoLabel[d.tipo]?.color || ""} text-[10px]`}>
                        {tipoLabel[d.tipo]?.label || d.tipo}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {d.comparacaoDepartamento}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {d.comparacaoItemTipoEmbalagem}
                      </Badge>
                      {d.resolvido && (
                        <Badge className="text-[10px] bg-emerald-50 text-emerald-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Resolvido
                        </Badge>
                      )}
                    </div>

                    {d.campoAfetado && (
                      <p className="text-xs font-medium text-slate-700 mb-1">Campo: {d.campoAfetado}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                        <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider mb-1">IA disse</p>
                        <p className="text-xs text-red-800">{d.descricaoIA || "Não registrado"}</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">Humano discordou</p>
                        <p className="text-xs text-blue-800">{d.descricaoHumano}</p>
                      </div>
                    </div>

                    {d.resolvido && d.resolvidoEm && (
                      <p className="text-[10px] text-slate-400 mt-2">
                        Resolvido em {new Date(d.resolvidoEm).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>

                  {!d.resolvido && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0"
                      onClick={() => resolverMutation.mutate({ id: d.id })}
                      disabled={resolverMutation.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Marcar Resolvido
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-slate-300">
          <CardContent className="p-8 text-center">
            <Eye className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Nenhuma divergência encontrada com os filtros aplicados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
