"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCenter } from "@/features/centers/hooks/use-centers";
import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { getAdminScope } from "@/lib/user-scope";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

/* ------------------------------------------------------------------ */
/*  Inline SVG icons – kept minimal, no external dep required          */
/* ------------------------------------------------------------------ */

function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
      />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 6h.008v.008H6V6z"
      />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
      />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Navigation card config                                             */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  {
    title: "Courses",
    description: "Create, edit, and manage courses available at this center.",
    href: (id: string) => `/centers/${id}/courses`,
    icon: BookIcon,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-100 dark:border-blue-900/50",
  },
  {
    title: "Videos",
    description: "Upload and organize the center's video content library.",
    href: (id: string) => `/centers/${id}/videos`,
    icon: PlayIcon,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-100 dark:border-violet-900/50",
  },
  {
    title: "PDFs",
    description: "Manage PDF documents and downloadable materials.",
    href: (id: string) => `/centers/${id}/pdfs`,
    icon: DocumentIcon,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-100 dark:border-rose-900/50",
  },
  {
    title: "Students",
    description: "View enrollments and manage the student roster.",
    href: (id: string) => `/centers/${id}/students`,
    icon: UsersIcon,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-100 dark:border-amber-900/50",
  },
  {
    title: "Categories",
    description: "Organise courses into categories for easy discovery.",
    href: (id: string) => `/centers/${id}/categories`,
    icon: TagIcon,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-100 dark:border-emerald-900/50",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CenterDetailPage({ params }: PageProps) {
  const { centerId } = use(params);
  const { data: center, isLoading } = useCenter(centerId);
  const { data: currentAdmin } = useAdminMe();
  const userScope = getAdminScope(currentAdmin);

  // Build breadcrumbs based on user scope
  const breadcrumbs = useMemo(() => {
    const crumbs = [];
    // Only show "Centers" link for system admins
    if (userScope.isSystemAdmin) {
      crumbs.push({ label: "Centers", href: "/centers" });
    }
    crumbs.push({ label: center?.name ?? `Center ${centerId}` });
    return crumbs;
  }, [userScope.isSystemAdmin, center?.name, centerId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-4 w-40" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>

        {/* Info card skeleton */}
        <Skeleton className="h-28 w-full rounded-xl" />

        {/* Grid skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const centerStatusNumber = Number(center?.status);
  const statusVariant = centerStatusNumber === 1 ? "success" : "error";
  const statusLabel =
    center?.status_label ?? (centerStatusNumber === 1 ? "Active" : "Inactive");

  return (
    <div className="space-y-8">
      {/* ---- Page header ---- */}
      <PageHeader
        title={center?.name ?? `Center ${centerId}`}
        description={
          center?.slug ? `/${center.slug}` : "Center overview and management"
        }
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center gap-2">
            {/* Only show "Back to Centers" for system admins */}
            {userScope.isSystemAdmin && (
              <Link href="/centers">
                <Button variant="outline">Back to Centers</Button>
              </Link>
            )}
            <Link href={`/centers/${centerId}/settings`}>
              <Button variant="ghost" size="icon">
                <SettingsIcon className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        }
      />

      {/* ---- Center info strip ---- */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
              {(center?.name ?? "C").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {center?.name ?? `Center ${centerId}`}
              </p>
              {center?.type && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {center.type}
                </p>
              )}
            </div>
          </div>

          <div className="hidden h-8 w-px bg-gray-200 dark:bg-gray-700 sm:block" />

          {center?.status != null && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Status
              </span>
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </div>
          )}

          {center?.slug && (
            <>
              <div className="hidden h-8 w-px bg-gray-200 dark:bg-gray-700 sm:block" />
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Slug
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {center.slug}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ---- Section navigation grid ---- */}
      <div>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Manage
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.title}
                href={section.href(centerId)}
                className="group"
              >
                <Card
                  className={`h-full border transition-all duration-200 hover:shadow-md ${section.border} hover:border-gray-300 dark:hover:border-gray-600`}
                >
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${section.bg}`}
                    >
                      <Icon className={`h-5 w-5 ${section.color}`} />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base">
                        {section.title}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2 text-xs">
                        {section.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <span
                      className={`inline-flex items-center gap-1 text-sm font-medium ${section.color} transition-transform duration-200`}
                    >
                      Manage
                      <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
