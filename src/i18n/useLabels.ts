import { useTranslation } from "./LanguageProvider";

export function useStatusLabel(key: string) {
  const { t } = useTranslation();
  return t(`status.${key}`);
}

export function usePhaseLabel(key: string) {
  const { t } = useTranslation();
  const label = t(`phase.${key}`);
  if (label !== `phase.${key}`) return label;
  // Fase dinâmica sem tradução — humaniza o slug em vez de exibir a chave
  return key
    .split(/[_-]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function useDocTypeLabel(key: string) {
  const { t } = useTranslation();
  const label = t(`comparison.docTypes.${key}`);
  return label.startsWith("comparison.docTypes.") ? key : label;
}
