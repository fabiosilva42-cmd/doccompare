export type Locale = "en" | "pt";

export interface TranslationDict {
  [key: string]: string | TranslationDict;
}
