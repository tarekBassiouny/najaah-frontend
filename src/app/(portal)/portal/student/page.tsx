"use client";

import { useTranslation } from "@/features/localization";

export default function StudentHomePage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-screen-xl p-4 md:p-6">
      <h1 className="text-2xl font-bold text-dark dark:text-white">
        {t("pages.portalAuth.studentHome.title")}
      </h1>
      <p className="mt-2 text-dark-6 dark:text-dark-5">
        {t("pages.portalAuth.studentHome.description")}
      </p>
    </div>
  );
}
