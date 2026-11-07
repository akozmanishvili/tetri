import { NavLink, Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/context";
import { LanguageSwitcher } from "./LanguageSwitcher";

const links = [
  { to: "/", key: "nav.portfolio", end: true },
  { to: "/markets", key: "nav.markets", end: false },
  { to: "/orders", key: "nav.orders", end: false },
  { to: "/wisdom", key: "nav.wisdom", end: false },
] as const;

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
    isActive ? "bg-red-50 text-red-900" : "text-stone-600 hover:text-stone-900"
  }`;

export function AppLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xl font-bold text-red-900">Tetri</span>
            <nav className="flex flex-wrap gap-1">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                  {t(l.key)}
                </NavLink>
              ))}
              {/* Cosmetic only: the API checks the role on every admin request */}
              {user?.role === "ADMIN" && (
                <NavLink to="/admin" className={linkClass}>
                  {t("nav.admin")}
                </NavLink>
              )}
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
