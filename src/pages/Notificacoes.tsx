import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router";

export default function Notificacoes() {
  const utils = trpc.useUtils();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Notificações</h1>
        {!!notificacoes?.some((n) => !n.lida) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => marcarTodasLidas.mutate()}
          >
            <Check className="w-4 h-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : !notificacoes?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              Você não tem notificações ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notificacoes.map((n) => (
            <Card
              key={n.id}
              className={cn(
                "transition-colors",
                !n.lida && "border-blue-200 bg-blue-50/30"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0",
                      !n.lida ? "bg-blue-500" : "bg-slate-200"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {n.titulo}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {n.mensagem}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-slate-400">
                            {new Date(n.createdAt).toLocaleString("pt-BR")}
                          </span>
                          <span className="text-xs text-slate-400 uppercase">
                            {n.tipo}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!n.lida && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8"
                            onClick={() => marcarLida.mutate({ id: n.id })}
                          >
                            <Check className="w-4 h-4 text-slate-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => excluir.mutate({ id: n.id })}
                        >
                          <Trash2 className="w-4 h-4 text-slate-400" />
                        </Button>
                      </div>
                    </div>

                    {n.referenciaId && n.referenciaTipo === "pedido" && (
                      <Link
                        to={`/resultado/${n.referenciaId}`}
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium mt-2"
                      >
                        Ver pedido →
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
