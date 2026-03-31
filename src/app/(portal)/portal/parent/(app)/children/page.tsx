"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PortalSectionHeader } from "@/features/portal/components/shared/PortalSectionHeader";
import { useParentChildrenContent } from "@/features/portal/hooks/use-parent-portal-content";
import { useTranslation } from "@/features/localization";

export default function ParentChildrenPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const { children, pendingLinks, stats, isLoading, isEmpty } =
    useParentChildrenContent(search);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.9rem] border border-[#e0efea] bg-[linear-gradient(180deg,#f4fbf8_0%,#ffffff_100%)] p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)] md:p-7">
          <PortalSectionHeader
            eyebrow={t("pages.portal.parent.children.eyebrow")}
            title={t("pages.portal.parent.children.title")}
            description={t("pages.portal.parent.children.description")}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[1.6rem] border border-[#e1efeb] bg-white p-5 shadow-[0_12px_28px_rgba(148,163,184,0.08)]"
            >
              <p className="text-3xl font-semibold text-slate-900">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-8 text-center shadow-[0_12px_28px_rgba(148,163,184,0.08)]">
          <p className="text-lg font-semibold text-slate-900">
            {t("pages.portal.common.loading")}
          </p>
        </div>
      ) : isEmpty ? (
        <div className="rounded-[1.75rem] border border-dashed border-[#d6ece8] bg-[#f8fcfb] p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">
            {t("pages.portal.parent.dashboard.noChildrenTitle")}
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-slate-500">
            {t("pages.portal.parent.dashboard.noChildrenDescription")}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)]">
            <PortalSectionHeader
              eyebrow={t("pages.portal.parent.children.activeEyebrow")}
              title={t("pages.portal.parent.children.activeTitle")}
              description={t("pages.portal.parent.children.activeDescription")}
            />

            <div className="mt-5 space-y-3">
              {children.map((child) => (
                <Link
                  key={child.id}
                  href={`/portal/parent/children/${child.id}`}
                  className="rounded-[1.25rem] border border-[#edf3f1] px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {child.name}
                      </p>
                      <p className="text-xs text-slate-400">{child.phone}</p>
                    </div>
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                      {child.method}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-[#dcebe7] bg-white p-6 shadow-[0_14px_35px_rgba(148,163,184,0.08)]">
            <PortalSectionHeader
              eyebrow={t("pages.portal.parent.children.pendingEyebrow")}
              title={t("pages.portal.parent.children.pendingTitle")}
              description={t("pages.portal.parent.children.pendingDescription")}
            />

            <div className="mt-5 space-y-3">
              {pendingLinks.length > 0 ? (
                pendingLinks.map((link) => (
                  <div
                    key={link.id}
                    className="rounded-[1.25rem] border border-[#edf3f1] px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {link.name}
                        </p>
                        <p className="text-xs text-slate-400">{link.phone}</p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        {link.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  {t("pages.portal.parent.children.noPending")}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
