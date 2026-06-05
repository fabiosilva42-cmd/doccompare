import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  ArrowLeftRight,
  History,
  Settings,
  Users,
  LogOut,
  Sparkles,
  Lock,
  X,
  ShieldCheck,
  Bell,
  ShieldCheck as Shield,
  FileSearch,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onClose?: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: ArrowLeftRight, label: "Nova Comparacao", path: "/nova-comparacao" },
  { icon: History, label: "Historico", path: "/historico" },
  { icon: Bell, label: "Notificacoes", path: "/notificacoes" },
  { icon: Shield, label: "Revisoes AQL", path: "/revisoes-aql" },
];

const adminItems = [
  { icon: Settings, label: "Prompts", path: "/admin/prompts" },
  { icon: Users, label: "Usuarios", path: "/admin/usuarios" },
  { icon: FileSearch, label: "Divergencias", path: "/admin/divergencias" },
];

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <aside className="w-[260px] h-full bg-[#0B1120] text-white flex flex-col">
      {/* Header */}
      <div className="p-5 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-sky-600 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">DocCompare</span>
        </Link>
        <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-[0.15em] mb-2">
          Principal
        </p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "bg-sky-600 text-white shadow-lg shadow-sky-900/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-full" />
              )}
              <item.icon className={cn("w-[18px] h-[18px] transition-transform duration-200", isActive ? "" : "group-hover:scale-110")} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="mt-6 mb-2 px-3 flex items-center gap-2">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.15em]">
                Administracao
              </p>
              <ShieldCheck className="w-3 h-3 text-sky-500" />
            </div>
            {adminItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "bg-sky-600 text-white shadow-lg shadow-sky-900/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-full" />
                  )}
                  <item.icon className={cn("w-[18px] h-[18px] transition-transform duration-200", isActive ? "" : "group-hover:scale-110")} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User card */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="flex items-center gap-3 mb-3">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name || "User"} className="w-9 h-9 rounded-full ring-2 ring-slate-700" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-sky-900/30">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name || "Usuario"}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email || ""}</p>
          </div>
          {isAdmin && (
            <span title="Administrador">
              <Lock className="w-3 h-3 text-amber-400" />
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start gap-2 text-slate-500 hover:text-white hover:bg-slate-800/60 text-xs rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
