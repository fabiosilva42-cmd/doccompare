import { trpc } from "@/providers/trpc";
import { useTranslation } from "@/i18n/LanguageProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import {
  Bell,
  Check,
  Trash2,
  CheckCheck,
  ArrowRight,
  Loader2,
  Inbox,
  Sparkles,
  AlertTriangle,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router";

function notifIcon(tipo: string) {
  if (tipo.includes("reprov") || tipo.includes("diverg")) return AlertTriangle;
  if (tipo.includes("conclu") || tipo.includes("comparacao")) return FileCheck;
  if (tipo.includes("fase") || tipo.includes("proxima")) return Sparkles;
  return Bell;
}

function notifAccent(tipo: string, unread: boolean) {
  if (!unread) return "bg-slate-100 text-slate-500";
  if (tipo.includes("reprov") || tipo.includes("diverg")) return "bg-amber-100 text-amber-700";
  if (tipo.includes("conclu")) return "bg-emerald-100 text-emerald-700";
  return "bg-sky-100 text-sky-700";
}

export default function Notificacoes() {
  const { t, locale } = useTranslation();
  const utils = trpc.useUtils();
  const dateFmt = locale === "pt" ? "pt-BR" : "en-US";

  const { data: notificacoes, isLoading } = trpc.notificacao.list.useQuery();

  const marcarLida = trpc.notificacao.marcarLida.useMutation({
    onSuccess: () => {
      utils.notificacao.list.invalidate();
      utils.notificacao.countNaoLidas.invalidate();
    },
  });

  const marcarTodasLidas = trpc.notificacao.marcarTodasLidas.useMutation({
    onSuccess: () => {
      utils.notificacao.list.invalidate();
      utils.notificacao.countNaoLidas.invalidate();
    },
  });

  const excluir = trpc.notificacao.delete.useMutation({
    onSuccess: () => {
      utils.notificacao.list.invalidate();
      utils.notificacao.countNaoLidas.invalidate();
    },
  });

  const unreadCount = notificacoes?.filter((n) => !n.lida).length ?? 0;

  return (
    <PageShell width="wide">
      <PageTitle
        badge={t("nav.notifications")}
        title={t("notifications.title")}
        icon={<Bell className="h-4 w-4" />}
        actions={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
              onClick={() => marcarTodasLidas.mutate()}
              disabled={marcarTodasLidas.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              {t("notifications.markAllRead")}
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-2 border-slate-300 shadow-sm">
              <CardContent className="p-4 flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
          </div>
        </div>
      ) : !notificacoes?.length ? (
        <Card className="border-dashed border-slate-300 bg-slate-50/60">
          <CardContent className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-300 shadow-sm flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-700">{t("notifications.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {notificacoes.map((n) => {
            const Icon = notifIcon(n.tipo);
            const unread = !n.lida;
            return (
              <Card
                key={n.id}
                className={cn(
                  "border-2 border-slate-300 shadow-sm transition-all duration-200 hover:shadow-md group",
                  unread && "border-2 border-sky-400 bg-sky-50/40"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        notifAccent(n.tipo, unread)
                      )}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {unread && (
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                            )}
                            <h3 className="text-sm font-semibold text-slate-900 truncate">
                              {n.titulo}
                            </h3>
                          </div>
                          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                            {n.mensagem}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                            <span className="text-[11px] text-slate-400 font-medium tabular-nums">
                              {new Date(n.createdAt).toLocaleString(dateFmt)}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {n.tipo}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          {unread && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-lg hover:bg-emerald-50 hover:text-emerald-600"
                              onClick={() => marcarLida.mutate({ id: n.id })}
                              title={t("notifications.markRead")}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-500"
                            onClick={() => excluir.mutate({ id: n.id })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {n.referenciaId && n.referenciaTipo === "pedido" && (
                        <Link
                          to={`/resultado/${n.referenciaId}`}
                          className="inline-flex items-center gap-1 text-xs text-sky-700 hover:text-sky-800 font-semibold mt-2.5"
                        >
                          {t("notifications.viewOrder")}
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
