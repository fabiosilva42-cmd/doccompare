import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useToast } from "@/hooks/useToast";
import { Navigate } from "react-router";
import {
  Users,
  Loader2,
  UserPlus,
  Trash2,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  Shield,
  X,
  Building2,
  Pencil,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const deptLabels: Record<string, string> = {
  atendimento: "Atendimento",
  design: "Design",
  cq: "CQ",

  supervisor: "Supervisor",
  admin: "Admin",
};

const deptColors: Record<string, string> = {
  atendimento: "text-blue-600 bg-blue-50",
  design: "text-pink-600 bg-pink-50",
  cq: "text-emerald-600 bg-emerald-50",

  supervisor: "text-amber-600 bg-amber-50",
  admin: "text-red-600 bg-red-50",
};

function DeleteModal({
  open,
  onClose,
  onConfirm,
  itemName,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  isPending: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Excluir usuario?</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Tem certeza que deseja excluir permanentemente <strong className="text-slate-700">{itemName}</strong>? Esta acao nao pode ser desfeita.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="rounded-xl">
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending} className="rounded-xl">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Excluir"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsuarios() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [departamento, setDepartamento] = useState<string>("atendimento");
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ id: number; name: string } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDept, setEditDept] = useState("");
  const [editSupervisor, setEditSupervisor] = useState(false);

  const utils = trpc.useUtils();

  const { data: usuarios, isLoading } = trpc.usuario.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const { success: toastSuccess, error: toastError } = useToast();

  const createMutation = trpc.usuario.create.useMutation({
    onSuccess: () => {
      utils.usuario.list.invalidate();
      toastSuccess("Usuario criado", `${name} foi adicionado com sucesso.`);
      setName("");
      setEmail("");
      setPassword("");
      setRole("user");
      setDepartamento("atendimento");
      setIsSupervisor(false);
      setShowCreateForm(false);
    },
    onError: (err) => {
      setError(err.message);
      toastError("Erro ao criar usuario", err.message);
    },
  });

  const updateMutation = trpc.usuario.update.useMutation({
    onSuccess: () => {
      utils.usuario.list.invalidate();
      setEditingId(null);
      toastSuccess("Usuario atualizado", "Departamento e supervisor atualizados.");
    },
    onError: (err) => toastError("Erro ao atualizar", err.message),
  });

  const updateRoleMutation = trpc.usuario.updateRole.useMutation({
    onSuccess: () => utils.usuario.list.invalidate(),
  });

  const deleteMutation = trpc.usuario.delete.useMutation({
    onSuccess: () => {
      utils.usuario.list.invalidate();
      setDeleteModal(null);
      toastSuccess("Usuario excluido", "O usuario foi removido permanentemente.");
    },
    onError: (err) => toastError("Erro ao excluir", err.message),
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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password) {
      setError("Preencha todos os campos");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    createMutation.mutate({
      name,
      email,
      password,
      role,
      departamento: departamento as any,
      isSupervisor,
    });
  };

  const startEdit = (u: any) => {
    setEditingId(u.id);
    setEditDept(u.departamento ?? "atendimento");
    setEditSupervisor(u.isSupervisor ?? false);
  };

  const saveEdit = (id: number) => {
    updateMutation.mutate({
      id,
      departamento: editDept as any,
      isSupervisor: editSupervisor,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <DeleteModal
        open={deleteModal !== null}
        onClose={() => setDeleteModal(null)}
        onConfirm={() => {
          if (deleteModal) deleteMutation.mutate({ id: deleteModal.id });
        }}
        itemName={deleteModal?.name ?? ""}
        isPending={deleteMutation.isPending}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-slate-600" />
            {t("admin.usersTitle")}
          </h1>
          <p className="text-sm text-slate-500">{t("dashboard.manageUsersDesc")}</p>
        </div>
        <Button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setError("");
          }}
          className="bg-blue-600 hover:bg-blue-700 rounded-xl"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {showCreateForm ? "Cancelar" : "Novo Usuario"}
        </Button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Criar novo usuario</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nome completo"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@empresa.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimo 6 caracteres"
                      className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Perfil</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as "user" | "admin")}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Departamento</label>
                  <select
                    value={departamento}
                    onChange={(e) => setDepartamento(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="atendimento">Atendimento</option>
                    <option value="design">Design</option>
                    <option value="cq">CQ</option>

                    <option value="supervisor">Supervisor</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isSupervisor"
                  checked={isSupervisor}
                  onChange={(e) => setIsSupervisor(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isSupervisor" className="text-sm text-slate-600 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  Supervisor (pode aprovar overrides)
                </label>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Criar Usuario
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Users table */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : !usuarios || usuarios.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Nenhum usuario cadastrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Perfil</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Departamento</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Criado em</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${u.id === user?.id ? "bg-blue-50/30" : ""}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                            {u.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <span className="font-medium text-slate-900">
                            {u.name}
                            {u.id === user?.id && <span className="text-xs text-blue-500 ml-1">(voce)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">{u.email}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            const newRole = u.role === "admin" ? "user" : "admin";
                            if (confirm(`Alterar ${u.name} para ${newRole === "admin" ? "Administrador" : "Usuario"}?`)) {
                              updateRoleMutation.mutate({ id: u.id, role: newRole });
                            }
                          }}
                          className="cursor-pointer"
                        >
                          {u.role === "admin" ? (
                            <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] hover:bg-amber-200">
                              <Crown className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] hover:bg-slate-100">
                              <User className="w-3 h-3 mr-1" />
                              Usuario
                            </Badge>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        {editingId === u.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={editDept}
                              onChange={(e) => setEditDept(e.target.value)}
                              className="px-2 py-1 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="atendimento">Atendimento</option>
                              <option value="design">Design</option>
                              <option value="cq">CQ</option>

                              <option value="supervisor">Supervisor</option>
                            </select>
                            <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editSupervisor}
                                onChange={(e) => setEditSupervisor(e.target.checked)}
                                className="w-3 h-3 rounded border-slate-300 text-blue-600"
                              />
                              Supervisor
                            </label>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => saveEdit(u.id)} disabled={updateMutation.isPending}>
                              <Save className="w-3.5 h-3.5 text-emerald-600" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingId(null)}>
                              <X className="w-3.5 h-3.5 text-slate-400" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {u.departamento ? (
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${deptColors[u.departamento] ?? ""}`}>
                                <Building2 className="w-3 h-3 mr-0.5" />
                                {deptLabels[u.departamento] ?? u.departamento}
                              </Badge>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                            {u.isSupervisor && (
                              <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[10px] px-1.5 py-0">
                                <Shield className="w-3 h-3 mr-0.5" />
                                Sup.
                              </Badge>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Editar departamento"
                            onClick={() => startEdit(u)}
                          >
                            <Pencil className="w-4 h-4 text-slate-400 hover:text-blue-500" />
                          </Button>
                          {u.id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setDeleteModal({ id: u.id, name: u.name })}
                            >
                              <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
