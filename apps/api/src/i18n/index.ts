import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./en.ts";
import { ka } from "./ka.ts";

export type Language = "ka" | "en";
const STORAGE_KEY = "tetri.lang";

function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ka" || saved === "en") return saved;
  } catch {}
  return navigator.language.toLowerCase().startsWith("ka") ? "ka" : "en";
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ka: { translation: ka } },
  lng: initialLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

function onLanguageChanged(lng: string) {
  document.documentElement.lang = lng;
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {}
}

onLanguageChanged(i18n.language);
i18n.on("languageChanged", onLanguageChanged);

export default i18n;
