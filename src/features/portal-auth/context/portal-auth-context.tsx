"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getPortalMeQueryKey, usePortalMe } from "../hooks/use-portal-me";
import { portalTokenStorage } from "@/lib/portal-token-storage";
import {
  schedulePortalTokenRefresh,
  cancelPortalTokenRefresh,
} from "@/lib/portal-token-refresh";
import type { PortalUser, PortalRole } from "../types/portal-auth";

type PortalAuthContextType = {
  user: PortalUser | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  activeRole: PortalRole;
  isDualRole: boolean;
  switchRole: (_role: PortalRole) => void;
  logout: () => void;
};

const PortalAuthContext = createContext<PortalAuthContextType | null>(null);

export function usePortalAuth() {
  const context = useContext(PortalAuthContext);
  if (!context) {
    throw new Error("usePortalAuth must be used within a PortalAuthProvider");
  }
  return context;
}

function getStoredRole(): PortalRole {
  return portalTokenStorage.getActiveRole();
}

type PortalAuthProviderProps = {
  children: ReactNode;
};

export function PortalAuthProvider({ children }: PortalAuthProviderProps) {
  const { data: user, isLoading } = usePortalMe();
  const queryClient = useQueryClient();
  const [activeRole, setActiveRole] = useState<PortalRole>(getStoredRole);

  const isDualRole = Boolean(user?.is_student && user?.is_parent);

  const switchRole = useCallback((role: PortalRole) => {
    setActiveRole(role);
    portalTokenStorage.setActiveRole(role);
  }, []);

  const logout = useCallback(() => {
    const queryKey = getPortalMeQueryKey(portalTokenStorage.getActiveRole());
    portalTokenStorage.clear();
    cancelPortalTokenRefresh();
    queryClient.setQueryData(queryKey, null);
    queryClient.removeQueries({ queryKey: ["portal"] });
  }, [queryClient]);

  // Sync BroadcastChannel for multi-tab
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel("portal_auth");

    channel.onmessage = (event) => {
      const data = event.data as { type?: string; token?: string } | null;
      if (!data || typeof data !== "object") return;

      if (data.type === "portal_token" && data.token) {
        portalTokenStorage.setTokens(
          { accessToken: data.token },
          { broadcast: false },
        );
        schedulePortalTokenRefresh();
        queryClient.invalidateQueries({ queryKey: ["portal", "me"] });
      }

      if (data.type === "portal_logout") {
        const queryKey = getPortalMeQueryKey(portalTokenStorage.getActiveRole());
        portalTokenStorage.clear({ broadcast: false });
        cancelPortalTokenRefresh();
        queryClient.setQueryData(queryKey, null);
      }
    };

    return () => channel.close();
  }, [queryClient]);

  const value: PortalAuthContextType = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      activeRole,
      isDualRole,
      switchRole,
      logout,
    }),
    [user, isLoading, activeRole, isDualRole, switchRole, logout],
  );

  return (
    <PortalAuthContext.Provider value={value}>
      {children}
    </PortalAuthContext.Provider>
  );
}
