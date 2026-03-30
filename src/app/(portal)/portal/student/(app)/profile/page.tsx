"use client";

import { PortalSectionHeader } from "@/features/portal/components/shared/PortalSectionHeader";
import { useStudentProfileContent } from "@/features/portal/hooks/use-student-portal-content";
import { useTranslation } from "@/features/localization";

export default function StudentProfilePage() {
  const { t } = useTranslation();
  const { userName, phone, insights, stats, summaryCards, isLoading } =
    useStudentProfileContent();

  return (
    <div className="space-y-8">
      <section className="rounded-[1.9rem] border border-[#e0efea] bg-[linear-gradient(180deg,#f4fbf8_0%,#ffffff_100%)] p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)] md:p-7">
        <PortalSectionHeader
          eyebrow={t("pages.portal.profile.eyebrow")}
          title={t("pages.portal.profile.title")}
          description={t("pages.portal.profile.description")}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)]">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-xl font-semibold text-teal-700">
              {userName.charAt(0)?.toUpperCase() || "S"}
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-slate-900">
                {userName}
              </h3>
              <p className="text-sm text-slate-500">{phone}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {stats.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl bg-[#f7fbfa] px-4 py-3"
              >
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className="text-lg font-semibold text-slate-900">
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {isLoading ? (
            <p className="mt-4 text-sm text-slate-400">
              {t("pages.portal.common.loading")}
            </p>
          ) : null}
        </div>

        <div className="grid gap-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {summaryCards.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.6rem] border border-[#e1efeb] bg-white p-5 shadow-[0_12px_28px_rgba(148,163,184,0.08)]"
              >
                <p className="text-2xl font-semibold text-slate-900">
                  {item.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)]">
            <h3 className="text-lg font-semibold text-slate-900">
              {t("pages.portal.profile.cards.learningInsights")}
            </h3>
            <div className="mt-5 space-y-3">
              {insights.map((insight) => (
                <div
                  key={insight}
                  className="rounded-[1.25rem] border border-[#edf3f1] px-4 py-4 text-sm leading-7 text-slate-600"
                >
                  {insight}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
