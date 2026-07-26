import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-sky-400" />
            </div>
            <div className="absolute -inset-1 rounded-xl border-2 border-sky-500/30 border-t-sky-500 animate-spin" />
          </div>
          <p className="text-sm text-slate-500 font-medium">{t("layout.loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="h-full flex overflow-hidden bg-[#F8FAFC]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Fixed sidebar — never scrolls with page */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 h-full shrink-0
          transform transition-transform duration-300 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Scrollable main column only */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between border-b border-white/5 bg-[#0B1120] px-4 sm:px-6">
          <div className="flex items-center gap-3 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/20">
                <Sparkles className="h-3 w-3 text-sky-400" />
              </div>
              <span className="text-sm font-semibold text-white">{t("common.appName")}</span>
            </div>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-smooth">
          <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
