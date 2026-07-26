import { Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/i18n/LanguageProvider";
import { trpc } from "@/providers/trpc";
import { phaseLabel } from "@/lib/kanbanColumns";
import { ExportMenu } from "@/components/ExportMenu";
import {
  FileText,
  Clock,
  BarChart3,
  ArrowRight,
  FileCheck,
  AlertTriangle,
  Activity,
  Package,
  Eye,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Zap,
  Users,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/phase2/PageHeader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#0369A1", "#DC2626", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899"];

function statusStyle(key: string) {
  const styles: Record<string, { color: string; dot: string }> = {
    pendente: { color: "text-slate-600 bg-slate-100 border-slate-300", dot: "bg-slate-400" },
    em_andamento: { color: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-500" },
    concluido: { color: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
    arquivado: { color: "text-slate-400 bg-slate-50 border-slate-300", dot: "bg-slate-300" },
    cancelado: { color: "text-red-700 bg-red-50 border-red-200", dot: "bg-red-500" },
  };
  return styles[key] ?? styles.pendente;
}

function SkeletonCard() {
  return (
    <Card className="border-2 border-slate-300 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-200 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonChart() {
  return (
    <Card className="border-2 border-slate-300 shadow-sm">
      <CardHeader className="pb-2">
        <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ title, icon: Icon, t }: { title: string; icon: React.ElementType; t: (key: string) => string }) {
  return (
    <Card className="border-2 border-slate-300 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <Icon className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm text-slate-500 font-medium">{t("common.noData")}</p>
          <p className="text-xs text-slate-400 mt-1 max-w-[200px]">{t("common.noDataHint")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TendenciaBadge({ variacao }: { variacao: number }) {
  if (variacao === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded-full">
        <Minus className="w-3 h-3" /> 0%
      </span>
    );
  }
  if (variacao > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
        <TrendingUp className="w-3 h-3" /> +{variacao}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] text-red-600 font-medium bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200">
      <TrendingDown className="w-3 h-3" /> {variacao}%
    </span>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === "admin";

  const { data: overview, isLoading: overviewLoading } = trpc.metricas.overview.useQuery();
  const { data: pedidosList, isLoading: pedidosLoading } = trpc.pedido.list.useQuery();
  const { data: promptsList, isLoading: promptsLoading } = trpc.prompt.list.useQuery();
  const { data: reprovacaoDept, isLoading: deptLoading } = trpc.metricas.reprovacaoPorDepartamento.useQuery(undefined, { enabled: isAdmin });
  const { data: reprovacaoEmb, isLoading: embLoading } = trpc.metricas.reprovacaoPorEmbalagem.useQuery(undefined, { enabled: isAdmin });
  const { data: rankingErros, isLoading: rankingLoading } = trpc.metricas.rankingErros.useQuery(undefined, { enabled: isAdmin });
  const { data: tokensMes, isLoading: tokensLoading } = trpc.metricas.tokensPorMes.useQuery(undefined, { enabled: isAdmin });

  const utils = trpc.useUtils();
  const deleteMutation = trpc.pedido.delete.useMutation({
    onSuccess: () => utils.pedido.list.invalidate(),
  });

  const totalPedidos = overview?.totalPedidos ?? 0;
  const pedidosAtivos = overview?.pedidosAtivos ?? 0;
  const totalComparacoes = overview?.totalComparacoes ?? 0;
  const comparacoesConcluidas = overview?.comparacoesConcluidas ?? 0;
  const tendencia = overview?.tendencia;

  const pedidosMes = overview?.tendencia?.pedidos?.atual ?? 0;

  const recentes = pedidosList?.slice(0, 5) ?? [];

  const stats = [
    { icon: FileText, label: t("dashboard.totalOrders"), value: totalPedidos, raw: overview?.totalPedidos ?? 0, tendencia: tendencia?.pedidos, color: "bg-slate-900 text-white", lightColor: "bg-slate-100 text-slate-700" },
    { icon: Activity, label: t("dashboard.activeOrders"), value: pedidosAtivos, raw: overview?.pedidosAtivos ?? 0, color: "bg-sky-700 text-white", lightColor: "bg-sky-50 text-sky-700" },
    { icon: BarChart3, label: t("dashboard.comparisons"), value: totalComparacoes, raw: overview?.totalComparacoes ?? 0, tendencia: tendencia?.comparacoes, color: "bg-violet-700 text-white", lightColor: "bg-violet-50 text-violet-700" },
    { icon: FileCheck, label: t("dashboard.completed"), value: comparacoesConcluidas, raw: overview?.comparacoesConcluidas ?? 0, tendencia: tendencia?.reprovados, color: "bg-emerald-700 text-white", lightColor: "bg-emerald-50 text-emerald-700" },
  ];

  const isAnyLoading = overviewLoading || pedidosLoading;

  const metricsExportRows = [
    {
      [t("dashboard.totalOrders")]: overview?.totalPedidos ?? 0,
      [t("dashboard.activeOrders")]: overview?.pedidosAtivos ?? 0,
      [t("dashboard.comparisons")]: overview?.totalComparacoes ?? 0,
      [t("dashboard.completed")]: overview?.comparacoesConcluidas ?? 0,
    },
  ];

  return (
    <PageShell width="wide">
      <PageHeader
        badge={t("dashboard.platformOperational")}
        title={t("dashboard.greeting", { name: user?.name?.split(" ")[0] || t("common.user") })}
        subtitle={t("dashboard.subtitle", { count: pedidosMes })}
        icon={LayoutDashboard}
      >
        {!overviewLoading && (
          <ExportMenu
            rows={metricsExportRows}
            filename={t("phase2.export.metricsFilename")}
            sheetName="Metrics"
            variant="hero"
            size="sm"
          />
        )}
        <Link to="/nova-comparacao">
          <Button className="h-10 w-full rounded-xl bg-white px-5 font-semibold text-slate-900 hover:bg-slate-100 sm:w-auto">
            <Zap className="mr-2 h-4 w-4 text-sky-600" />
            {t("dashboard.newComparison")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {isAnyLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map((stat) => (
              <Card key={stat.label} className="group border-2 border-slate-300 shadow-sm shadow-slate-900/[0.03] transition-all duration-200 hover:border-slate-400 hover:shadow-md">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2.5">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-500">{stat.label}</p>
                      <p className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-3xl">{stat.value}</p>
                      {stat.tendencia !== undefined && (
                        <TendenciaBadge variacao={stat.tendencia.variacao} />
                      )}
                    </div>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${stat.lightColor}`}>
                      <stat.icon className="h-4.5 w-4.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Admin Charts */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {deptLoading ? <SkeletonChart /> : !reprovacaoDept || reprovacaoDept.length === 0 ? (
            <EmptyChart title={t("dashboard.reprovalByDept")} icon={BarChart3} t={t} />
          ) : (
            <Card className="border-2 border-slate-300 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {t("dashboard.reprovalByDept")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reprovacaoDept}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="departamento" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="taxa" fill="#DC2626" radius={[6, 6, 0, 0]} name="Taxa %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {embLoading ? <SkeletonChart /> : !reprovacaoEmb || reprovacaoEmb.length === 0 ? (
            <EmptyChart title={t("dashboard.reprovalByPackaging")} icon={Package} t={t} />
          ) : (
            <Card className="border-2 border-slate-300 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  {t("dashboard.reprovalByPackaging")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={reprovacaoEmb} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="reprovados" nameKey="tipoEmbalagem" label={({ tipoEmbalagem, taxa }) => `${tipoEmbalagem}: ${taxa}%`}>
                        {reprovacaoEmb.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {rankingLoading ? <SkeletonChart /> : !rankingErros || rankingErros.length === 0 ? (
            <EmptyChart title={t("dashboard.topErrorsFields")} icon={AlertTriangle} t={t} />
          ) : (
            <Card className="border-2 border-slate-300 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {t("dashboard.topErrorsFields")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rankingErros} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="campo" type="category" width={120} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="totalErros" fill="#F59E0B" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {tokensLoading ? <SkeletonChart /> : !tokensMes || tokensMes.length === 0 ? (
            <EmptyChart title={t("dashboard.tokensConsumed")} icon={Activity} t={t} />
          ) : (
            <Card className="border-2 border-slate-300 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  {t("dashboard.tokensConsumed")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tokensMes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="tokensEntrada" stroke="#0369A1" strokeWidth={2.5} dot={false} name={t("dashboard.input")} />
                      <Line type="monotone" dataKey="tokensSaida" stroke="#10B981" strokeWidth={2.5} dot={false} name={t("dashboard.output")} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Orders + Analysis — two-column on large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 lg:gap-8">
      <div className="xl:col-span-3 min-w-0">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-base font-bold text-slate-900">{t("dashboard.recentOrders")}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t("dashboard.recentOrdersDesc")}</p>
          </div>
          <Link to="/historico" className="text-sm text-sky-700 hover:text-sky-800 font-semibold flex items-center gap-1 transition-colors">
            {t("common.viewAll")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {pedidosLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-2 border-slate-300 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-200 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recentes.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-slate-50/50">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm font-medium">{t("dashboard.noOrdersYet")}</p>
              <p className="text-slate-400 text-xs mt-1">{t("dashboard.noOrdersHint")}</p>
              <Link to="/nova-comparacao" className="mt-3 inline-block">
                <Button variant="link" className="text-sky-700 font-semibold">{t("dashboard.createFirstOrder")}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentes.map((pedido) => {
              const status = statusStyle(pedido.statusGeral);
              const statusLabel = t(`status.${pedido.statusGeral}`);
              return (
                <Card key={pedido.id} className="border-2 border-slate-300 shadow-sm hover:shadow-md hover:border-sky-400 transition-all duration-200 group">
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-50 transition-colors">
                      <Package className="w-4.5 h-4.5 text-slate-500 group-hover:text-sky-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{pedido.codigoPedido} — {pedido.nome}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">{phaseLabel(t, pedido.faseAtual)}</Badge>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${status.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/resultado/${pedido.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-sky-50 hover:text-sky-600">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-500" onClick={() => { if (confirm(t("dashboard.deleteOrderConfirm"))) deleteMutation.mutate({ id: pedido.id }); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="xl:col-span-2 min-w-0">
        <div className="mb-3.5">
          <h2 className="text-base font-bold text-slate-900">{t("dashboard.analysisTypes")}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{t("dashboard.analysisTypesDesc")}</p>
        </div>

        {promptsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-2 border-slate-300 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                      <div className="h-3 w-full bg-slate-200 rounded animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !promptsList || promptsList.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-slate-50/50">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm font-medium">{t("dashboard.noPromptsYet")}</p>
              {isAdmin && (
                <Link to="/admin/prompts" className="mt-2 inline-block">
                  <Button variant="link" className="text-sky-700 font-semibold">{t("dashboard.configurePrompts")}</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {promptsList.map((tipo: any) => (
              <Link key={tipo.id} to="/nova-comparacao" state={{ tipoSelecionado: tipo.slug }} className="block">
                <Card className="border-2 border-slate-300 shadow-sm hover:shadow-md hover:border-sky-300/80 transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-100 transition-colors">
                        <Clock className="w-4.5 h-4.5 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-sm text-slate-900 truncate">{tipo.nome}</p>
                          <Badge variant={tipo.badge === "PRO" ? "default" : "outline"} className="text-[10px] px-1.5 py-0 flex-shrink-0 font-semibold">
                            {tipo.badge}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{tipo.descricao}</p>
                        <Badge variant="secondary" className="text-[10px] mt-1.5 capitalize font-medium bg-slate-100 text-slate-600">{t(`roles.${tipo.departamento === "admin" ? "adminDept" : tipo.departamento}`)}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      </div>

      {/* Admin Links */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Link to="/admin/prompts">
            <Card className="border-2 border-slate-300 shadow-sm hover:shadow-md hover:border-sky-300/80 transition-all duration-200 cursor-pointer group h-full">
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-sky-50 transition-colors">
                  <AlertTriangle className="w-4.5 h-4.5 text-slate-600 group-hover:text-sky-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-slate-900">{t("dashboard.managePrompts")}</p>
                  <p className="text-xs text-slate-500 truncate">{t("dashboard.managePromptsDesc")}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/usuarios">
            <Card className="border-2 border-slate-300 shadow-sm hover:shadow-md hover:border-sky-300/80 transition-all duration-200 cursor-pointer group h-full">
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Users className="w-4.5 h-4.5 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-slate-900">{t("dashboard.manageUsers")}</p>
                  <p className="text-xs text-slate-500 truncate">{t("dashboard.manageUsersDesc")}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </PageShell>
  );
}
