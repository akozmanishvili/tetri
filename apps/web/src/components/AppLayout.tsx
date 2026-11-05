import { NavLink, Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/context";
import { LanguageSwitcher } from "./LanguageSwitcher";

const links = [
  { to: "/", key: "nav.portfolio", end: true },
  { to: "/markets", key: "nav.markets", end: false },
  { to: "/orders", key: "nav.orders", end: false },
] as const;

export function AppLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-xl font-bold text-red-900">Tetri</span>
            <nav className="flex gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-1.5 text-sm font-medium ${
                      isActive
                        ? "bg-red-50 text-red-900"
                        : "text-stone-600 hover:text-stone-900"
                    }`
                  }
                >
                  {t(l.key)}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <LanguageSwitcher />
            <span className="hidden text-stone-500 sm:inline">
              {user?.displayName}
            </span>
            <button
              onClick={logout}
              className="text-stone-600 hover:text-red-800"
            >
              {t("nav.logout")}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
