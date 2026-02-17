"use client";

import { ChevronUpIcon } from "@/assets/icons";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth";
import { useAdminLogout } from "@/features/auth/hooks/use-admin-logout";
import { tokenStorage } from "@/lib/token-storage";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LogOutIcon, UserIcon } from "./icons";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleLabel(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (value && typeof value === "object") {
    const role = value as Record<string, unknown>;
    const candidates = [role.name, role.slug, role.role];
    const label = candidates.find(
      (candidate) => typeof candidate === "string" && candidate.trim(),
    );
    return typeof label === "string" ? label.trim() : null;
  }

  return null;
}

export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate: logout, isPending: isLoggingOut } = useAdminLogout({
    onSuccess: () => {
      tokenStorage.clear();
      queryClient.clear();
      router.replace("/login");
    },
    onError: () => {
      tokenStorage.clear();
      queryClient.clear();
      router.replace("/login");
    },
  });

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700" />
    );
  }

  const displayName = user.name || "User";
  const displayEmail = user.email || "";
  const displayRole =
    getRoleLabel(user.role) ?? getRoleLabel(user.roles?.[0]) ?? "Admin";
  const avatarUrl = user.avatar;

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="flex items-center gap-2 rounded-lg p-1 outline-none ring-primary ring-offset-2 transition-colors hover:bg-gray-100 focus-visible:ring-2 dark:ring-offset-gray-900 dark:hover:bg-gray-800">
        <span className="sr-only">My Account</span>

        {avatarUrl ? (
          <Image
            src={avatarUrl}
            className="h-9 w-9 rounded-full object-cover"
            alt={`Avatar of ${displayName}`}
            width={36}
            height={36}
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
            {getInitials(displayName)}
          </div>
        )}

        <ChevronUpIcon
          aria-hidden
          className={cn(
            "h-4 w-4 rotate-180 text-gray-500 transition-transform",
            isOpen && "rotate-0",
          )}
          strokeWidth={1.5}
        />
      </DropdownTrigger>

      <DropdownContent
        className="w-64 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
        align="end"
      >
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                className="h-10 w-10 rounded-full object-cover"
                alt={`Avatar for ${displayName}`}
                width={40}
                height={40}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
                {getInitials(displayName)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {displayName}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {displayEmail}
              </p>
              <p className="text-xs text-primary">{displayRole}</p>
            </div>
          </div>
        </div>

        <div className="p-1">
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <UserIcon className="h-4 w-4" />
            <span>View profile</span>
          </Link>
        </div>

        <div className="border-t border-gray-200 p-1 dark:border-gray-700">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <LogOutIcon className="h-4 w-4" />
            <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
