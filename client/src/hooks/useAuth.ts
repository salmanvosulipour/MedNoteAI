import { useState, useEffect, useCallback } from "react";
import { getDeviceId } from "@/lib/device";
import { resolveUrl } from "@/lib/queryClient";
import type { User } from "@shared/schema";

function getStoredUser(): User | null {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: User) {
  localStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new Event('authChange'));
}

export function clearStoredUser() {
  localStorage.removeItem("user");
  localStorage.removeItem("user-avatar");
  localStorage.removeItem("user-fullname");
  localStorage.removeItem("user-specialty");
  window.dispatchEvent(new Event('authChange'));
}

export function clearOldProfileKeys() {
  localStorage.removeItem("user-avatar");
  localStorage.removeItem("user-fullname");
  localStorage.removeItem("user-specialty");
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const stored = getStoredUser();
      const token = (stored as any)?.token;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      try {
        const deviceId = await getDeviceId();
        headers["X-Device-ID"] = deviceId;
      } catch { /* non-fatal */ }

      // Skip API call if no token and no session cookie — nothing to validate
      if (!token && window.location.pathname === "/apple-callback") {
        setUser(null);
        return;
      }

      const res = await fetch(resolveUrl("/api/auth/user"), { credentials: "include", headers });
      if (res.ok) {
        const userData = await res.json();
        storeUser({ ...userData, token: token || userData.token });
        setUser({ ...userData, token: token || userData.token });
      } else {
        if (res.status === 401) {
          const body = await res.json().catch(() => ({}));
          if (body?.reason === "device_mismatch") {
            clearStoredUser();
            window.location.href = "/?reason=device_mismatch";
            return;
          }
        }
        // Only wipe stored credentials if we had a token that was rejected.
        // Without a token a 401 is expected — don't clear storage that another
        // flow (e.g. apple-callback) may be in the process of writing.
        if (token) {
          clearStoredUser();
        }
        setUser(null);
      }
    } catch {
      const stored = getStoredUser();
      setUser(stored);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    const handleAuthChange = () => setUser(getStoredUser());
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [fetchUser]);

  const logout = useCallback(async () => {
    const stored = getStoredUser();
    const token = (stored as any)?.token;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      const deviceId = await getDeviceId();
      headers["X-Device-ID"] = deviceId;
    } catch { /* non-fatal */ }
    clearStoredUser();
    setUser(null);
    await fetch(resolveUrl("/api/auth/logout"), { method: "POST", credentials: "include", headers }).catch(() => {});
    window.location.href = "/";
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refetch: fetchUser,
  };
}
