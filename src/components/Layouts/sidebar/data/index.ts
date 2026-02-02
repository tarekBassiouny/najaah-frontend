import { type Capability } from "@/lib/capabilities";
import { CENTER_SIDEBAR } from "./sidebar.center";
import { PLATFORM_SIDEBAR } from "./sidebar.platform";

export type SidebarSubItem = {
  title: string;
  url: string;
  capability?: Capability;
};

export type SidebarItem = {
  title: string;
  url?: string;
  capability?: Capability;
  items: SidebarSubItem[];
};

export type SidebarSection = {
  label: string;
  items: SidebarItem[];
};

type RouteCapabilityRule = {
  pattern: string;
  capabilities: Capability[];
};

const SHARED_ROUTE_EXTRAS: RouteCapabilityRule[] = [
  { pattern: "/settings", capabilities: ["view_dashboard"] },
  { pattern: "/settings/*", capabilities: ["view_dashboard"] },
  { pattern: "/playback", capabilities: ["view_dashboard"] },
  { pattern: "/playback/*", capabilities: ["view_dashboard"] },
  { pattern: "/devices/*", capabilities: ["view_dashboard"] },
];

const PLATFORM_ROUTE_EXTRAS: RouteCapabilityRule[] = [
  { pattern: "/roles/*/permissions", capabilities: ["assign_role_permissions"] },
  { pattern: "/permissions", capabilities: ["view_permissions"] },
  { pattern: "/audit", capabilities: ["view_audit_logs"] },
  { pattern: "/audit/*", capabilities: ["view_audit_logs"] },
];

export function getSidebarSections(isPlatformAdmin: boolean): SidebarSection[] {
  return isPlatformAdmin ? PLATFORM_SIDEBAR : CENTER_SIDEBAR;
}

function normalizePath(pathname: string) {
  if (!pathname) return "/";
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

function matchRoute(pathname: string, pattern: string) {
  if (!pattern.includes("*")) {
    return pathname === pattern;
  }

  const [prefix, suffix] = pattern.split("*");
  if (!pathname.startsWith(prefix)) return false;
  if (suffix && !pathname.endsWith(suffix)) return false;
  if (pathname.length < prefix.length + suffix.length) return false;
  return true;
}

function collectRouteRules(sections: SidebarSection[]) {
  const rules: RouteCapabilityRule[] = [];

  sections.forEach((section) => {
    section.items.forEach((item) => {
      if (item.url) {
        const capabilities = item.capability ? [item.capability] : [];
        rules.push({ pattern: item.url, capabilities });
        rules.push({ pattern: `${item.url}/*`, capabilities });
      }

      item.items.forEach((subItem) => {
        const capabilities = subItem.capability ? [subItem.capability] : [];
        rules.push({ pattern: subItem.url, capabilities });
        rules.push({ pattern: `${subItem.url}/*`, capabilities });
      });
    });
  });

  return rules;
}

export function getRouteCapabilities(
  pathname: string,
  isPlatformAdmin: boolean,
): Capability[] | null {
  const normalized = normalizePath(pathname);
  const sections = getSidebarSections(isPlatformAdmin);
  const extras = isPlatformAdmin
    ? [...SHARED_ROUTE_EXTRAS, ...PLATFORM_ROUTE_EXTRAS]
    : SHARED_ROUTE_EXTRAS;

  const ruleMap = new Map<string, Capability[]>();
  collectRouteRules(sections).forEach((rule) => {
    ruleMap.set(rule.pattern, rule.capabilities);
  });
  extras.forEach((rule) => {
    ruleMap.set(rule.pattern, rule.capabilities);
  });

  const patterns = Array.from(ruleMap.keys()).sort(
    (a, b) => b.length - a.length,
  );

  for (const pattern of patterns) {
    if (matchRoute(normalized, pattern)) {
      return ruleMap.get(pattern) ?? [];
    }
  }

  return null;
}

export { PLATFORM_SIDEBAR, CENTER_SIDEBAR };
