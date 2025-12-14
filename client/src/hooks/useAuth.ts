import { useState, useEffect } from "react";
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
  // Clear old global profile keys (legacy)
  localStorage.removeItem("user-avatar");
  localStorage.removeItem("user-fullname");
  localStorage.removeItem("user-specialty");
  window.dispatchEvent(new Event('authChange'));
}

export function clearOldProfileKeys() {
  // Clear old global profile keys that may have been set before user-specific keys
  localStorage.removeItem("user-avatar");
  localStorage.removeItem("user-fullname");
  localStorage.removeItem("user-specialty");
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setIsLoading(false);
    
    const handleAuthChange = () => {
      setUser(getStoredUser());
    };
    
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
