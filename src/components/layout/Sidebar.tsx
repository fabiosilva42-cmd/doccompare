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
  FileSearch,
  LayoutGrid,
  SlidersHorizontal,
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
    { icon: ShieldCheck, label: t("nav.aqlReviews"), path: "/revisoes-aql" },
  ];

  const adminItems = [
    { icon: Settings, label: t("nav.prompts"), path: "/admin/prompts" },
    { icon: Users, label: t("nav.users"), path: "/admin/usuarios" },
    { icon: FileSearch, label: t("nav.divergences"), path: "/admin/divergencias" },
  ];

  const isActivePath = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="w-[248px] h-full bg-[#0B1120] text-white flex flex-col border-r border-white/5">
      {/* Brand */}
      <div className="h-14 px-4 flex items-center justify-between shrink-0 border-b border-white/5">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 group"
          onClick={onClose}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-sky-600 rounded-lg flex items-center justify-center shadow-md shadow-sky-500/25 group-hover:shadow-sky-500/40 transition-shadow">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[15px] tracking-tight">{t("common.appName")}</span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav — scrolls independently if needed */}
      <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-4 space-y-0.5 scrollbar-thin">
        <p className="px-2.5 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.14em]">
          {t("nav.main")}
        </p>
        {navItems.map((item) => {
          const active = isActivePath(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "relative flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group",
                active
                  ? "bg-sky-500/15 text-white"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-sky-400 rounded-r-full" />
              )}
              <item.icon
                className={cn(
                  "w-[17px] h-[17px] shrink-0 transition-colors",
                  active ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="mt-5 mb-2 px-2.5 flex items-center gap-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.14em]">
                {t("nav.admin")}
              </p>
              <Lock className="w-3 h-3 text-amber-400/80" />
            </div>
            {adminItems.map((item) => {
              const active = isActivePath(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    "relative flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group",
                    active
                      ? "bg-sky-500/15 text-white"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-sky-400 rounded-r-full" />
                  )}
                  <item.icon
                    className={cn(
                      "w-[17px] h-[17px] shrink-0 transition-colors",
                      active ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="shrink-0 border-t border-white/5">
        <LanguageSwitcher variant="sidebar" />

        <div className="p-3">
          <div className="flex items-center gap-2.5 mb-2.5 px-1">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || t("common.user")}
                className="w-8 h-8 rounded-full ring-2 ring-white/10"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-xs font-bold shadow-md shadow-sky-900/40">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate leading-tight">
                {user?.name || t("common.user")}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email || ""}</p>
              {roleLabel && (
                <p className="text-[10px] text-sky-400/90 truncate mt-0.5">{roleLabel}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start gap-2 h-8 text-slate-500 hover:text-white hover:bg-white/[0.06] text-xs rounded-lg"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t("common.logout")}
          </Button>
        </div>
      </div>
    </div>
  );
}
