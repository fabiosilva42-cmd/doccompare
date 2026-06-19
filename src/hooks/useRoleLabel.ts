import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/i18n/LanguageProvider";

export function useRoleLabel() {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user) return null;

  const parts: string[] = [];
  parts.push(t(`roles.${user.role}`));

  if (user.departamento) {
    const deptKey = user.departamento === "admin" ? "adminDept" : user.departamento;
    parts.push(t(`roles.${deptKey}`));
  }

  if (user.isSupervisor) {
    parts.push(t("roles.supervisorBadge"));
  }

  return parts.join(" · ");
}
