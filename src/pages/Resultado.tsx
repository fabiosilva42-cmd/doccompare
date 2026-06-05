import { useParams, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Loader2,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  GitCompare,
  BarChart3,
  FileCheck,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Download,
  ArrowRight,
  RotateCcw,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pendente: { label: "Pendente", color: "text-slate-500 bg-slate-100", icon: Clock },
  processando: { label: "Processando", color: "text-amber-600 bg-amber-50", icon: Loader2 },
  concluido: { label: "Concluído", color: "text-emerald-600 bg-emerald-50", icon: FileCheck },
  erro: { label: "Erro", color: "text-red-600 bg-red-50", icon: AlertCircle },
};

const itemStatusConfig: Record<string, { label: string; color: string }> = {
  ok: { label: "OK", color: "text-emerald-600 bg-emerald-50" },
  warning: { label: "Alerta", color: "text-amber-600 bg-amber-50" },
  critical: { label: "Crítico", color: "text-red-600 bg-red-50" },
  nao_verificavel: { label: "N/A", color: "text-slate-500 bg-slate-100" },
};

function SecaoAccordion({
  titulo,
  conteudo,
  severidade,
}: {
  titulo: string;
  conteudo: string;
  severidade: "info" | "warning" | "critical";
}) {
  const [open, setOpen] = useState(false);
  const severityColors = {
    info: "border-l-blue-400",
    warning: "border-l-amber-400",
    critical: "border-l-red-400",
  };
  return (
    <div className={`border-l-4 ${severityColors[severidade]} bg-white rounded-r-xl`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors rounded-r-xl"
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-2 h-2 rounded-full ${
              severidade === "critical"
                ? "bg-red-400"
                : severidade === "warning"
                ? "bg-amber-400"
                : "bg-blue-400"
            }`}
          />
          <span className="font-medium text-slate-900 text-sm">{titulo}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pl-9">
          <div
            className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(conteudo) }}
          />
        </div>
      )}
    </div>
  );
}

function formatMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code class='bg-slate-100 px-1 py-0.5 rounded text-xs'>$1</code>")
    .replace(/### (.+)/g, "<h3 class='text-lg font-semibold mt-4 mb-2'>$1</h3>")
    .replace(/## (.+)/g, "<h2 class='text-xl font-semibold mt-5 mb-3'>$1</h2>")
    .replace(/# (.+)/g, "<h1 class='text-2xl font-bold mt-6 mb-4'>$1</h1>")
    .replace(/\n/g, "<br/>");
}

export default function Resultado() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [overrideObs, setOverrideObs] = useState("");

  const { data, isLoading, refetch } = trpc.comparacao.getByUuid.useQuery(
    { uuid: id! },
    {
      enabled: !!id,
      refetchInterval: (query) => {
        const status = (query.state.data as any)?.comparacao?.status;
        return status === "processando" || status === "pendente" ? 3000 : false;
      },
    }
  );

  const aprovarItemMutation = trpc.comparacao.aprovarItem.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const pdfMutation = trpc.pdf.gerar.useMutation({
    onSuccess: (data) => {
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${data.pdfBase64}`;
      link.download = data.filename;
      link.click();
    },
  });

  // Workflow hooks
  const pedidoId = data?.pedido?.id as number | undefined;
  const { data: workflowStatus } = trpc.workflow.verificarFase.useQuery(
    { pedidoId: pedidoId! },
    { enabled: !!pedidoId && data?.comparacao?.status === "concluido" }
  );

  const avancarFase = trpc.workflow.avancarFase.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const reprovarFase = trpc.workflow.reprovarFase.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const [reprovarObs, setReprovarObs] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm text-slate-500">Carregando resultado...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Resultado não encontrado</h2>
        <p className="text-slate-500 mb-6">O resultado solicitado não existe ou você não tem acesso.</p>
        <Link to="/dashboard">
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const { comparacao, pedido, itens, documentos } = data as any;
  const status = statusConfig[comparacao?.status] ?? statusConfig.pendente;
  const StatusIcon = status.icon;
  const isAdmin = user?.role === "admin";
  const isSupervisor = user?.isSupervisor;

  const faseLabels: Record<string, string> = {
    atendimento: "Atendimento",
    design: "Design",
    cq: "CQ",

    concluido: "Concluído",
    arquivado: "Arquivado",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Resultado da Análise</h1>
            <p className="text-xs text-slate-500">
              {pedido?.codigoPedido} — {pedido?.nome} — {new Date(comparacao.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
        <Badge className={`${status.color} border-0 text-xs`}>
          <StatusIcon className={`w-3 h-3 mr-1 ${comparacao.status === "processando" ? "animate-spin" : ""}`} />
          {status.label}
        </Badge>
      </div>

      {/* Processing state */}
      {comparacao.status === "processando" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Analisando seus documentos...</h2>
            <p className="text-sm text-slate-500 mb-4">Estamos comparando os documentos do pedido {pedido?.codigoPedido}</p>
            <div className="w-64 h-2 bg-blue-200 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
            <p className="text-xs text-slate-400 mt-3">Tempo estimado: ~45 segundos</p>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {comparacao.status === "erro" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Não foi possível completar a análise</h2>
            <p className="text-sm text-red-600 mb-6">{comparacao.mensagemErro || "Ocorreu um erro inesperado."}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="rounded-xl" onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
              <Link to="/dashboard">
                <Button variant="ghost" className="rounded-xl">Voltar ao Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed state */}
      {comparacao.status === "concluido" && itens && itens.length > 0 && (
        <>
          {/* Workflow status */}
          {pedido && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">
                      Fase atual:
                    </span>
                    <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                      {faseLabels[pedido.faseAtual] || pedido.faseAtual}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      ({pedido.statusGeral})
                    </span>
                  </div>

                  {workflowStatus?.podeAvancar && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() =>
                        avancarFase.mutate({ pedidoId: pedido.id })
                      }
                      disabled={avancarFase.isPending}
                    >
                      {avancarFase.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <ArrowRight className="w-4 h-4 mr-1" />
                      )}
                      Avançar para {faseLabels[workflowStatus.proximaFase!]}
                    </Button>
                  )}
                </div>

                {!workflowStatus?.podeAvancar &&
                  comparacao.status === "concluido" && (
                    <div className="mt-3 pt-3 border-t border-blue-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>Pendentes: {workflowStatus?.pendentes ?? 0}</span>
                          <span>•</span>
                          <span>Reprovados: {workflowStatus?.reprovados ?? 0}</span>
                        </div>
                        {(isAdmin || isSupervisor) && (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Observação de reprovação"
                              value={reprovarObs}
                              onChange={(e) => setReprovarObs(e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded text-xs w-64"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                              onClick={() =>
                                reprovarFase.mutate({
                                  pedidoId: pedido.id,
                                  observacao: reprovarObs || undefined,
                                })
                              }
                              disabled={reprovarFase.isPending}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Reprovar Fase
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {/* Documents info */}
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                <FileText className="w-4 h-4" />
                <span>Documentos do pedido {pedido?.codigoPedido}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {documentos?.map((doc: any) => (
                  <Badge key={doc.id} variant="outline" className="text-xs px-3 py-1">
                    {doc.nomeOriginal}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resultados por embalagem */}
          {itens.map((item: any) => (
            <div key={item.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 capitalize">
                  {item.tipoEmbalagem.replace("_", " ")}
                  <Badge className={`ml-2 text-xs ${itemStatusConfig[item.status]?.color || "text-slate-500 bg-slate-100"}`}>
                    {itemStatusConfig[item.status]?.label || item.status}
                  </Badge>
                </h3>
                <div className="flex gap-2">
                  {item.status === "pendente" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => aprovarItemMutation.mutate({ comparacaoItemId: item.id, status: "reprovado" })}
                        disabled={aprovarItemMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reprovar
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => aprovarItemMutation.mutate({ comparacaoItemId: item.id, status: "aprovado" })}
                        disabled={aprovarItemMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => pdfMutation.mutate({ comparacaoItemId: item.id })}
                    disabled={pdfMutation.isPending}
                  >
                    {pdfMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
                    PDF
                  </Button>
                </div>
              </div>

              {/* Supervisor override */}
              {(isAdmin || isSupervisor) && item.status === "reprovado" && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-amber-800 mb-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="font-medium">Override de Supervisor</span>
                    </div>
                    <p className="text-xs text-amber-600 mb-3">
                      Você pode aprovar este item mesmo com discrepâncias. Justificativa é opcional.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Justificativa (opcional)"
                        value={overrideObs}
                        onChange={(e) => setOverrideObs(e.target.value)}
                        className="flex-1 px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() =>
                          aprovarItemMutation.mutate(
                            { comparacaoItemId: item.id, status: "aprovado", observacao: overrideObs || undefined },
                            { onSuccess: () => refetch() }
                          )
                        }
                      >
                        Aprovar Override
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Resumo Executivo */}
              {item.resumoExecutivo && (
                <Card className="border-l-4 border-l-blue-500 border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                      Resumo Executivo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatMarkdown(item.resumoExecutivo) }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Analysis Sections */}
              {item.secoes && item.secoes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Detalhamento da Análise</h4>
                  {item.secoes.map((secao: any, i: number) => (
                    <SecaoAccordion key={i} titulo={secao.titulo} conteudo={secao.conteudo} severidade={secao.severidade} />
                  ))}
                </div>
              )}

              {/* Items table */}
              {item.analises && item.analises.length > 0 && (
                <Card className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GitCompare className="w-5 h-5 text-blue-500" />
                      Itens Analisados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-2 px-3 font-medium text-slate-500">Campo</th>
                            <th className="text-left py-2 px-3 font-medium text-slate-500">Esperado</th>
                            <th className="text-left py-2 px-3 font-medium text-slate-500">Encontrado</th>
                            <th className="text-center py-2 px-3 font-medium text-slate-500">Status</th>
                            <th className="text-left py-2 px-3 font-medium text-slate-500">Observação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.analises.map((analise: any, i: number) => (
                            <tr
                              key={i}
                              className={`border-b border-slate-100 ${
                                analise.status === "critical"
                                  ? "bg-red-50/50"
                                  : analise.status === "warning"
                                  ? "bg-amber-50/50"
                                  : ""
                              }`}
                            >
                              <td className="py-2 px-3 font-medium text-slate-900">{analise.campo}</td>
                              <td className="py-2 px-3 text-slate-700">{analise.valorEsperado || "—"}</td>
                              <td className="py-2 px-3 text-slate-700">{analise.valorEncontrado || "—"}</td>
                              <td className="py-2 px-3 text-center">
                                <Badge className={`text-[10px] ${itemStatusConfig[analise.status]?.color || ""}`}>
                                  {itemStatusConfig[analise.status]?.label || analise.status}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 text-slate-600 text-xs">{analise.observacao || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}

          {/* Metadata */}
          <Card className="border-slate-200 bg-slate-50/50">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Modelo: {comparacao.modelo || "kimi-latest"}</span>
                </div>
                {comparacao.tokensEntrada && (
                  <div className="flex items-center gap-1.5">
                    <span>Tokens entrada: {comparacao.tokensEntrada.toLocaleString()}</span>
                  </div>
                )}
                {comparacao.tokensSaida && (
                  <div className="flex items-center gap-1.5">
                    <span>Tokens saída: {comparacao.tokensSaida.toLocaleString()}</span>
                  </div>
                )}
                {comparacao.tempoProcessamento && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Tempo: {comparacao.tempoProcessamento}s</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
