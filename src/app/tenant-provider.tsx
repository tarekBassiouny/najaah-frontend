"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import {
  getTenantState,
  subscribeTenant,
  type TenantState,
} from "@/lib/tenant-store";

const TenantContext = createContext<TenantState | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(
    subscribeTenant,
    getTenantState,
    getTenantState,
  );

  return (
    <TenantContext.Provider value={state}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  return context ?? getTenantState();
}
