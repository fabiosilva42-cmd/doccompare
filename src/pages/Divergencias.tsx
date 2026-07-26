import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useTranslation } from "@/i18n/LanguageProvider";
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
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/phase2/PageHeader";

export default function Divergencias() {
  const { t, locale } = useTranslation();
  const dateFmt = locale === "pt" ? "pt-BR" : "en-US";
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

  const tipoLabel = (tipo: string) => {
    if (tipo === "falso_positivo") return t("divergences.falsePositive");
    if (tipo === "falso_negativo") return t("divergences.falseNegative");
    return tipo;
  };

  const tipoColor: Record<string, string> = {
    falso_positivo: "text-amber-600 bg-amber-50",
    falso_negativo: "text-red-600 bg-red-50",
  };

  return (
    <PageShell width="wide">
      <PageHeader
        badge={t("nav.admin")}
        title={t("divergences.title")}
        subtitle={t("divergences.subtitle")}
        icon={ShieldAlert}
      >
        <Link to="/dashboard">
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("divergences.back")}
          </Button>
        </Link>
      </PageHeader>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="flex items-center gap-4 p-5">
          <AlertTriangle className="h-8 w-8 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            <strong>{t("divergences.importantTitle")}</strong> {t("divergences.importantBody")}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-500">{t("divergences.filterDept")}:</span>
          <select
            value={filtroDept}
            onChange={(e) => setFiltroDept(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="todos">{t("status.todos")}</option>
            <option value="atendimento">{t("phase.atendimento")}</option>
            <option value="design">{t("phase.design")}</option>
            <option value="cq">{t("phase.cq")}</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{t("divergences.filterType")}:</span>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="todos">{t("status.todos")}</option>
            <option value="falso_positivo">{t("divergences.falsePositive")}</option>
            <option value="falso_negativo">{t("divergences.falseNegative")}</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{t("divergences.filterStatus")}:</span>
          <select
            value={filtroResolvido}
            onChange={(e) => setFiltroResolvido(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="todos">{t("status.todos")}</option>
            <option value="nao">{t("divergences.pendingPlural")}</option>
            <option value="sim">{t("divergences.resolvedPlural")}</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
        </div>
      ) : divergencias && divergencias.length > 0 ? (
        <div className="space-y-3">
          {divergencias.map((d) => (
            <Card key={d.id} className={`border-slate-300 ${d.resolvido ? "opacity-60" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge className={`${tipoColor[d.tipo] || ""} text-[10px]`}>{tipoLabel(d.tipo)}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {t(`phase.${d.comparacaoDepartamento}`) !== `phase.${d.comparacaoDepartamento}`
                          ? t(`phase.${d.comparacaoDepartamento}`)
                          : d.comparacaoDepartamento}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {d.comparacaoItemTipoEmbalagem}
                      </Badge>
                      {d.resolvido && (
                        <Badge className="bg-emerald-50 text-[10px] text-emerald-600">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {t("divergences.resolved")}
                        </Badge>
                      )}
                    </div>

                    {d.campoAfetado && (
                      <p className="mb-1 text-xs font-medium text-slate-700">
                        {t("divergences.field")} {d.campoAfetado}
                      </p>
                    )}

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-red-600">
                          {t("divergences.aiSaid")}
                        </p>
                        <p className="text-xs text-red-800">
                          {d.descricaoIA || t("divergences.notRegistered")}
                        </p>
                      </div>
                      <div className="rounded-lg border border-sky-100 bg-sky-50 p-3">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-sky-700">
                          {t("divergences.humanDisagreed")}
                        </p>
                        <p className="text-xs text-sky-900">{d.descricaoHumano}</p>
                      </div>
                    </div>

                    {d.resolvido && d.resolvidoEm && (
                      <p className="mt-2 text-[10px] text-slate-400">
                        {t("divergences.resolvedOn", {
                          date: new Date(d.resolvidoEm).toLocaleDateString(dateFmt),
                        })}
                      </p>
                    )}
                  </div>

                  {!d.resolvido && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => resolverMutation.mutate({ id: d.id })}
                      disabled={resolverMutation.isPending}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      {t("divergences.resolve")}
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
            <Eye className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">{t("divergences.empty")}</p>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
