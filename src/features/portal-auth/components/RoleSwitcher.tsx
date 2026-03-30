"use client";

import { useRouter } from "next/navigation";
import { usePortalAuth } from "../context/portal-auth-context";
import type { PortalRole } from "../types/portal-auth";
import { useTranslation } from "@/features/localization";

export function RoleSwitcher() {
  const { t } = useTranslation();
  const { activeRole, isDualRole, switchRole } = usePortalAuth();
  const router = useRouter();

  if (!isDualRole) return null;

  const handleSwitch = (role: PortalRole) => {
    switchRole(role);
    router.push(role === "parent" ? "/portal/parent" : "/portal/student");
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1 dark:border-dark-3">
      <button
        type="button"
        onClick={() => handleSwitch("student")}
        aria-label={t("pages.portal.a11y.switchToStudent")}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          activeRole === "student"
            ? "bg-primary text-white"
            : "text-dark-6 hover:text-dark dark:text-dark-5 dark:hover:text-white"
        }`}
      >
        {t("pages.portal.topbar.studentRole")}
      </button>
      <button
        type="button"
        onClick={() => handleSwitch("parent")}
        aria-label={t("pages.portal.a11y.switchToParent")}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          activeRole === "parent"
            ? "bg-primary text-white"
            : "text-dark-6 hover:text-dark dark:text-dark-5 dark:hover:text-white"
        }`}
      >
        {t("pages.portal.topbar.parentRole")}
      </button>
    </div>
  );
}
