"use client";

import { useEffect, useRef } from "react";
import { resolveCenter } from "@/services/resolve.service";
import { defaultApiKey } from "@/lib/runtime-config";
import { setTenantState } from "@/lib/tenant-store";

function isIPAddress(hostname: string) {
  // IPv4: digits and dots only, all parts are numbers
  if (/^[\d.]+$/.test(hostname)) {
    const parts = hostname.split(".");
    return parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p));
  }
  // IPv6: contains colons or is wrapped in brackets
  if (hostname.includes(":") || hostname.startsWith("[")) {
    return true;
  }
  return false;
}

function getCenterSlugFromHost(host: string) {
  const hostname = host.split(":")[0];

  // IP addresses don't have subdomains
  if (isIPAddress(hostname) || hostname === "localhost") {
    return null;
  }

  const parts = hostname.split(".");
  if (parts.length < 3) {
    return null;
  }

  const subdomain = parts[0];
  if (subdomain === "admin") {
    return null;
  }

  return subdomain;
}

export function AppBootstrapProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const slug = getCenterSlugFromHost(window.location.host);

    if (!slug) {
      setTenantState({
        apiKey: defaultApiKey,
        centerSlug: null,
        centerId: null,
        branding: null,
        isResolved: true,
      });
      return;
    }

    resolveCenter(slug)
      .then((resolved) => {
        if (!resolved) {
          setTenantState({
            apiKey: defaultApiKey,
            centerSlug: null,
            centerId: null,
            branding: null,
            isResolved: true,
          });
          return;
        }

        if (resolved.branding?.primaryColor) {
          document.documentElement.style.setProperty(
            "--brand-primary",
            resolved.branding.primaryColor,
          );
        }

        setTenantState({
          apiKey: resolved.apiKey || defaultApiKey,
          centerSlug: resolved.centerSlug || slug,
          centerId: resolved.centerId ?? null,
          branding: resolved.branding ?? null,
          isResolved: true,
        });
      })
      .catch((error) => {
        console.error("Failed to resolve center branding", error);
        setTenantState({
          apiKey: defaultApiKey,
          centerSlug: null,
          centerId: null,
          branding: null,
          isResolved: true,
        });
      });
  }, []);

  return <>{children}</>;
}
