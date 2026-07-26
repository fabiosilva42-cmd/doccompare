import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useToast } from "@/hooks/useToast";
import {
  Settings,
  Lock,
  Edit2,
  Eye,
  EyeOff,
  Save,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/phase2/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router";

export default function AdminPrompts() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    nome: "",
    descricao: "",
    promptSistema: "",
    modeloOutput: "",
    categorias: "",
    badge: "BASICO",
    ordem: 0,
    ativo: "sim" as "sim" | "nao",
    departamento: "atendimento" as "atendimento" | "design" | "cq",
    tipoEmbalagem: "todos" as "barcode_label" | "color_box" | "master_carton" | "todos",
    icone: "FileText",
  });

  const { data: prompts, isLoading } = trpc.prompt.listAdmin.useQuery();
  const utils = trpc.useUtils();

  const { success: toastSuccess, error: toastError } = useToast();

  const updateMutation = trpc.prompt.update.useMutation({
    onSuccess: () => {
      utils.prompt.listAdmin.invalidate();
      setEditingId(null);
      toastSuccess("Prompt atualizado", "As alteracoes foram salvas com sucesso.");
    },
    onError: (err) => toastError(t("common.error"), err.message),
  });

  const toggleMutation = trpc.prompt.toggleAtivo.useMutation({
    onSuccess: () => {
      utils.prompt.listAdmin.invalidate();
      toastSuccess("Status alterado", "O prompt foi ativado/desativado.");
    },
    onError: (err) => toastError("Erro", err.message),
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const startEdit = (prompt: NonNullable<typeof prompts>[0]) => {
    setEditingId(prompt.id);
    setEditForm({
      nome: prompt.nome,
      descricao: prompt.descricao,
      promptSistema: prompt.promptSistema,
      modeloOutput: (prompt as any).modeloOutput ?? "",
      categorias: (prompt as any).categorias ?? "",
      badge: prompt.badge,
      ordem: prompt.ordem,
      ativo: prompt.ativo as "sim" | "nao",
      departamento: prompt.departamento,
      tipoEmbalagem: prompt.tipoEmbalagem,
      icone: prompt.icone,
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateMutation.mutate({
      id: editingId,
      ...editForm,
    });
  };

  return (
    <PageShell width="wide">
      <PageHeader
        badge={t("nav.admin")}
        title={t("admin.promptsTitle")}
        subtitle={t("dashboard.managePromptsDesc")}
        icon={Settings}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {prompts?.map((prompt) => (
            <Card
              key={prompt.id}
              className={`border-slate-300 ${prompt.ativo !== "sim" ? "opacity-60" : ""}`}
            >
              {editingId === prompt.id ? (
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">
                      {t("admin.editing", { name: prompt.nome })}
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg h-8"
                      >
                        <X className="w-4 h-4 mr-1" />
                        {t("admin.cancel")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveEdit}
                        disabled={updateMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 rounded-lg h-8"
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-1" />
                        )}
                        {t("admin.save")}
                      </Button>
                    </div>
                  </div>

                  {updateMutation.isError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {t("admin.saveError")}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">
                        {t("admin.name")}
                      </label>
                      <input
                        type="text"
                        value={editForm.nome}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, nome: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">
                        Badge
                      </label>
                      <select
                        value={editForm.badge}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, badge: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="BASICO">BÁSICO</option>
                        <option value="PRO">PRO</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">
                      Descrição Pública
                    </label>
                    <textarea
                      value={editForm.descricao}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, descricao: e.target.value }))
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Prompt do Sistema (protegido)
                    </label>
                    <textarea
                      value={editForm.promptSistema}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          promptSistema: e.target.value,
                        }))
                      }
                      rows={8}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs resize-y"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">
                      Modelo de Output Padrão
                    </label>
                    <textarea
                      value={editForm.modeloOutput}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          modeloOutput: e.target.value,
                        }))
                      }
                      rows={4}
                      placeholder="Descreva aqui o formato de saída esperado da IA para este prompt..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs resize-y"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">
                      Categorias (separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      value={editForm.categorias}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          categorias: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">
                        Ordem
                      </label>
                      <input
                        type="number"
                        value={editForm.ordem}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            ordem: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">
                        Status
                      </label>
                      <select
                        value={editForm.ativo}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            ativo: e.target.value as "sim" | "nao",
                          }))
                        }
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="sim">Ativo</option>
                        <option value="nao">Inativo</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">
                          {prompt.nome}
                        </h3>
                        <Badge
                          variant={prompt.badge === "PRO" ? "default" : "outline"}
                          className="text-[10px]"
                        >
                          {prompt.badge}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            prompt.ativo === "sim"
                              ? "text-emerald-600 border-emerald-200"
                              : "text-slate-400 border-slate-300"
                          }`}
                        >
                          {prompt.ativo === "sim" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">
                        {prompt.descricao}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Lock className="w-3 h-3" />
                        <span>Prompt protegido</span>
                        <span className="mx-1">|</span>
                        <span>
                          {((prompt as any).categorias ?? "").split(",").filter(Boolean).length} categorias
                        </span>
                        <span className="mx-1">|</span>
                        <span>Ordem: {prompt.ordem}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => startEdit(prompt)}
                      >
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleMutation.mutate({ id: prompt.id })}
                        title={
                          prompt.ativo === "sim"
                            ? "Desativar"
                            : "Ativar"
                        }
                      >
                        {prompt.ativo === "sim" ? (
                          <EyeOff className="w-4 h-4 text-slate-500" />
                        ) : (
                          <Eye className="w-4 h-4 text-slate-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
