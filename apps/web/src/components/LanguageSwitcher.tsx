import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/context";
import type { Language } from "../i18n";

const OPTIONS: { lang: Language; label: string }[] = [
  { lang: "ka", label: "ქარ" },
  { lang: "en", label: "EN" },
];

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const { status, setPreferences } = useAuth();

  function choose(lang: Language) {
    if (lang === i18n.language) return;
    if (status === "authenticated") {
      setPreferences({ locale: lang }).catch(() => {});
    } else {
      void i18n.changeLanguage(lang);
    }
  }

  return (
    <div
      role="group"
      aria-label={t("language.label")}
      className="flex rounded-lg bg-stone-100 p-0.5 text-xs"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.lang}
          onClick={() => choose(o.lang)}
          aria-pressed={i18n.language === o.lang}
          className={`rounded-md px-2 py-1 font-medium ${
            i18n.language === o.lang
              ? "bg-white shadow-sm"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
