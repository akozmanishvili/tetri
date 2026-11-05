import i18n from "../i18n";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  apiFetch,
  refreshSession,
  setAccessToken,
  setOnSessionExpired,
} from "../lib/api";
import type { AuthResponse, Me, PublicUser } from "../lib/types";
import { AuthContext, type AuthStatus } from "./context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const ok = await refreshSession();
      if (cancelled) return;
      if (!ok) {
        setStatus("unauthenticated");
        return;
      }
      try {
        const me = await apiFetch<Me>("/api/me");
        if (cancelled) return;
        setUser(me);
        void i18n.changeLanguage(me.locale);
        setStatus("authenticated");
      } catch {
        if (!cancelled) setStatus("unauthenticated");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setOnSessionExpired(() => {
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
      queryClient.clear();
    });
    return () => setOnSessionExpired(null);
  }, [queryClient]);

  const handleAuth = useCallback((data: AuthResponse) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus("authenticated");
    void i18n.changeLanguage(data.user.locale); // your saved language wins after login
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      handleAuth(data);
    },
    [handleAuth],
  );

  const signup = useCallback(
    async (input: { email: string; password: string; displayName: string }) => {
      const data = await apiFetch<AuthResponse>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ ...input, locale: i18n.language }),
      });
      handleAuth(data);
    },
    [handleAuth],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch<void>("/api/auth/logout", { method: "POST" });
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
      queryClient.clear();
    }
  }, [queryClient]);

  const setPreferences = useCallback(
    async (prefs: { locale?: "ka" | "en"; humorEnabled?: boolean }) => {
      if (prefs.locale) void i18n.changeLanguage(prefs.locale); // switch instantly, save in background
      const updated = await apiFetch<PublicUser>("/api/me", {
        method: "PATCH",
        body: JSON.stringify(prefs),
      });
      setUser(updated);
    },
    [],
  );

  const value = useMemo(
    () => ({ user, status, login, signup, logout, setPreferences }),
    [user, status, login, signup, logout, setPreferences],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
