"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode, type SVGProps } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocaleToggle } from "@/components/ui/locale-toggle";
import { useTranslation } from "@/features/localization";
import { cn } from "@/lib/utils";
import { usePortalAuth } from "@/features/portal-auth";
import { usePortalLogout } from "@/features/portal-auth/hooks/use-portal-logout";
import { RoleSwitcher } from "@/features/portal-auth/components/RoleSwitcher";

type StudentPortalShellProps = {
  children: ReactNode;
};

type NavItem = {
  href?: string;
  label: string;
  ariaLabel?: string;
  icon: (_props: SVGProps<SVGSVGElement>) => ReactNode;
  disabled?: boolean;
};

function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5v4A1.5 1.5 0 0 1 9.5 11h-4A1.5 1.5 0 0 1 4 9.5v-4Z"
        strokeWidth="1.8"
      />
      <path
        d="M13 5.5A1.5 1.5 0 0 1 14.5 4h4A1.5 1.5 0 0 1 20 5.5v7A1.5 1.5 0 0 1 18.5 14h-4a1.5 1.5 0 0 1-1.5-1.5v-7Z"
        strokeWidth="1.8"
      />
      <path
        d="M4 15.5A1.5 1.5 0 0 1 5.5 14h4A1.5 1.5 0 0 1 11 15.5v4A1.5 1.5 0 0 1 9.5 21h-4A1.5 1.5 0 0 1 4 19.5v-4Z"
        strokeWidth="1.8"
      />
      <path
        d="M13 17.5A1.5 1.5 0 0 1 14.5 16h4A1.5 1.5 0 0 1 20 17.5v2A1.5 1.5 0 0 1 18.5 21h-4a1.5 1.5 0 0 1-1.5-1.5v-2Z"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function BookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        d="M6.75 4.5h9a2.25 2.25 0 0 1 2.25 2.25v11.5a.75.75 0 0 1-1.17.622A4.47 4.47 0 0 0 14.5 18h-7a2.5 2.5 0 0 0 0 5h10"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 4.5A2.5 2.5 0 0 0 4 7v13.5"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClipboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        d="M9 4.75h6a1.75 1.75 0 0 1 1.75 1.75V7H18a2 2 0 0 1 2 2v9.25A1.75 1.75 0 0 1 18.25 20h-12.5A1.75 1.75 0 0 1 4 18.25V9a2 2 0 0 1 2-2h1.25v-.5A1.75 1.75 0 0 1 9 4.75Z"
        strokeWidth="1.8"
      />
      <path d="M9 4h6v3H9z" strokeWidth="1.8" />
      <path d="M8 11h8M8 15h5" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MedalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        d="M8 3h3l1 3 1-3h3l-2.5 6h-3L8 3Z"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="15.5" r="4.5" strokeWidth="1.8" />
      <path
        d="m10.5 15.5 1 1 2-2"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CompassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="8" strokeWidth="1.8" />
      <path
        d="m10 14 1.5-4.5L16 8l-1.5 4.5L10 14Z"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        d="M6 16.5h12c-.9-1.1-1.5-2.5-1.5-4V10a4.5 4.5 0 1 0-9 0v2.5c0 1.5-.6 2.9-1.5 4Z"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 18.5a2 2 0 0 0 4 0"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="11" cy="11" r="6" strokeWidth="1.8" />
      <path d="m16 16 4 4" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SparklesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m18.5 14 0.8 2.2 2.2 0.8-2.2 0.8-0.8 2.2-0.8-2.2-2.2-0.8 2.2-0.8 0.8-2.2Z"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m5 15 0.6 1.6 1.6 0.6-1.6 0.6L5 19.4l-0.6-1.6-1.6-0.6 1.6-0.6L5 15Z"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StudentPortalShell({ children }: StudentPortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useTranslation();
  const { user } = usePortalAuth();
  const logout = usePortalLogout();
  const isRtl = locale === "ar";
  const currentQuery = searchParams.get("q") ?? "";
  const [searchQuery, setSearchQuery] = useState(currentQuery);

  useEffect(() => {
    setSearchQuery(currentQuery);
  }, [currentQuery]);

  const navItems: NavItem[] = [
    {
      href: "/portal/student",
      label: t("pages.portal.nav.dashboard"),
      icon: DashboardIcon,
    },
    {
      href: "/portal/student/my-courses",
      label: t("pages.portal.nav.myCourses"),
      icon: BookIcon,
    },
    {
      href: "/portal/student/explore",
      label: t("pages.portal.nav.explore"),
      icon: CompassIcon,
    },
    {
      href: "/portal/student/assignments",
      label: t("pages.portal.nav.assignments"),
      icon: ClipboardIcon,
    },
    {
      href: "/portal/student/exams",
      label: t("pages.portal.nav.examsAndQuizzes"),
      icon: MedalIcon,
    },
    {
      label: t("pages.portal.nav.aiTutor"),
      ariaLabel: t("pages.portal.a11y.openAiTutor"),
      icon: SparklesIcon,
      disabled: true,
    },
  ];

  const isActiveRoute = (href: string) => {
    if (!href) return false;
    if (href === "/portal/student") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = () => {
    logout.mutate("student", {
      onSettled: () => {
        router.replace("/portal/student/login");
      },
    });
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchQuery.trim();
    router.push(
      query.length > 0
        ? `/portal/student/explore?q=${encodeURIComponent(query)}`
        : "/portal/student/explore",
    );
  };

  return (
    <div className="min-h-screen bg-[#f7fbfa] px-2 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-4">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1480px] overflow-hidden rounded-[2rem] border border-[#e3f0ec] bg-white shadow-[0_24px_80px_rgba(15,118,110,0.08)]">
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-[#e5f1ee] bg-white px-4 py-4 md:px-6 lg:px-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Link
                    href="/portal/student/profile"
                    aria-label={t("pages.portal.a11y.openProfile")}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f6f2] text-sm font-semibold text-teal-700 ring-1 ring-[#d5ece5] transition-colors hover:bg-[#dcf1eb]"
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || "S"}
                  </Link>
                  <RoleSwitcher />
                </div>

                <form
                  onSubmit={handleSearchSubmit}
                  className="order-last w-full md:order-none md:max-w-[34rem] md:flex-1"
                >
                  <label className="sr-only" htmlFor="portal-search">
                    {t("pages.portal.a11y.searchPortal")}
                  </label>
                  <div className="relative">
                    <span
                      className={cn(
                        "pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400",
                        isRtl ? "right-4" : "left-4",
                      )}
                    >
                      <SearchIcon className="h-4 w-4" />
                    </span>
                    <Input
                      id="portal-search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder={t("pages.portal.topbar.searchPlaceholder")}
                      className={cn(
                        "h-12 rounded-full border-[#dfece8] bg-[#fbfdfc] shadow-none placeholder:text-slate-400 focus-visible:ring-teal-700",
                        isRtl ? "pl-4 pr-11 text-right" : "pl-11 pr-4 text-left",
                      )}
                    />
                  </div>
                </form>

                <div className="flex items-center gap-2 md:gap-3">
                  <button
                    type="button"
                    aria-label={t("pages.portal.a11y.openAiTutor")}
                    disabled
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dfece8] bg-white text-slate-400"
                  >
                    <SparklesIcon className="h-4.5 w-4.5" />
                  </button>
                  <Link
                    href="/portal/student/notifications"
                    aria-label={t("pages.portal.a11y.openNotifications")}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dfece8] bg-white text-slate-500 transition-colors hover:bg-teal-50 hover:text-teal-700"
                  >
                    <BellIcon className="h-4.5 w-4.5" />
                  </Link>
                  <LocaleToggle />
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {navItems.map((item) => {
                  const isActive = item.href ? isActiveRoute(item.href) : false;
                  const Icon = item.icon;
                  const chipClassName = cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "border-teal-700 bg-teal-700 text-white"
                      : "border-[#d6ece8] bg-white text-slate-600",
                    item.disabled && "border-dashed text-slate-400",
                  );

                  if (item.href && !item.disabled) {
                    return (
                      <Link
                        key={item.href ?? item.label}
                        href={item.href}
                        className={chipClassName}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={item.href ?? item.label}
                      type="button"
                      disabled
                      aria-label={item.ariaLabel ?? item.label}
                      className={chipClassName}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden bg-[linear-gradient(180deg,#f9fcfb_0%,#ffffff_18rem)] px-4 py-5 md:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>

        <aside
          className={cn(
            "hidden w-[280px] shrink-0 bg-[#fbfdfc] lg:order-first lg:flex lg:flex-col",
            isRtl
              ? "border-l border-[#e5f1ee]"
              : "border-r border-[#e5f1ee]",
          )}
        >
          <div className="border-b border-[#e5f1ee] px-6 py-7">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-teal-700 text-base font-bold text-white shadow-[0_12px_24px_rgba(15,118,110,0.22)]">
                N
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold tracking-tight text-slate-900">
                  {t("pages.portal.common.brandName")}
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {t("pages.portal.common.brandTagline")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col px-4 py-6">
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = item.href ? isActiveRoute(item.href) : false;
                const Icon = item.icon;
                const navClassName = cn(
                  "group flex items-center justify-between gap-3 rounded-[1.1rem] px-4 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-[#e6f6f2] text-teal-800"
                    : "text-slate-500 hover:bg-white hover:text-slate-900",
                  item.disabled && "text-slate-400 hover:bg-[#fbfdfc] hover:text-slate-400",
                );
                const content = (
                  <>
                    <span className="flex min-w-0 items-center gap-3">
                      <span>{item.label}</span>
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                          isActive
                            ? "border-[#cdebe3] bg-white text-teal-700"
                            : "border-[#e0efea] bg-white text-slate-400 group-hover:border-[#d7eae4] group-hover:text-teal-700",
                          item.disabled &&
                            "border-dashed border-[#e0efea] text-slate-400 group-hover:border-[#e0efea] group-hover:text-slate-400",
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                    </span>
                    <span
                      className={cn(
                        "h-8 w-[4px] rounded-full bg-transparent transition-colors",
                        isActive && "bg-teal-600",
                      )}
                    />
                  </>
                );

                if (item.href && !item.disabled) {
                  return (
                    <Link
                      key={item.href ?? item.label}
                      href={item.href}
                      className={navClassName}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.href ?? item.label}
                    type="button"
                    disabled
                    aria-label={item.ariaLabel ?? item.label}
                    className={navClassName}
                  >
                    {content}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto space-y-4 rounded-[1.6rem] border border-[#dcebe7] bg-white p-4 shadow-[0_10px_25px_rgba(148,163,184,0.08)]">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                  {t("pages.portal.sidebar.upgradePro")}
                </p>
                <p className="text-sm leading-6 text-slate-500">
                  {t("pages.portal.sidebar.upgradeHint")}
                </p>
              </div>
              <Button
                type="button"
                className="h-11 w-full rounded-full bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
                disabled
              >
                {t("pages.portal.nav.aiTutor")}
              </Button>
            </div>

            <button
              type="button"
              className="mt-4 inline-flex items-center justify-center rounded-full border border-[#dfece8] px-4 py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-teal-50 hover:text-teal-700"
              onClick={handleLogout}
              disabled={logout.isPending}
            >
              {logout.isPending
                ? t("pages.portal.topbar.loggingOut")
                : t("pages.portal.topbar.logout")}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
