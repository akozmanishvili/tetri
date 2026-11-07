import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/context";
import { apiFetch } from "../lib/api";
import { queryKeys } from "../lib/queries";
import type { Toast } from "../lib/types";
import { TamadaContext, type TamadaConcept } from "./context";

type Queued = { userId: string; toast: Toast };

function TamadaPopup({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const ka = i18n.language === "ka";

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-lg"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
        {t("tamada.says")}
      </p>
      <h3 className="mt-1 font-semibold text-stone-900">
        {toast.emoji} {ka ? toast.titleKa : toast.titleEn}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-700">
        {ka ? toast.bodyKa : toast.bodyEn}
      </p>
      <button
        onClick={onClose}
        className="mt-3 rounded-lg bg-red-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-900"
      >
        {t("tamada.cheers")}
      </button>
    </div>
  );
}

export function TamadaProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<Queued[]>([]);

  const requested = useRef(new Set<string>());

  const unlock = useCallback(
    (concept: TamadaConcept) => {
      if (status !== "authenticated" || !user) return;

      const marker = `${user.id}:${concept}`;
      if (requested.current.has(marker)) return;
      requested.current.add(marker);

      const userId = user.id;
      apiFetch<{ toast: Toast | null }>(`/api/toasts/${concept}/unlock`, {
        method: "POST",
      })
        .then(({ toast }) => {
          if (!toast) return;
          void queryClient.invalidateQueries({ queryKey: queryKeys.wisdom });
          setQueue((q) => [...q, { userId, toast }]);
        })
        .catch(() => requested.current.delete(marker));
    },
    [status, user, queryClient],
  );

  const value = useMemo(() => ({ unlock }), [unlock]);

  const current = user?.humorEnabled
    ? queue.find((q) => q.userId === user.id)
    : undefined;

  function dismiss() {
    if (!current) return;
    setQueue((q) => q.filter((item) => item !== current));
  }

  return (
    <TamadaContext.Provider value={value}>
      {children}
      {current && <TamadaPopup toast={current.toast} onClose={dismiss} />}
    </TamadaContext.Provider>
  );
}
