"use client";

import Image from "next/image";
import { useTenant } from "@/app/tenant-provider";
import { useTranslation } from "@/features/localization";

type TenantIdentityBadgeProps = {
  className?: string;
};

export function TenantIdentityBadge({ className }: TenantIdentityBadgeProps) {
  const { centerSlug, centerName, branding } = useTenant();
  const isCenter = Boolean(centerSlug);
  const { t } = useTranslation();

  const label = isCenter ? t("common.labels.center") : t("common.labels.admin");
  const name = isCenter
    ? centerName || centerSlug || t("common.labels.center")
    : t("sidebar.najaahAdmin");
  const centerLogoUrl =
    isCenter && typeof branding?.logoUrl === "string" ? branding.logoUrl : null;

  return (
    <div
      className={`mx-auto flex w-fit items-center gap-3 rounded-xl border border-stroke bg-gray-1 px-3 py-2 dark:border-dark-3 dark:bg-dark-2 ${className ?? ""}`.trim()}
    >
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-sm font-semibold text-primary">
        {centerLogoUrl ? (
          <div
            className="h-full w-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${centerLogoUrl})` }}
            role="img"
            aria-label={t("ui.tenantIdentity.logoAriaLabel", { name })}
          />
        ) : isCenter ? (
          name.charAt(0).toUpperCase()
        ) : (
          <Image
            src="/images/logo/logo-icon.svg"
            width={20}
            height={20}
            alt={t("ui.tenantIdentity.adminLogoAlt")}
            className="brightness-0 saturate-0"
          />
        )}
      </div>

      <div className="min-w-0 text-left">
        <p className="text-xs font-medium uppercase tracking-wider text-dark-6 dark:text-dark-5">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-dark dark:text-white">
          {name}
        </p>
      </div>
    </div>
  );
}
