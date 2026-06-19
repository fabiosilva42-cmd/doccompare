import { useTranslation } from "./LanguageProvider";

export function useStatusLabel(key: string) {
  const { t } = useTranslation();
  return t(`status.${key}`);
}

export function usePhaseLabel(key: string) {
  const { t } = useTranslation();
  return t(`phase.${key}`);
}

export function useDocTypeLabel(key: string) {
  const { t } = useTranslation();
  const label = t(`comparison.docTypes.${key}`);
  return label.startsWith("comparison.docTypes.") ? key : label;
}
