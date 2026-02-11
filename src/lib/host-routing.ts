export type HostTenant =
  | { kind: "apex"; hostname: string; centerSlug: null }
  | { kind: "admin"; hostname: string; centerSlug: null }
  | { kind: "center"; hostname: string; centerSlug: string }
  | { kind: "unknown"; hostname: string; centerSlug: null };

function extractHostname(host: string) {
  const primary = host.split(",")[0]?.trim().toLowerCase() || "";

  if (!primary) {
    return "";
  }

  if (primary.startsWith("[")) {
    const closingBracketIndex = primary.indexOf("]");
    if (closingBracketIndex > 0) {
      return primary.slice(1, closingBracketIndex);
    }
    return primary;
  }

  const parts = primary.split(":");
  if (parts.length === 2 && /^\d+$/.test(parts[1])) {
    return parts[0];
  }

  return primary;
}

function isIPAddress(hostname: string) {
  if (/^[\d.]+$/.test(hostname)) {
    const parts = hostname.split(".");
    return parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part));
  }

  return hostname.includes(":");
}

function normalizeAppDomain(appDomain?: string | null) {
  if (!appDomain) {
    return null;
  }

  let normalized = appDomain.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    try {
      normalized = new URL(normalized).hostname.toLowerCase();
    } catch {
      return null;
    }
  }

  if (normalized.startsWith(".")) {
    normalized = normalized.slice(1);
  }

  if (normalized.startsWith("www.")) {
    normalized = normalized.slice(4);
  }

  return extractHostname(normalized);
}

export function resolveHostTenant(
  host: string,
  appDomain: string | null = process.env.NEXT_PUBLIC_APP_DOMAIN || null,
): HostTenant {
  const hostname = extractHostname(host);

  if (!hostname) {
    return { kind: "unknown", hostname: "", centerSlug: null };
  }

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    isIPAddress(hostname)
  ) {
    return { kind: "admin", hostname, centerSlug: null };
  }

  const normalizedDomain = normalizeAppDomain(appDomain);
  if (normalizedDomain) {
    if (
      hostname === normalizedDomain ||
      hostname === `www.${normalizedDomain}`
    ) {
      return { kind: "apex", hostname, centerSlug: null };
    }

    if (hostname === `admin.${normalizedDomain}`) {
      return { kind: "admin", hostname, centerSlug: null };
    }

    const domainSuffix = `.${normalizedDomain}`;
    if (hostname.endsWith(domainSuffix)) {
      const subdomain = hostname.slice(0, -domainSuffix.length);

      if (!subdomain || subdomain === "www") {
        return { kind: "apex", hostname, centerSlug: null };
      }

      if (subdomain === "admin") {
        return { kind: "admin", hostname, centerSlug: null };
      }

      if (subdomain.includes(".")) {
        return { kind: "unknown", hostname, centerSlug: null };
      }

      return { kind: "center", hostname, centerSlug: subdomain };
    }

    return { kind: "unknown", hostname, centerSlug: null };
  }

  const parts = hostname.split(".");
  if (parts.length < 2) {
    return { kind: "admin", hostname, centerSlug: null };
  }

  if (parts.length === 2) {
    return { kind: "apex", hostname, centerSlug: null };
  }

  const subdomain = parts[0];
  if (subdomain === "admin") {
    return { kind: "admin", hostname, centerSlug: null };
  }

  if (subdomain === "www") {
    return { kind: "apex", hostname, centerSlug: null };
  }

  return { kind: "center", hostname, centerSlug: subdomain };
}

export function getCenterSlugFromHost(
  host: string,
  appDomain: string | null = process.env.NEXT_PUBLIC_APP_DOMAIN || null,
) {
  const tenant = resolveHostTenant(host, appDomain);
  return tenant.kind === "center" ? tenant.centerSlug : null;
}
