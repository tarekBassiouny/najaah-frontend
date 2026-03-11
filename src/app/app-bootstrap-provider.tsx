"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { resolveCenter } from "@/services/resolve.service";
import { defaultApiKey } from "@/lib/runtime-config";
import { setTenantState } from "@/lib/tenant-store";
import { getCenterSlugFromHost, resolveHostTenant } from "@/lib/host-routing";

const PUBLIC_MARKETING_ROUTE_PREFIXES = [
  "/",
  "/ar",
  "/resources",
  "/white-label-lms",
  "/multi-tenant-lms",
  "/lms-for-educational-centers",
  "/ai-quiz-generator-for-schools",
  "/drm-video-learning-platform",
  "/secure-pdf-learning-platform",
  "/online-exam-platform-for-schools",
  "/arabic-rtl-lms",
  "/white-label-elearning-platform",
  "/student-progress-tracking-software",
] as const;
const LOADING_CENTER_SETTINGS_TEXT = "Loading center settings...";

function isPublicMarketingPath(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_MARKETING_ROUTE_PREFIXES.some((prefix) =>
    prefix === "/"
      ? false
      : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function shouldSkipBootstrap(pathname: string) {
  if (typeof window === "undefined") {
    return false;
  }

  if (!isPublicMarketingPath(pathname)) {
    return false;
  }

  const tenant = resolveHostTenant(window.location.host);
  return tenant.kind === "apex";
}

export function AppBootstrapProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const didRun = useRef(false);
  const isPublicMarketingRoute = shouldSkipBootstrap(pathname);
  const [isBootstrapping, setIsBootstrapping] = useState(
    !isPublicMarketingRoute,
  );

  useEffect(() => {
    if (isPublicMarketingRoute) {
      setIsBootstrapping(false);
      return;
    }

    if (didRun.current) return;
    didRun.current = true;

    const bootstrap = async () => {
      const slug = getCenterSlugFromHost(window.location.host);

      if (!slug) {
        document.documentElement.style.removeProperty("--brand-primary");
        setTenantState({
          apiKey: defaultApiKey,
          centerSlug: null,
          centerId: null,
          centerName: null,
          branding: null,
          isResolved: true,
        });
        setIsBootstrapping(false);
        return;
      }

      setTenantState({ isResolved: false });

      try {
        const resolved = await resolveCenter(slug);

        if (!resolved) {
          document.documentElement.style.removeProperty("--brand-primary");
          setTenantState({
            apiKey: defaultApiKey,
            centerSlug: null,
            centerId: null,
            centerName: null,
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
        } else {
          document.documentElement.style.removeProperty("--brand-primary");
        }

        setTenantState({
          apiKey: resolved.apiKey || defaultApiKey,
          centerSlug: resolved.centerSlug || slug,
          centerId: resolved.centerId ?? null,
          centerName: resolved.centerName ?? null,
          branding: resolved.branding ?? null,
          isResolved: true,
        });
      } catch (error) {
        console.error("Failed to resolve center branding", error);
        document.documentElement.style.removeProperty("--brand-primary");
        setTenantState({
          apiKey: defaultApiKey,
          centerSlug: null,
          centerId: null,
          centerName: null,
          branding: null,
          isResolved: true,
        });
      } finally {
        setIsBootstrapping(false);
      }
    };

    void bootstrap();
  }, [isPublicMarketingRoute]);

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-2 px-4 dark:bg-[#020d1a]">
        <p className="text-sm text-dark-6 dark:text-dark-5">
          {LOADING_CENTER_SETTINGS_TEXT}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
