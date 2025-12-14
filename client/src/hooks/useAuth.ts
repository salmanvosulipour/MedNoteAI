import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";

// Get stored user from localStorage
function getStoredUser(): User | null {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// Store user in localStorage
export function storeUser(user: User) {
  localStorage.setItem("user", JSON.stringify(user));
}

// Clear stored user
export function clearStoredUser() {
  localStorage.removeItem("user");
  localStorage.removeItem("authToken");
}

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      // First try to get user from server (with session)
      try {
        const res = await fetch("/api/auth/user", {
          credentials: "include",
        });
        if (res.ok) {
          const serverUser = await res.json();
          storeUser(serverUser);
          return serverUser;
        }
      } catch {
        // Server auth failed, fall back to localStorage
      }
      
      // Fall back to localStorage
      return getStoredUser();
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: () => {
      clearStoredUser();
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  };
}
