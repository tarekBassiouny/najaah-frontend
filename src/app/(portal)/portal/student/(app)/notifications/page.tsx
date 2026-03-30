"use client";

import { PortalSectionHeader } from "@/features/portal/components/shared/PortalSectionHeader";
import { useStudentNotificationsContent } from "@/features/portal/hooks/use-student-portal-content";
import { useTranslation } from "@/features/localization";

export default function StudentNotificationsPage() {
  const { t } = useTranslation();
  const notifications = useStudentNotificationsContent();

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.9rem] border border-[#e0efea] bg-[linear-gradient(180deg,#f4fbf8_0%,#ffffff_100%)] p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)] md:p-7">
          <PortalSectionHeader
            eyebrow={t("pages.portal.notifications.eyebrow")}
            title={t("pages.portal.notifications.title")}
            description={t("pages.portal.notifications.description")}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { value: "04", label: t("pages.portal.nav.notifications") },
            { value: "02", label: notifications[0].time },
            { value: "01", label: notifications[2].time },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[1.6rem] border border-[#e1efeb] bg-white p-5 shadow-[0_12px_28px_rgba(148,163,184,0.08)]"
            >
              <p className="text-3xl font-semibold text-slate-900">
                {item.value}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-4">
        {notifications.map((item, index) => (
          <article
            key={`${item.title}-${item.time}`}
            className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-5 shadow-[0_14px_35px_rgba(148,163,184,0.08)]"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={
                    index === 0
                      ? "mt-1 h-3 w-3 rounded-full bg-teal-500 ring-4 ring-teal-100"
                      : index === 1
                        ? "mt-1 h-3 w-3 rounded-full bg-amber-500 ring-4 ring-amber-100"
                        : "mt-1 h-3 w-3 rounded-full bg-slate-400 ring-4 ring-slate-100"
                  }
                />
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="max-w-2xl text-sm leading-7 text-slate-500">
                    {item.body}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
                {item.time}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
