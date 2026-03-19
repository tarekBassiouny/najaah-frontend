"use client";

import darkLogo from "@/assets/logos/main.svg";
import Image from "next/image";
import Link from "next/link";
import { MenuIcon } from "./icons";
import { Notification } from "./notification";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { LocaleToggle } from "@/components/ui/locale-toggle";
import { useTranslation } from "@/features/localization";
import { cn } from "@/lib/utils";

export function Header() {
  const { openSidebar } = useSidebarContext();
  const { t, locale } = useTranslation();
  const isRtl = locale === "ar";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-white px-4 py-5 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-10">
      <div
        className={cn(
          "flex items-center gap-2 min-[375px]:gap-4",
          isRtl && "flex-row-reverse",
        )}
      >
        <button
          onClick={openSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white lg:hidden"
          aria-label={t("header.toggleSidebarAriaLabel")}
        >
          <MenuIcon />
        </button>

        <Link href="/dashboard" className="lg:hidden">
          <Image
            src="/images/logo/logo-icon.svg"
            width={32}
            height={32}
            alt={t("header.logoAlt")}
            className="dark:hidden"
          />
          <Image
            src={darkLogo}
            width={32}
            height={32}
            alt={t("header.logoAlt")}
            className="hidden dark:block"
          />
        </Link>
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-1 items-center justify-end gap-3",
          isRtl && "text-right",
        )}
      >
        <LocaleToggle />
        <ThemeToggleSwitch />
        <Notification />
        <UserInfo />
      </div>
    </header>
  );
}
