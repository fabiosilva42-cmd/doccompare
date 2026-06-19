import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useRoleLabel } from "@/hooks/useRoleLabel";
import { useTranslation } from "@/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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
  LayoutGrid,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const roleLabel = useRoleLabel();
  const isAdmin = user?.role === "admin";

  const navItems = [
    { icon: LayoutDashboard, label: t("nav.dashboard"), path: "/dashboard" },
    { icon: ArrowLeftRight, label: t("nav.newComparison"), path: "/nova-comparacao" },
    { icon: History, label: t("nav.history"), path: "/historico" },
    { icon: LayoutGrid, label: t("nav.kanban"), path: "/kanban" },
    { icon: Bell, label: t("nav.notifications"), path: "/notificacoes" },
    { icon: SlidersHorizontal, label: t("nav.preferences"), path: "/preferencias" },
    { icon: Shield, label: t("nav.aqlReviews"), path: "/revisoes-aql" },
  ];

  const adminItems = [
    { icon: Settings, label: t("nav.prompts"), path: "/admin/prompts" },
    { icon: Users, label: t("nav.users"), path: "/admin/usuarios" },
    { icon: FileSearch, label: t("nav.divergences"), path: "/admin/divergencias" },
  ];

  return (
    <aside className="w-[260px] h-full bg-[#0B1120] text-white flex flex-col">
      <div className="p-5 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-sky-600 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">{t("common.appName")}</span>
        </Link>
        <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-[0.15em] mb-2">
          {t("nav.main")}
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
                {t("nav.admin")}
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

      <LanguageSwitcher variant="sidebar" />

      <div className="p-4 border-t border-slate-800/80">
        <div className="flex items-center gap-3 mb-3">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name || t("common.user")} className="w-9 h-9 rounded-full ring-2 ring-slate-700" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-sky-900/30">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name || t("common.user")}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email || ""}</p>
            {roleLabel && (
              <p className="text-[10px] text-sky-400/90 truncate mt-0.5">{roleLabel}</p>
            )}
          </div>
          {isAdmin && (
            <span title={t("common.admin")}>
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
          {t("common.logout")}
        </Button>
      </div>
    </aside>
  );
}
