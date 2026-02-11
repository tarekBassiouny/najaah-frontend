import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TenantIdentityBadge } from "@/components/ui/tenant-identity-badge";
import { getCenterSlugFromHost } from "@/lib/host-routing";

export const metadata: Metadata = {
  title: "Home",
};

export default async function HomePage() {
  const requestHeaders = await headers();
  const requestHost =
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "";
  const centerSlug = getCenterSlugFromHost(requestHost);

  if (centerSlug) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-2 px-4 dark:bg-[#020d1a]">
      <div className="w-full max-w-2xl rounded-2xl border border-stroke bg-white p-8 text-center shadow-default dark:border-dark-3 dark:bg-gray-dark">
        <TenantIdentityBadge className="mb-6" />
        <h1 className="text-3xl font-semibold text-dark dark:text-white">
          Home
        </h1>
        <p className="mt-3 text-sm text-dark-6 dark:text-dark-5">
          Public entry point for the LMS platform.
        </p>
        <div className="mt-6 flex items-center justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}
