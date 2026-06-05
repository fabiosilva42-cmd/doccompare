import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/providers/trpc";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: count } = trpc.notificacao.countNaoLidas.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const { data: notificacoes } = trpc.notificacao.list.useQuery(undefined, {
    enabled: open,
  });

  const marcarLida = trpc.notificacao.marcarLida.useMutation({
    onSuccess: () => {
      utils.notificacao.countNaoLidas.invalidate();
      utils.notificacao.list.invalidate();
    },
  });

  const marcarTodasLidas = trpc.notificacao.marcarTodasLidas.useMutation({
    onSuccess: () => {
      utils.notificacao.countNaoLidas.invalidate();
      utils.notificacao.list.invalidate();
    },
  });

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {!!count && count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                Notificações
              </h3>
              {!!notificacoes?.length && (
                <button
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => marcarTodasLidas.mutate()}
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {!notificacoes?.length ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  Nenhuma notificação
                </div>
              ) : (
                notificacoes.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer",
                      !n.lida && "bg-blue-50/50"
                    )}
                    onClick={() => {
                      if (!n.lida) marcarLida.mutate({ id: n.id });
                      if (n.referenciaTipo === "pedido" && n.referenciaId) {
                        setOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full mt-1.5 shrink-0",
                          !n.lida ? "bg-blue-500" : "bg-transparent"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {n.titulo}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {n.mensagem}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(n.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t border-slate-100 text-center">
              <Link
                to="/notificacoes"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => setOpen(false)}
              >
                Ver todas as notificações
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
