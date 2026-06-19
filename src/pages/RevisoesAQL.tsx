import { trpc } from "@/providers/trpc";
import { useTranslation } from "@/i18n/LanguageProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, Check, X, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

export default function RevisoesAQL() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const [observacoes, setObservacoes] = useState<Record<number, string>>({});

  const { data: revisoes, isLoading } = trpc.aql.minhasRevisoes.useQuery();

  const submeterRevisao = trpc.aql.submeterRevisao.useMutation({
    onSuccess: () => {
      utils.aql.minhasRevisoes.invalidate();
      utils.aql.estatisticas.invalidate();
    },
  });

  const getStatusBadge = (_status: string, resultado?: string | null) => {
    if (resultado === "divergencia") {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {t("aql.divergence")}
        </Badge>
      );
    }
    if (resultado === "aprovado") {
      return (
        <Badge className="bg-green-600">
          <Check className="w-3 h-3 mr-1" />
          {t("aql.approve")}
        </Badge>
      );
    }
    if (resultado === "reprovado") {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-700">
          <X className="w-3 h-3 mr-1" />
          {t("aql.reject")}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-amber-600 border-amber-200">
        {t("aql.pending")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            {t("aql.title")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("aql.subtitle")}
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">{t("aql.loading")}</p>
      ) : !revisoes?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              {t("aql.empty")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {revisoes.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-900">
                        {r.pedidoCodigo}
                      </span>
                      <span className="text-xs text-slate-400">|</span>
                      <span className="text-sm text-slate-600 truncate">
                        {r.pedidoNome}
                      </span>
                      <span className="text-xs text-slate-400">|</span>
                      <Badge variant="outline" className="text-xs">
                        {r.tipoEmbalagem}
                      </Badge>
                      <span className="text-xs text-slate-400">|</span>
                      <Badge variant="secondary" className="text-xs">
                        {r.departamento}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(r.status, r.resultado)}
                      {r.resultado && (
                        <span className="text-xs text-slate-400">
                          {r.observacao && `Obs: ${r.observacao}`}
                        </span>
                      )}
                    </div>

                    {r.resultado === null && (
                      <div className="mt-4 space-y-3">
                        <Textarea
                          placeholder="Observação (opcional)"
                          value={observacoes[r.id] || ""}
                          onChange={(e) =>
                            setObservacoes((prev) => ({
                              ...prev,
                              [r.id]: e.target.value,
                            }))
                          }
                          className="min-h-[60px] text-sm"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-700 border-green-200 hover:bg-green-50"
                            onClick={() =>
                              submeterRevisao.mutate({
                                revisaoId: r.id,
                                resultado: "aprovado",
                                observacao: observacoes[r.id],
                              })
                            }
                            disabled={submeterRevisao.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Concordo com IA
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-700 border-amber-200 hover:bg-amber-50"
                            onClick={() =>
                              submeterRevisao.mutate({
                                revisaoId: r.id,
                                resultado: "divergencia",
                                observacao:
                                  observacoes[r.id] ||
                                  "Divergência identificada na revisão AQL",
                              })
                            }
                            disabled={submeterRevisao.isPending}
                          >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Divergência com IA
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {r.comparacaoItemId && (
                    <Link
                      to={`/resultado/${r.comparacaoItemId}`}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0"
                    >
                      Ver resultado →
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
