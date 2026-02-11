"use client";

import { useEffect, useRef, useState } from "react";
import { resolveCenter } from "@/services/resolve.service";
import { defaultApiKey } from "@/lib/runtime-config";
import { setTenantState } from "@/lib/tenant-store";
import { getCenterSlugFromHost } from "@/lib/host-routing";

export function AppBootstrapProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const didRun = useRef(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
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
  }, []);

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-2 px-4 dark:bg-[#020d1a]">
        <p className="text-sm text-dark-6 dark:text-dark-5">
          Loading center settings...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
