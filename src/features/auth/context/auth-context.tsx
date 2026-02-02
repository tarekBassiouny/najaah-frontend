"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { type AdminUser } from "@/types/auth";

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

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
