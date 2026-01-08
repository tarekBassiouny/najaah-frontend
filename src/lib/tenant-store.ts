import { defaultApiKey } from "./runtime-config";

export type Branding = {
  logoUrl?: string;
  primaryColor?: string;
  [key: string]: unknown;
};

export type TenantState = {
  apiKey: string;
  centerSlug: string | null;
  centerId: string | number | null;
  branding: Branding | null;
  isResolved: boolean;
};

type TenantListener = () => void;

let tenantState: TenantState = {
  apiKey: defaultApiKey,
  centerSlug: null,
  centerId: null,
  branding: null,
  isResolved: false,
};

const listeners = new Set<TenantListener>();

export function getTenantState() {
  return tenantState;
}

export function getTenantApiKey() {
  return tenantState.apiKey || defaultApiKey;
}

export function setTenantState(partial: Partial<TenantState>) {
  tenantState = { ...tenantState, ...partial };
  listeners.forEach((listener) => listener());
}

export function subscribeTenant(listener: TenantListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
