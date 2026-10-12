import "@formatjs/intl-pluralrules/polyfill";
import "@formatjs/intl-pluralrules/locale-data/en";
import "@formatjs/intl-pluralrules/locale-data/tr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requireOptionalNativeModule } from "expo-modules-core";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import en from "./locales/en.json";
import tr from "./locales/tr.json";

export type InterfaceLanguage = "en" | "tr";
export const INTERFACE_LANGUAGE_STORAGE_KEY = "kakehashi-interface-language-v1";

function readNativeLanguage(): InterfaceLanguage {
  try {
    const native = requireOptionalNativeModule<{ getInterfaceLocale?: () => string }>("KakehashiHomeWidget");
    return native?.getInterfaceLocale?.() === "tr" ? "tr" : "en";
  } catch { return "en"; }
}
// Headless Android widget tasks run without mounting RootLayout or hydrating AsyncStorage.
const initialLanguage = readNativeLanguage();

void i18next.use(initReactI18next).init({ resources: { en: { translation: en }, tr: { translation: tr } },
  lng: initialLanguage, fallbackLng: "en", supportedLngs: ["en", "tr"], initAsync: false,
  keySeparator: false, interpolation: { escapeValue: false } });

function syncLanguage(language: InterfaceLanguage) {
  void i18next.changeLanguage(language);
  try {
    const native = requireOptionalNativeModule<{ setInterfaceLocale?: (locale: string) => void }>("KakehashiHomeWidget");
    native?.setInterfaceLocale?.(language);
  } catch { /* Non-Android runtimes have no widget bridge. */ }
}

export const useInterfaceLanguageStore = create<{ language: InterfaceLanguage;
  setLanguage: (language: InterfaceLanguage) => void }>()(persist(
  (set) => ({ language: initialLanguage, setLanguage: (language) => {
    syncLanguage(language); set({ language });
  } }),
  { name: INTERFACE_LANGUAGE_STORAGE_KEY, storage: createJSONStorage(() => AsyncStorage),
    skipHydration: true, partialize: ({ language }) => ({ language }),
    merge: (saved, current) => ({ ...current,
      language: (saved as { language?: unknown } | null)?.language === "tr" ? "tr" : "en" }),
    onRehydrateStorage: () => (state, error) => {
      if (state) syncLanguage(state.language);
      else if (error) resetInvalidPreference();
    },
  },
));

function resetInvalidPreference(): void {
  useInterfaceLanguageStore.getState().setLanguage("en");
}

/** Subscribe components without remounting active lessons or review sessions. */
export function useInterfaceLanguage() {
  return useInterfaceLanguageStore((state) => state.language);
}

/** Legacy JSX counters append English suffixes separately from their labels. */
export function uiPluralSuffix(suffix: string): string {
  return useInterfaceLanguageStore.getState().language === "tr" ? "" : suffix;
}

export function uiT(key: keyof typeof en, parameters?: Record<string, unknown>): string {
  const values = { ...parameters };
  if (useInterfaceLanguageStore.getState().language === "tr") {
    for (const match of en[key].matchAll(/(?:minute|sentence|question|list|mistake|item|type)\{\{(value\d+)\}\}/g)) {
      if (values[match[1]] === "s" || values[match[1]] === "es") values[match[1]] = "";
    }
  }
  return String(i18next.t(key, { ...values, defaultValue: en[key] }));
}

export function widgetUiLabel(source: string): string {
  if (useInterfaceLanguageStore.getState().language !== "tr") return source;
  const patterns: [RegExp, keyof typeof en][] = [
    [/^(\d+) available$/, "widget.available"], [/^(\d+) total today$/, "widget.total_today"],
    [/^(\d+) critical items?$/, "widget.critical"], [/^(\d+) recent mistakes?$/, "widget.recent_mistakes"],
    [/^Best (\d+)$/, "widget.best"],
    [/^Freeze in (\d+)d$/, "widget.freeze_in"],
  ];
  for (const [pattern, key] of patterns) { const match = source.match(pattern); if (match) return uiT(key, { count: Number(match[1]) }); }
  if (source === "No upcoming reviews") return uiT("widget.no_upcoming");
  if (source === "No critical items right now") return uiT("widget.no_critical");
  if (source === "Freeze ready") return uiT("widget.freeze_ready");
  return uiMessage(source);
}

const sourceKeys = new Map(Object.entries(en).map(([key, value]) => [value, key]));
/** Explicit UI boundary for labels stored as original English, never for learning content. */
export function uiMessage(source: string): string {
  const key = sourceKeys.get(source);
  return key ? uiT(key as keyof typeof en) : source;
}

export const interfaceLocale = () => useInterfaceLanguageStore.getState().language === "tr" ? "tr-TR" : "en-US";
export const formatUiNumber = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(interfaceLocale(), options).format(value);
export const formatUiDate = (value: Date | number, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(interfaceLocale(), options).format(value);

export async function initializeInterfaceLanguage() {
  await useInterfaceLanguageStore.persist.rehydrate();
}
