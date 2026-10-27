import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 " +
  "outline-none focus:border-red-800 focus:ring-2 focus:ring-red-800/20";

export const buttonClass =
  "w-full rounded-lg bg-red-800 px-4 py-2 font-medium text-white " +
  "hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60";

export function AuthLayout({
  title,
  toast,
  children,
}: {
  title: string;
  toast: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-3xl font-bold text-red-900">
          Tetri
        </h1>
        <p className="mb-6 text-center text-sm italic text-stone-500">
          🍷 Tamada: “{toast}”
        </p>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-stone-900">{title}</h2>
          {children}
        </div>
      </div>
    </main>
  );
}
