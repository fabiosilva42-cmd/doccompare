import { isMockMode } from "@/mock/handlers";
import { useTranslation } from "@/i18n/LanguageProvider";

export function MockModeBanner() {
  const { t } = useTranslation();
  if (!isMockMode()) return null;

  return (
    <div className="bg-amber-500 text-amber-950 text-center text-xs font-semibold py-1.5 px-4 z-[100] relative">
      {t("mock.banner")}
    </div>
  );
}
