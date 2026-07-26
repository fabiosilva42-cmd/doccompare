import { trpc } from "@/providers/trpc";
import { useTranslation } from "@/i18n/LanguageProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { ShieldCheck, Check, X, AlertTriangle, Loader2, ArrowRight, Package } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

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
        <Badge variant="destructive" className="rounded-lg">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {t("aql.divergence")}
        </Badge>
      );
    }
    if (resultado === "aprovado") {
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-600 rounded-lg">
          <Check className="w-3 h-3 mr-1" />
          {t("aql.approve")}
        </Badge>
      );
    }
    if (resultado === "reprovado") {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-700 rounded-lg">
          <X className="w-3 h-3 mr-1" />
          {t("aql.reject")}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 rounded-lg">
        {t("aql.pending")}
      </Badge>
    );
  };

  const pendingCount = revisoes?.filter((r) => r.resultado === null).length ?? 0;

  return (
    <PageShell width="wide">
      <PageTitle
        badge={t("nav.aqlReviews")}
        title={t("aql.title")}
        subtitle={t("aql.subtitle")}
        icon={<ShieldCheck className="h-4 w-4" />}
        actions={
          pendingCount > 0 ? (
            <Badge className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50 tabular-nums">
              {pendingCount} · {t("aql.pending")}
            </Badge>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-2 border-slate-300 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-72 bg-slate-100 rounded animate-pulse" />
                <div className="h-20 w-full bg-slate-50 rounded-xl animate-pulse" />
              </CardContent>
            </Card>
          ))}
          <div className="flex justify-center py-2">
            <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
          </div>
        </div>
      ) : !revisoes?.length ? (
        <Card className="border-dashed border-slate-300 bg-slate-50/60">
          <CardContent className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-300 shadow-sm flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-700">{t("aql.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
          {revisoes.map((r) => {
            const pending = r.resultado === null;
            return (
              <Card
                key={r.id}
                className={cn(
                  "border-2 border-slate-300 shadow-sm hover:shadow-md transition-all duration-200",
                  pending && "border-2 border-amber-400"
                )}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Package className="w-4.5 h-4.5 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{r.pedidoCodigo}</p>
                        <p className="text-sm text-slate-600 truncate">{r.pedidoNome}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <Badge variant="outline" className="text-[10px] rounded-md">
                            {r.tipoEmbalagem}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] rounded-md capitalize">
                            {t(`phase.${r.departamento}`) !== `phase.${r.departamento}`
                              ? t(`phase.${r.departamento}`)
                              : r.departamento}
                          </Badge>
                          {getStatusBadge(r.status, r.resultado)}
                        </div>
                      </div>
                    </div>
                    {r.comparacaoItemId && (
                      <Link
                        to={`/resultado/${r.comparacaoItemId}`}
                        className="inline-flex items-center gap-1 text-xs text-sky-700 hover:text-sky-800 font-semibold shrink-0"
                      >
                        {t("aql.view")}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  {r.resultado && r.observacao && (
                    <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 mb-2">
                      {t("aql.obsPrefix")} {r.observacao}
                    </p>
                  )}

                  {pending && (
                    <div className="mt-1 space-y-3 pt-3 border-t border-slate-100">
                      <Textarea
                        placeholder={t("aql.observationOptional")}
                        value={observacoes[r.id] || ""}
                        onChange={(e) =>
                          setObservacoes((prev) => ({
                            ...prev,
                            [r.id]: e.target.value,
                          }))
                        }
                        className="min-h-[64px] text-sm rounded-xl resize-none"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-emerald-700 border-emerald-200 hover:bg-emerald-50 h-9"
                          onClick={() =>
                            submeterRevisao.mutate({
                              revisaoId: r.id,
                              resultado: "aprovado",
                              observacao: observacoes[r.id],
                            })
                          }
                          disabled={submeterRevisao.isPending}
                        >
                          <Check className="w-4 h-4 mr-1.5" />
                          {t("aql.agreeWithAi")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-amber-700 border-amber-200 hover:bg-amber-50 h-9"
                          onClick={() =>
                            submeterRevisao.mutate({
                              revisaoId: r.id,
                              resultado: "divergencia",
                              observacao:
                                observacoes[r.id] || t("aql.defaultDivergenceNote"),
                            })
                          }
                          disabled={submeterRevisao.isPending}
                        >
                          <AlertTriangle className="w-4 h-4 mr-1.5" />
                          {t("aql.disagreeWithAi")}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
