"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode, type SVGProps } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocaleToggle } from "@/components/ui/locale-toggle";
import { useTranslation } from "@/features/localization";
import { usePortalAuth } from "@/features/portal-auth";
import { usePortalLogout } from "@/features/portal-auth/hooks/use-portal-logout";
import { RoleSwitcher } from "@/features/portal-auth/components/RoleSwitcher";
import { cn } from "@/lib/utils";

type ParentPortalShellProps = {
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: (_props: SVGProps<SVGSVGElement>) => ReactNode;
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

function ChildrenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="9" cy="8" r="3" strokeWidth="1.8" />
      <circle cx="16.5" cy="9.5" r="2.5" strokeWidth="1.8" />
      <path
        d="M4.5 18a4.5 4.5 0 0 1 9 0"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14 18a3.5 3.5 0 0 1 6.5-1.8"
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

export function ParentPortalShell({ children }: ParentPortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { user, activeRole } = usePortalAuth();
  const logout = usePortalLogout();
  const isRtl = locale === "ar";
  const [searchQuery, setSearchQuery] = useState("");

  const navItems: NavItem[] = [
    {
      href: "/portal/parent",
      label: t("pages.portal.parent.nav.dashboard"),
      icon: DashboardIcon,
    },
    {
      href: "/portal/parent/children",
      label: t("pages.portal.parent.nav.children"),
      icon: ChildrenIcon,
    },
  ];

  const isActiveRoute = (href: string) => {
    if (href === "/portal/parent") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = () => {
    logout.mutate(activeRole, {
      onSettled: () => router.replace("/portal/parent/login"),
    });
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/portal/parent/children");
  };

  return (
    <div className="min-h-screen bg-[#f7fbfa] px-2 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-4">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1480px] overflow-hidden rounded-[2rem] border border-[#e3f0ec] bg-white shadow-[0_24px_80px_rgba(15,118,110,0.08)]">
        <aside className="hidden w-[248px] shrink-0 border-e border-[#e5f1ee] bg-[#fbfdfc] lg:flex lg:flex-col">
          <div className="border-b border-[#e5f1ee] px-5 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-teal-700 text-base font-bold text-white shadow-[0_12px_24px_rgba(15,118,110,0.22)]">
                N
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {t("pages.portal.common.brandName")}
                </p>
                <p className="text-xs font-medium text-slate-400">
                  {t("pages.portal.topbar.parentRole")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 px-4 py-5">
            <div className="rounded-[1.5rem] border border-[#e8f1ee] bg-white p-4 shadow-[0_10px_25px_rgba(148,163,184,0.08)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                  {user?.name?.charAt(0)?.toUpperCase() || "P"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user?.name || t("pages.portal.topbar.parentRole")}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t("pages.portal.parent.shell.caption")}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-[#eef5f3] pt-4">
                <RoleSwitcher />
              </div>
            </div>

            <nav className="mt-6 space-y-1.5">
              {navItems.map((item) => {
                const isActive = isActiveRoute(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-[1.1rem] px-3.5 py-3 text-sm font-medium transition-all",
                      isActive
                        ? "bg-[#e6f6f2] text-teal-800"
                        : "text-slate-500 hover:bg-white hover:text-slate-900",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-2xl border transition-colors",
                        isActive
                          ? "border-[#cdebe3] bg-white text-teal-700"
                          : "border-[#e0efea] bg-white text-slate-400 group-hover:border-[#d7eae4] group-hover:text-teal-700",
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 rounded-[1.6rem] border border-[#e6f0ed] bg-[linear-gradient(180deg,#f4fbf8_0%,#ffffff_100%)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                {t("pages.portal.parent.shell.eyebrow")}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {t("pages.portal.parent.shell.description")}
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-[#e5f1ee] bg-white px-4 py-4 md:px-6 lg:px-8">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                    {t("pages.portal.topbar.welcomeBack")}
                  </p>
                  <h1 className="text-lg font-semibold text-slate-900 md:text-xl">
                    {user?.name || t("pages.portal.topbar.parentRole")}
                  </h1>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  <LocaleToggle />
                  <Button
                    type="button"
                    variant="outline"
                    className="hidden h-9 rounded-full border-[#dfece8] px-4 text-slate-500 hover:bg-teal-50 hover:text-teal-700 sm:inline-flex"
                    onClick={handleLogout}
                    disabled={logout.isPending}
                  >
                    {logout.isPending
                      ? t("pages.portal.topbar.loggingOut")
                      : t("pages.portal.topbar.logout")}
                  </Button>
                </div>
              </div>

              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="relative max-w-xl flex-1">
                  <span
                    className={cn(
                      "pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400",
                      isRtl ? "right-4" : "left-4",
                    )}
                  >
                    <SearchIcon className="h-4 w-4" />
                  </span>
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t(
                      "pages.portal.parent.topbar.searchPlaceholder",
                    )}
                    className={cn(
                      "h-11 rounded-full border-[#dfece8] bg-[#fbfdfc] shadow-none placeholder:text-slate-400 focus-visible:ring-teal-700",
                      isRtl ? "pl-4 pr-10 text-right" : "pl-10 pr-4 text-left",
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 rounded-full bg-teal-700 px-4 text-white hover:bg-teal-800 md:px-5"
                >
                  {t("pages.portal.parent.topbar.searchCta")}
                </Button>
              </form>

              <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {navItems.map((item) => {
                  const isActive = isActiveRoute(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "border-teal-700 bg-teal-700 text-white"
                          : "border-[#d6ece8] bg-white text-slate-600",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6 lg:px-8 lg:py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
