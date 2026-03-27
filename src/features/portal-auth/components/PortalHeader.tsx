"use client";

import { usePathname, useRouter } from "next/navigation";
import { usePortalAuth } from "../context/portal-auth-context";
import { usePortalLogout } from "../hooks/use-portal-logout";
import { RoleSwitcher } from "./RoleSwitcher";

function getRouteRole(pathname: string): "student" | "parent" | null {
  if (pathname.startsWith("/portal/parent")) return "parent";
  if (pathname.startsWith("/portal/student")) return "student";
  return null;
}

export function PortalHeader() {
  const pathname = usePathname();
  const { user, isAuthenticated, activeRole } = usePortalAuth();
  const logout = usePortalLogout();
  const router = useRouter();

  const routeRole = getRouteRole(pathname);

  // Hide header if not authenticated
  if (!isAuthenticated || !user) return null;

  // Hide header if user doesn't have the role for this route
  if (routeRole === "student" && !user.is_student) return null;
  if (routeRole === "parent" && !user.is_parent) return null;

  const handleLogout = () => {
    logout.mutate(activeRole, {
      onSettled: () => {
        router.replace(
          activeRole === "parent"
            ? "/portal/parent/login"
            : "/portal/student/login",
        );
      },
    });
  };

  return (
    <header className="border-b border-gray-200 bg-white dark:border-dark-3 dark:bg-gray-900">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-dark dark:text-white">
              {user.name}
            </p>
            <p className="text-xs capitalize text-dark-6 dark:text-dark-5">
              {routeRole || activeRole}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RoleSwitcher />
          <button
            type="button"
            onClick={handleLogout}
            disabled={logout.isPending}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-dark-6 transition-colors hover:bg-gray-100 hover:text-dark dark:border-dark-3 dark:text-dark-5 dark:hover:bg-dark-2 dark:hover:text-white"
          >
            {logout.isPending ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}
