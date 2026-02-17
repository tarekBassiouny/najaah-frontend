"use client";

import darkLogo from "@/assets/logos/main.svg";
import Image from "next/image";
import Link from "next/link";
import { MenuIcon } from "./icons";
import { Notification } from "./notification";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";
import { useSidebarContext } from "../sidebar/sidebar-context";

export function Header() {
  const { openSidebar } = useSidebarContext();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-white px-4 py-5 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-10">
      <div className="flex items-center gap-2 min-[375px]:gap-4">
        <button
          onClick={openSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white lg:hidden"
          aria-label="Toggle Sidebar"
        >
          <MenuIcon />
        </button>

        <Link href="/dashboard" className="lg:hidden">
          <Image
            src="/images/logo/logo-icon.svg"
            width={32}
            height={32}
            alt="Najaah"
            className="dark:hidden"
          />
          <Image
            src={darkLogo}
            width={32}
            height={32}
            alt="Najaah"
            className="hidden dark:block"
          />
        </Link>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
        <ThemeToggleSwitch />
        <Notification />
        <UserInfo />
      </div>
    </header>
  );
}
