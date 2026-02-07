"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { type AdminUser } from "@/types/auth";
import { tokenStorage } from "@/lib/token-storage";
import { scheduleTokenRefresh, cancelTokenRefresh } from "@/lib/token-refresh";

type AuthContextType = {
  user: AdminUser | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: user, isLoading } = useAdminMe();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel("auth");

    channel.onmessage = (event) => {
      const data = event.data as { type?: string; token?: string } | null;
      if (!data || typeof data !== "object") return;

      if (data.type === "token" && data.token) {
        tokenStorage.setTokens(
          { accessToken: data.token },
          { broadcast: false },
        );
        scheduleTokenRefresh();
        queryClient.invalidateQueries({ queryKey: ["admin", "me"] });
      }

      if (data.type === "logout") {
        tokenStorage.clear({ broadcast: false });
        cancelTokenRefresh();
        queryClient.setQueryData(["admin", "me"], null);
      }
    };

    return () => channel.close();
  }, [queryClient]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
