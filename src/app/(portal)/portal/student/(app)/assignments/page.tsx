"use client";

import { PortalSectionHeader } from "@/features/portal/components/shared/PortalSectionHeader";
import { useStudentAssignmentsContent } from "@/features/portal/hooks/use-student-portal-content";
import { useTranslation } from "@/features/localization";

export default function StudentAssignmentsPage() {
  const { t } = useTranslation();
  const assignments = useStudentAssignmentsContent();

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.9rem] border border-[#e0efea] bg-[linear-gradient(180deg,#f4fbf8_0%,#ffffff_100%)] p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)] md:p-7">
          <PortalSectionHeader
            eyebrow={t("pages.portal.assignments.eyebrow")}
            title={t("pages.portal.assignments.title")}
            description={t("pages.portal.assignments.description")}
          />

          <div className="mt-5 flex flex-wrap gap-3">
            <span className="rounded-full bg-[#e8f6f2] px-4 py-2 text-sm font-semibold text-teal-700">
              {t("pages.portal.myCourses.tabs.inProgress")}
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-500 ring-1 ring-[#dcebe7]">
              {t("pages.portal.exams.cards.2.status")}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { value: "03", label: assignments[0].due },
            { value: "01", label: assignments[1].status },
            {
              value: "82%",
              label: t("pages.portal.profile.cards.learningPulse"),
            },
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

      <div className="grid gap-4 xl:grid-cols-3">
        {assignments.map((assignment, index) => (
          <article
            key={assignment.title}
            className="rounded-[1.8rem] border border-[#dcebe7] bg-white p-5 shadow-[0_14px_35px_rgba(148,163,184,0.08)]"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="rounded-full bg-[#f8fbfa] px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-[#e7f1ee]">
                {assignment.subtitle}
              </span>
              <span
                className={
                  index === 2
                    ? "rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                    : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                }
              >
                {assignment.due}
              </span>
            </div>

            <h3 className="mt-5 text-xl font-semibold leading-8 text-slate-900">
              {assignment.title}
            </h3>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="h-2 flex-1 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-teal-500"
                  style={{ width: `${[68, 90, 42][index]}%` }}
                />
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                {assignment.status}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
