import { Navigate, Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "./context";

function FullPageLoader() {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-screen place-items-center text-stone-500">
      <p className="animate-pulse">{t("common.loader")}</p>
    </div>
  );
}

// Only for logged-in users
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullPageLoader />;
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

export function GuestOnly() {
  const { status } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  if (status === "loading") return <FullPageLoader />;
  if (status === "authenticated") return <Navigate to={from} replace />;
  return <Outlet />;
}
