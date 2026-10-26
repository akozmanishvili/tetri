let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;
let onSessionExpired: (() => void) | null = null;

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setOnSessionExpired(callback: (() => void) | null) {
  onSessionExpired = callback;
}

export function refreshSession(): Promise<boolean> {
  refreshPromise ??= (async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        accessToken = null;
        return false;
      }
      const data = (await res.json()) as { accessToken: string };
      accessToken = data.accessToken;
      return true;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(path, { ...init, headers, credentials: "include" });

  if (res.status === 401 && retry && !path.startsWith("/api/auth/")) {
    if (await refreshSession()) return apiFetch<T>(path, init, false);
    onSessionExpired?.();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error ?? res.statusText, body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const issues = (err.body as { issues?: { message: string }[] } | null)
      ?.issues;
    if (issues?.length) return issues.map((i) => i.message).join(" · ");
    return err.message;
  }
  return "Something went wrong. Please try again.";
}
