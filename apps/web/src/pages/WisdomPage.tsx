import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/context";
import { useWisdom } from "../lib/queries";

export function WisdomPage() {
  const { t, i18n } = useTranslation();
  const { user, setPreferences } = useAuth();
  const { data, isPending, isError } = useWisdom();
  const ka = i18n.language === "ka";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            🍷 {t("wisdom.title")}
          </h1>
          <p className="mt-1 text-stone-600">{t("wisdom.subtitle")}</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-red-800"
            checked={user?.humorEnabled ?? true}
            onChange={(e) => {
              setPreferences({ humorEnabled: e.target.checked }).catch(
                () => {},
              );
            }}
          />
          {t("wisdom.toggle")}
        </label>
      </div>

      {isPending && <p className="text-stone-500">{t("common.loading")}</p>}
      {isError && <p className="text-red-700">{t("wisdom.loadError")}</p>}

      {data && (
        <>
          <p className="mb-4 text-sm font-medium text-amber-800">
            {t("wisdom.progress", {
              unlocked: data.toasts.length,
              total: data.total,
            })}
          </p>

          {data.toasts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-600">
              {t("wisdom.empty")}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.toasts.map((toast) => (
                <article
                  key={toast.id}
                  className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                >
                  <h2 className="font-semibold text-stone-900">
                    {toast.emoji} {ka ? toast.titleKa : toast.titleEn}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-stone-700">
                    {ka ? toast.bodyKa : toast.bodyEn}
                  </p>
                </article>
              ))}
            </div>
          )}

          {data.total > data.toasts.length && (
            <p className="mt-6 text-center text-sm italic text-stone-500">
              {t("wisdom.locked", {
                remaining: data.total - data.toasts.length,
              })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
