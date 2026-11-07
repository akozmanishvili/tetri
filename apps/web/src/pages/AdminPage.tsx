import { useState, type FormEvent } from "react";
import { Navigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/context";
import { apiFetch, getErrorMessage } from "../lib/api";
import type { Toast } from "../lib/types";

type AdminToast = Toast & { _count: { unlockedBy: number } };
type ToastForm = Omit<Toast, "id">;

const EMPTY: ToastForm = {
  conceptKey: "",
  emoji: "🍷",
  titleKa: "",
  titleEn: "",
  bodyKa: "",
  bodyEn: "",
  isActive: true,
};

const input =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-800";

const ADMIN_TOASTS = ["admin", "toasts"] as const;

export function AdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "ADMIN";

  const toasts = useQuery({
    queryKey: ADMIN_TOASTS,
    queryFn: () => apiFetch<AdminToast[]>("/api/admin/toasts"),
    enabled: isAdmin,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ToastForm>(EMPTY);

  const save = useMutation({
    mutationFn: (body: ToastForm) =>
      editingId
        ? apiFetch<Toast>(`/api/admin/toasts/${editingId}`, {
            method: "PATCH",
            body: JSON.stringify(body),
          })
        : apiFetch<Toast>("/api/admin/toasts", {
            method: "POST",
            body: JSON.stringify(body),
          }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_TOASTS });
      setEditingId(null);
      setForm(EMPTY);
    },
  });

  const toggleActive = useMutation({
    mutationFn: (toast: AdminToast) =>
      apiFetch<Toast>(`/api/admin/toasts/${toast.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !toast.isActive }),
      }),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ADMIN_TOASTS }),
  });

  if (!isAdmin) return <Navigate to="/" replace />;

  function startEdit(toast: AdminToast) {
    setEditingId(toast.id);
    setForm({
      conceptKey: toast.conceptKey,
      emoji: toast.emoji,
      titleKa: toast.titleKa,
      titleEn: toast.titleEn,
      bodyKa: toast.bodyKa,
      bodyEn: toast.bodyEn,
      isActive: toast.isActive,
    });
    save.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    save.reset();
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    save.mutate(form);
  }

  const set = <K extends keyof ToastForm>(key: K, value: ToastForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">🍷 Tamada admin</h1>
        <p className="mt-1 text-sm text-stone-600">
          Edit what the Tamada says. Changes are live immediately, no deploy
          needed. A brand-new concept key also needs a trigger in the code.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4"
      >
        <h2 className="font-semibold text-stone-900">
          {editingId ? "Edit toast" : "New toast"}
        </h2>

        <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
          <input
            className={input}
            placeholder="concept_key (e.g. first_loss)"
            value={form.conceptKey}
            onChange={(e) => set("conceptKey", e.target.value)}
            required
          />
          <input
            className={input}
            placeholder="Emoji"
            value={form.emoji}
            onChange={(e) => set("emoji", e.target.value)}
            required
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className={input}
            placeholder="სათაური (ქართ.)"
            value={form.titleKa}
            onChange={(e) => set("titleKa", e.target.value)}
            required
          />
          <input
            className={input}
            placeholder="Title (English)"
            value={form.titleEn}
            onChange={(e) => set("titleEn", e.target.value)}
            required
          />
          <textarea
            className={`${input} min-h-28`}
            placeholder="ტექსტი (ქართ.)"
            value={form.bodyKa}
            onChange={(e) => set("bodyKa", e.target.value)}
            required
          />
          <textarea
            className={`${input} min-h-28`}
            placeholder="Text (English)"
            value={form.bodyEn}
            onChange={(e) => set("bodyEn", e.target.value)}
            required
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-red-800"
            checked={form.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
          />
          Active
        </label>

        {save.isError && (
          <p className="text-sm text-red-700">{getErrorMessage(save.error)}</p>
        )}

        <div className="flex gap-2">
          <button
            disabled={save.isPending}
            className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-900 disabled:opacity-50"
          >
            {save.isPending
              ? "Saving..."
              : editingId
                ? "Save changes"
                : "Create toast"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg px-4 py-2 text-sm text-stone-600 hover:bg-stone-100"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <section>
        <h2 className="mb-3 font-semibold text-stone-900">All toasts</h2>
        {toasts.isPending && <p className="text-stone-500">Loading...</p>}
        {toasts.isError && (
          <p className="text-red-700">{getErrorMessage(toasts.error)}</p>
        )}
        {toasts.data && (
          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-3">Concept</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3 text-right">Heard by</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {toasts.data.map((toast) => (
                  <tr key={toast.id} className="border-t border-stone-100">
                    <td className="px-4 py-3 font-mono text-xs">
                      {toast.conceptKey}
                    </td>
                    <td className="px-4 py-3">
                      {toast.emoji} {toast.titleKa}
                      <span className="block text-xs text-stone-400">
                        {toast.titleEn}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {toast._count.unlockedBy}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive.mutate(toast)}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          toast.isActive
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {toast.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => startEdit(toast)}
                        className="text-red-800 hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
