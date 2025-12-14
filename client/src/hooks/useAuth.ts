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
  window.dispatchEvent(new Event('authChange'));
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
