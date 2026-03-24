import { useState, useEffect, useCallback } from "react";
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
  localStorage.removeItem("authToken");
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
      const authToken = localStorage.getItem("authToken");
      const res = await fetch("/api/auth/user", {
        credentials: "include",
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.ok) {
        const userData = await res.json();
        storeUser(userData);
        setUser(userData);
      } else {
        clearStoredUser();
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
    
    const handleAuthChange = () => {
      setUser(getStoredUser());
    };
    
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [fetchUser]);

  const logout = useCallback(async () => {
    const authToken = localStorage.getItem("authToken");
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    });
    clearStoredUser();
    setUser(null);
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
