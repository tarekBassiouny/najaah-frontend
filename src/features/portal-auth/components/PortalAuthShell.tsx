"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { LocaleToggle } from "@/components/ui/locale-toggle";
import { useTranslation } from "@/features/localization";
import { cn } from "@/lib/utils";

type PortalAuthShellProps = {
  badge: string;
  title: string;
  subtitle: string;
  panelEyebrow: string;
  panelTitle: string;
  panelDescription: string;
  highlights: string[];
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function PortalAuthShell({
  badge,
  title,
  subtitle,
  panelEyebrow,
  panelTitle,
  panelDescription,
  highlights,
  children,
  footer,
  className,
}: PortalAuthShellProps) {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5fbfa] px-4 py-6 md:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.14),_transparent_42%),radial-gradient(circle_at_bottom,_rgba(245,158,11,0.12),_transparent_28%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_24px_80px_rgba(15,118,110,0.12)] backdrop-blur xl:grid xl:grid-cols-[1.05fr_0.95fr]">
        <div className="flex items-center justify-between border-b border-[#d7ece8] px-5 py-4 md:px-8 xl:order-2 xl:border-b-0 xl:border-s xl:border-[#d7ece8]">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-sm font-semibold text-teal-800"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-700 text-base font-bold text-white shadow-[0_10px_25px_rgba(15,118,110,0.28)]">
              N
            </span>
            <span className="flex flex-col">
              <span>{t("pages.portal.common.brandName")}</span>
              <span className="text-xs font-medium text-teal-600/80">
                {t("pages.portal.common.brandSurface")}
              </span>
            </span>
          </Link>

          <LocaleToggle />
        </div>

        <section className="relative flex flex-col justify-between overflow-hidden px-5 py-8 md:px-8 md:py-10 xl:order-1 xl:px-10 xl:py-12">
          <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(15,118,110,0.12),transparent)]" />
          <div className="absolute -end-16 top-20 h-40 w-40 rounded-full bg-teal-200/40 blur-3xl" />
          <div className="absolute bottom-8 start-8 h-28 w-28 rounded-full bg-amber-200/40 blur-3xl" />

          <div className="relative max-w-xl space-y-6">
            <span className="inline-flex w-fit items-center rounded-full border border-teal-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
              {panelEyebrow}
            </span>

            <div className="space-y-4">
              <h2 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
                {panelTitle}
              </h2>
              <p className="max-w-lg text-sm leading-7 text-slate-600 md:text-base">
                {panelDescription}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {highlights.map((highlight, index) => (
                <div
                  key={`${highlight}-${index}`}
                  className="rounded-[1.5rem] border border-white/80 bg-white/75 p-4 shadow-[0_14px_35px_rgba(148,163,184,0.14)]"
                >
                  <div className="mb-3 h-10 w-10 rounded-2xl bg-teal-50 text-center text-lg leading-10 text-teal-700">
                    {index + 1}
                  </div>
                  <p className="text-sm font-medium leading-6 text-slate-700">
                    {highlight}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-8 hidden rounded-[1.75rem] border border-teal-100 bg-teal-950 px-6 py-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] xl:block">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-teal-100">
                {badge}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-teal-50">
                {t("pages.portal.authShell.availability")}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <div className="text-xs text-teal-100">
                  {t("pages.portal.authShell.cards.otp.eyebrow")}
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {t("pages.portal.authShell.cards.otp.title")}
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <div className="text-xs text-teal-100">
                  {t("pages.portal.authShell.cards.locale.eyebrow")}
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {t("pages.portal.authShell.cards.locale.title")}
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <div className="text-xs text-teal-100">
                  {t("pages.portal.authShell.cards.portal.eyebrow")}
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {t("pages.portal.authShell.cards.portal.title")}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center px-5 py-8 md:px-8 md:py-10 xl:order-2 xl:px-10 xl:py-12">
          <div
            className={cn(
              "w-full rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-8",
              className,
            )}
          >
            <div className="space-y-3">
              <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                {badge}
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                {title}
              </h1>
              <p className="text-sm leading-7 text-slate-600">{subtitle}</p>
            </div>

            <div className="mt-8">{children}</div>

            {footer ? (
              <div className="mt-8 border-t border-slate-100 pt-5">
                {footer}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
