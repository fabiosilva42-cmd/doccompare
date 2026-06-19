import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import {
  DEFAULT_NOTIFICATION_PREFS,
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from "@/lib/notificationPrefs";
import { PageHeader } from "@/components/phase2/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Mail,
  MessageSquare,
  Bell,
  Save,
  Info,
  ArrowRightLeft,
  XCircle,
  Shield,
  Smartphone,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

function PrefRow({
  label,
  description,
  checked,
  onCheckedChange,
  icon: Icon,
  accent,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
        checked
          ? "bg-white border-sky-200/80 shadow-sm shadow-sky-500/5"
          : "bg-slate-50/50 border-transparent hover:bg-white hover:border-slate-200/80"
      )}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", accent)}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="shrink-0" />
    </div>
  );
}

export default function Preferencias() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { success } = useToast();
  const userId = user?.id;
  const [prefs, setPrefs] = useState<NotificationPrefs>(() => loadNotificationPrefs(userId));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setPrefs(loadNotificationPrefs(userId));
    setDirty(false);
  }, [userId]);

  const update = (key: keyof NotificationPrefs, value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    saveNotificationPrefs(prefs, userId);
    setDirty(false);
    success(t("phase2.prefs.saved"), t("phase2.prefs.savedDesc"));
  };

  const handleReset = () => {
    setPrefs({ ...DEFAULT_NOTIFICATION_PREFS });
    setDirty(true);
  };

  const emailEnabled = [
    prefs.emailPhaseAdvance,
    prefs.emailRejection,
    prefs.emailAqlAssignment,
    prefs.emailSupervisorAlert,
  ].filter(Boolean).length;

  const smsEnabled = [prefs.smsRejection, prefs.smsSupervisorOverride].filter(Boolean).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      <PageHeader
        badge={t("phase2.prefs.badge")}
        title={t("phase2.prefs.title")}
        subtitle={t("phase2.prefs.subtitle")}
        icon={Bell}
        gradient="violet"
        stats={[
          { label: t("phase2.prefs.emailSection"), value: `${emailEnabled}/4` },
          { label: t("phase2.prefs.smsSection"), value: `${smsEnabled}/2` },
        ]}
      />

      <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 text-amber-950 text-sm shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <Info className="w-4 h-4 text-amber-700" />
        </div>
        <p className="leading-relaxed pt-1.5">{t("phase2.prefs.frontendOnlyNote")}</p>
      </div>

      <Card className="border-slate-200/80 shadow-md shadow-slate-200/40 overflow-hidden ring-1 ring-slate-100">
        <CardHeader className="pb-3 bg-gradient-to-r from-sky-50/80 to-white border-b border-slate-100">
          <CardTitle className="text-base flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center">
              <Mail className="w-4 h-4 text-sky-700" />
            </div>
            <div>
              <span className="font-bold text-slate-900">{t("phase2.prefs.emailSection")}</span>
              <p className="text-xs font-normal text-slate-500 mt-0.5">{t("phase2.prefs.emailSectionHint")}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          <PrefRow
            icon={ArrowRightLeft}
            accent="bg-sky-100 text-sky-700"
            label={t("phase2.prefs.emailPhaseAdvance")}
            description={t("phase2.prefs.emailPhaseAdvanceDesc")}
            checked={prefs.emailPhaseAdvance}
            onCheckedChange={(v) => update("emailPhaseAdvance", v)}
          />
          <PrefRow
            icon={XCircle}
            accent="bg-red-100 text-red-600"
            label={t("phase2.prefs.emailRejection")}
            description={t("phase2.prefs.emailRejectionDesc")}
            checked={prefs.emailRejection}
            onCheckedChange={(v) => update("emailRejection", v)}
          />
          <PrefRow
            icon={Shield}
            accent="bg-violet-100 text-violet-700"
            label={t("phase2.prefs.emailAql")}
            description={t("phase2.prefs.emailAqlDesc")}
            checked={prefs.emailAqlAssignment}
            onCheckedChange={(v) => update("emailAqlAssignment", v)}
          />
          <PrefRow
            icon={Bell}
            accent="bg-amber-100 text-amber-700"
            label={t("phase2.prefs.emailSupervisor")}
            description={t("phase2.prefs.emailSupervisorDesc")}
            checked={prefs.emailSupervisorAlert}
            onCheckedChange={(v) => update("emailSupervisorAlert", v)}
          />
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-md shadow-slate-200/40 overflow-hidden ring-1 ring-slate-100">
        <CardHeader className="pb-3 bg-gradient-to-r from-violet-50/80 to-white border-b border-slate-100">
          <CardTitle className="text-base flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-violet-700" />
            </div>
            <div>
              <span className="font-bold text-slate-900">{t("phase2.prefs.smsSection")}</span>
              <p className="text-xs font-normal text-slate-500 mt-0.5">{t("phase2.prefs.smsSectionHint")}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          <PrefRow
            icon={XCircle}
            accent="bg-orange-100 text-orange-700"
            label={t("phase2.prefs.smsRejection")}
            description={t("phase2.prefs.smsRejectionDesc")}
            checked={prefs.smsRejection}
            onCheckedChange={(v) => update("smsRejection", v)}
          />
          <PrefRow
            icon={Smartphone}
            accent="bg-indigo-100 text-indigo-700"
            label={t("phase2.prefs.smsSupervisor")}
            description={t("phase2.prefs.smsSupervisorDesc")}
            checked={prefs.smsSupervisorOverride}
            onCheckedChange={(v) => update("smsSupervisorOverride", v)}
          />
        </CardContent>
      </Card>

      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/90 backdrop-blur-md transition-transform duration-300 lg:left-[260px]",
          dirty ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-600 font-medium">{t("phase2.prefs.unsavedChanges")}</p>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="rounded-xl h-10" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              {t("phase2.prefs.reset")}
            </Button>
            <Button type="button" className="rounded-xl h-10 bg-sky-700 hover:bg-sky-800 shadow-lg shadow-sky-500/20 px-6" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
