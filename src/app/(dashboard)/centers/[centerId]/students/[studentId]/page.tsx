"use client";

import { Fragment, use, useMemo, useState } from "react";
import Link from "next/link";
import { useModal } from "@/components/ui/modal-store";
import { AppNotFoundState } from "@/components/ui/app-not-found-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStudentProfile } from "@/features/students/hooks/use-students";
import { useGrantExtraViewsToStudent } from "@/features/extra-view-requests/hooks/use-extra-view-requests";
import { PlaybackSessionsModal } from "@/features/playback-sessions/components/PlaybackSessionsModal";
import { GenerateVideoAccessCodeDialog } from "@/features/video-access/components/GenerateVideoAccessCodeDialog";
import { useTranslation } from "@/features/localization";
import { isAdminApiNotFoundError } from "@/lib/admin-response";
import { getStudentRequestApiErrorMessage } from "@/features/student-requests/lib/api-error";
import { can } from "@/lib/capabilities";
import { getEducationName } from "@/features/education/types/education";

type PageProps = {
  params: Promise<{ centerId: string; studentId: string }>;
  searchParams: Promise<{ from?: string; courseId?: string }>;
};

function resolveStatusVariant(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "active") return "success";
  if (normalized === "inactive") return "secondary";
  if (normalized === "banned") return "error";
  return "default";
}

function formatDateTime(isoString: string | null, locale: string): string {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString);
    return date.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

type ProfileDevice = {
  device_name?: string | null;
  device_type?: string | null;
  model?: string | null;
  device_id?: string | null;
  os_version?: string | null;
  status_label?: string | null;
  status_key?: string | null;
  approved_at?: string | null;
  last_used_at?: string | null;
} | null;

function formatActiveDevice(
  device: ProfileDevice,
  labels: { noActive: string; fallbackActive: string },
): string {
  if (!device) return labels.noActive;

  const name = device.device_name?.trim() || device.model?.trim() || null;
  const type = device.device_type?.trim() || null;
  const deviceId = device.device_id?.trim() || null;

  return (
    [name, type, deviceId].filter(Boolean).join(" • ") || labels.fallbackActive
  );
}

function formatActiveDeviceMeta(
  device: ProfileDevice,
  locale: string,
  lastUsedLabel: string,
  approvedAtLabel?: string,
): string {
  if (!device) return "";

  const osVersion = device.os_version?.trim() || null;
  const status =
    device.status_label?.trim() || device.status_key?.trim() || null;
  const lastUsed = device.last_used_at
    ? `${lastUsedLabel}: ${formatDateTime(device.last_used_at, locale)}`
    : null;
  const approvedAt =
    approvedAtLabel && device.approved_at
      ? `${approvedAtLabel}: ${formatDateTime(device.approved_at, locale)}`
      : null;

  return [osVersion, status, lastUsed, approvedAt].filter(Boolean).join(" • ");
}

function formatPhone(countryCode: string, phone: string): string {
  return `${countryCode} ${phone}`;
}

function resolveVideoDurationSeconds(video: {
  duration_seconds?: number | null;
  duration?: number | string | null;
}) {
  if (typeof video.duration_seconds === "number") {
    return video.duration_seconds;
  }

  if (typeof video.duration === "number") {
    return video.duration;
  }

  if (typeof video.duration === "string" && video.duration.trim()) {
    const trimmed = video.duration.trim();
    const numericValue = Number(trimmed);
    if (!Number.isNaN(numericValue)) {
      return numericValue;
    }

    if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(trimmed)) {
      const parts = trimmed.split(":").map(Number);
      if (parts.some((part) => Number.isNaN(part))) {
        return null;
      }

      if (parts.length === 2) {
        const [minutes, seconds] = parts;
        return minutes * 60 + seconds;
      }

      const [hours, minutes, seconds] = parts;
      return hours * 3600 + minutes * 60 + seconds;
    }

    return Number.isNaN(numericValue) ? null : numericValue;
  }

  return null;
}

function formatDuration(seconds: number | null) {
  if (seconds == null || seconds < 0) return null;

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function StudentProfilePage({
  params,
  searchParams,
}: PageProps) {
  const { t, locale } = useTranslation();
  const { centerId, studentId } = use(params);
  const { from, courseId } = use(searchParams);
  const { showToast } = useModal();

  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useStudentProfile(
    studentId,
    { centerId },
    { enabled: Boolean(studentId) && Boolean(centerId) },
  );
  const grantExtraViewsMutation = useGrantExtraViewsToStudent();
  const canGenerateVideoCode = can("manage_video_access");

  const [expandedCourseIds, setExpandedCourseIds] = useState<number[]>([]);
  const [selectedCourseCategory, setSelectedCourseCategory] = useState<
    "all" | "active" | "completed" | "paused"
  >("all");
  const [videoSearchByCourse, setVideoSearchByCourse] = useState<
    Record<number, string>
  >({});
  const [grantTarget, setGrantTarget] = useState<{
    courseId: number;
    videoId: number;
    videoName: string;
  } | null>(null);
  const [extraViews, setExtraViews] = useState<number>(1);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [playbackModalTarget, setPlaybackModalTarget] = useState<{
    courseId: number;
    videoId: number;
    courseTitle: string;
    videoTitle: string;
  } | null>(null);
  const [generateCodeTarget, setGenerateCodeTarget] = useState<{
    courseId: number;
    courseTitle: string;
    videoId: number;
    videoTitle: string;
  } | null>(null);

  const openPlaybackSessions = (
    courseId: number,
    courseTitle: string,
    videoId: number,
    videoTitle: string,
  ) => {
    setPlaybackModalTarget({
      courseId,
      videoId,
      courseTitle,
      videoTitle,
    });
  };

  const closePlaybackSessions = () => setPlaybackModalTarget(null);

  const canOpenFromCenter = from === "center";
  const canOpenFromCourse = from === "course" && Boolean(courseId);
  const hasAllowedEntry = canOpenFromCenter || canOpenFromCourse;

  const backHref = canOpenFromCourse
    ? `/centers/${centerId}/courses/${courseId}?panel=students`
    : `/centers/${centerId}/students`;

  const profileInitials = useMemo(() => {
    const value =
      profile?.name ?? t("pages.centerStudentProfile.defaults.student");
    return value
      .split(" ")
      .map((part) => part.trim().charAt(0))
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [profile?.name, t]);

  const filteredEnrollments = useMemo(() => {
    if (!profile?.enrollments) return [];
    if (selectedCourseCategory === "all") return profile.enrollments;
    return profile.enrollments.filter((enrollment) => {
      const statusStr = String(enrollment.status).toLowerCase();
      const statusLabel = enrollment.status_label?.toLowerCase() ?? "";
      return (
        statusStr === selectedCourseCategory ||
        statusLabel === selectedCourseCategory
      );
    });
  }, [profile?.enrollments, selectedCourseCategory]);
  const activeDevice = profile?.device ?? profile?.active_device ?? null;
  const activeDeviceMeta = formatActiveDeviceMeta(
    activeDevice,
    locale,
    t("pages.centerStudentProfile.device.lastUsedLabel"),
    t("pages.centerStudentProfile.device.approvedAt"),
  );

  const handleGrantViews = async () => {
    if (!grantTarget || extraViews < 1) return;

    setGrantError(null);

    try {
      await grantExtraViewsMutation.mutateAsync({
        studentId,
        centerId,
        payload: {
          course_id: grantTarget.courseId,
          video_id: grantTarget.videoId,
          granted_views: extraViews,
        },
      });

      showToast(
        t("pages.centerStudentProfile.messages.grantSuccess", {
          count: extraViews,
          plural: extraViews === 1 ? "" : "s",
          name: grantTarget.videoName,
        }),
        "success",
      );
      setGrantTarget(null);
      setExtraViews(1);
    } catch (error) {
      const message = getStudentRequestApiErrorMessage(
        error,
        t("pages.centerStudentProfile.messages.grantFailedFallback"),
      );
      setGrantError(message);
      showToast(message, "error");
    }
  };

  if (!hasAllowedEntry) {
    return (
      <Card>
        <CardContent className="space-y-4 py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("pages.centerStudentProfile.entry.directAccessHint")}
          </p>
          <Link href={`/centers/${centerId}/students`}>
            <Button>
              {t("pages.centerStudentProfile.entry.backToCenterStudents")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={<Skeleton className="h-8 w-48" />}
          breadcrumbs={[
            {
              label: t("pages.centerStudentProfile.breadcrumbs.centers"),
              href: "/centers",
            },
            {
              label: t("pages.centerStudentProfile.breadcrumbs.centerById", {
                id: centerId,
              }),
              href: `/centers/${centerId}`,
            },
            {
              label: t("pages.centerStudentProfile.breadcrumbs.students"),
              href: `/centers/${centerId}/students`,
            },
            { label: t("pages.centerStudentProfile.breadcrumbs.profile") },
          ]}
        />
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isMissingProfile = !isLoading && !isError && !profile;

  if (isMissingProfile || isAdminApiNotFoundError(error)) {
    return (
      <AppNotFoundState
        scopeLabel={t("pages.studentsPage.title")}
        title={t("pages.centerStudentProfile.notFoundTitle")}
        description={t("pages.centerStudentProfile.notFoundDescription")}
        primaryAction={{
          href: `/centers/${centerId}/students`,
          label: t("pages.centerStudentProfile.goToStudents"),
        }}
      />
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="space-y-4 py-8 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">
            {t("pages.centerStudentProfile.loadFailed")}
          </p>
          <Link href={`/centers/${centerId}/students`}>
            <Button variant="outline">
              {t("pages.centerStudentProfile.backToStudents")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const studentProfile = profile!;
  const resolvedGrade =
    studentProfile.grade ?? studentProfile.education?.grade ?? null;
  const resolvedSchool =
    studentProfile.school ?? studentProfile.education?.school ?? null;
  const resolvedCollege =
    studentProfile.college ?? studentProfile.education?.college ?? null;
  const gradeLabel = resolvedGrade
    ? getEducationName(
        resolvedGrade,
        t("pages.centerStudentProfile.education.grade"),
      )
    : "—";
  const schoolLabel = resolvedSchool
    ? getEducationName(
        resolvedSchool,
        t("pages.centerStudentProfile.education.school"),
      )
    : "—";
  const collegeLabel = resolvedCollege
    ? getEducationName(
        resolvedCollege,
        t("pages.centerStudentProfile.education.college"),
      )
    : "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title={studentProfile.name}
        breadcrumbs={[
          {
            label: t("pages.centerStudentProfile.breadcrumbs.centers"),
            href: "/centers",
          },
          {
            label: t("pages.centerStudentProfile.breadcrumbs.centerById", {
              id: centerId,
            }),
            href: `/centers/${centerId}`,
          },
          {
            label: t("pages.centerStudentProfile.breadcrumbs.students"),
            href: `/centers/${centerId}/students`,
          },
          { label: t("pages.centerStudentProfile.breadcrumbs.profile") },
        ]}
        actions={
          <Link href={backHref}>
            <Button variant="outline">{t("common.actions.back")}</Button>
          </Link>
        }
      />

      <Card className="overflow-hidden border-primary/20">
        <CardContent className="space-y-5 bg-gradient-to-br from-primary/10 via-transparent to-transparent p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {studentProfile.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={studentProfile.avatar_url}
                  alt={studentProfile.name}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary font-semibold text-white">
                  {profileInitials}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {studentProfile.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatPhone(
                    studentProfile.country_code,
                    studentProfile.phone,
                  )}
                </p>
                {studentProfile.email ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {studentProfile.email}
                  </p>
                ) : null}
                {studentProfile.username ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    @{studentProfile.username}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {studentProfile.center ? (
                <Badge variant="secondary">{studentProfile.center.name}</Badge>
              ) : null}
              <Badge
                variant={resolveStatusVariant(studentProfile.status_label)}
              >
                {studentProfile.status_label}
              </Badge>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200/80 bg-white/85 p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("pages.centerStudentProfile.summary.lastActivity")}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {formatDateTime(studentProfile.last_activity_at, locale)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200/80 bg-white/85 p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("pages.centerStudentProfile.summary.activeDevice")}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {formatActiveDevice(activeDevice, {
                  noActive: t("pages.centerStudentProfile.device.noActive"),
                  fallbackActive: t(
                    "pages.centerStudentProfile.device.fallbackActive",
                  ),
                })}
              </p>
              {activeDeviceMeta ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {activeDeviceMeta}
                </p>
              ) : null}
            </div>
            <div className="rounded-lg border border-gray-200/80 bg-white/85 p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("pages.centerStudentProfile.summary.totalEnrollments")}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {studentProfile.total_enrollments}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200/80 bg-white/85 p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("pages.centerStudentProfile.summary.deviceChanges")}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {studentProfile.device_changes_count}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t("pages.centerStudentProfile.education.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200/80 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("pages.centerStudentProfile.education.grade")}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {gradeLabel}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200/80 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("pages.centerStudentProfile.education.school")}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {schoolLabel}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200/80 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("pages.centerStudentProfile.education.college")}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {collegeLabel}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t("pages.centerStudentProfile.deviceLog.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {studentProfile.device_change_log.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("pages.centerStudentProfile.deviceLog.empty")}
            </p>
          ) : (
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t("pages.centerStudentProfile.deviceLog.headers.device")}
                  </TableHead>
                  <TableHead>
                    {t("pages.centerStudentProfile.deviceLog.headers.deviceId")}
                  </TableHead>
                  <TableHead>
                    {t(
                      "pages.centerStudentProfile.deviceLog.headers.changedAt",
                    )}
                  </TableHead>
                  <TableHead>
                    {t("pages.centerStudentProfile.deviceLog.headers.reason")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentProfile.device_change_log.map((log, index) => (
                  <TableRow key={`${log.device_id}-${index}`}>
                    <TableCell className="font-medium">
                      {log.device_name}
                    </TableCell>
                    <TableCell>{log.device_id}</TableCell>
                    <TableCell>
                      {formatDateTime(log.changed_at, locale)}
                    </TableCell>
                    <TableCell>{log.reason ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t("pages.centerStudentProfile.enrollments.title")}
          </CardTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["all", "active", "completed", "paused"] as const).map(
              (category) => (
                <Button
                  key={category}
                  type="button"
                  variant={
                    selectedCourseCategory === category ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedCourseCategory(category)}
                >
                  {t(
                    `pages.centerStudentProfile.enrollments.categories.${category}`,
                  )}
                </Button>
              ),
            )}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {studentProfile.enrollments.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("pages.centerStudentProfile.enrollments.empty")}
            </p>
          ) : (
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t("pages.centerStudentProfile.enrollments.headers.course")}
                  </TableHead>
                  <TableHead>
                    {t("pages.centerStudentProfile.enrollments.headers.status")}
                  </TableHead>
                  <TableHead>
                    {t(
                      "pages.centerStudentProfile.enrollments.headers.progress",
                    )}
                  </TableHead>
                  <TableHead>
                    {t(
                      "pages.centerStudentProfile.enrollments.headers.enrolledAt",
                    )}
                  </TableHead>
                  <TableHead>
                    {t(
                      "pages.centerStudentProfile.enrollments.headers.expiresAt",
                    )}
                  </TableHead>
                  <TableHead className="text-right">
                    {t(
                      "pages.centerStudentProfile.enrollments.headers.content",
                    )}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((enrollment) => {
                  const isExpanded = expandedCourseIds.includes(
                    enrollment.course.id,
                  );
                  const videoQuery = (
                    videoSearchByCourse[enrollment.course.id] ?? ""
                  ).trim();
                  const visibleVideos = videoQuery
                    ? enrollment.course.videos.filter((video) =>
                        video.title
                          .toLowerCase()
                          .includes(videoQuery.toLowerCase()),
                      )
                    : enrollment.course.videos;

                  return (
                    <Fragment key={enrollment.id}>
                      <TableRow id={`course-row-${enrollment.course.id}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {enrollment.course.thumbnail_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={enrollment.course.thumbnail_url}
                                alt={t(
                                  "pages.centerStudentProfile.enrollments.courseThumbnailAlt",
                                  { title: enrollment.course.title },
                                )}
                                className="hidden h-10 w-16 rounded border border-gray-200 object-cover dark:border-gray-700 sm:block"
                              />
                            ) : null}
                            <div className="min-w-0">
                              <p className="truncate">
                                {enrollment.course.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {enrollment.course.status_label ? (
                                  <Badge
                                    variant={
                                      enrollment.course.is_published
                                        ? "success"
                                        : "secondary"
                                    }
                                    className="text-[10px]"
                                  >
                                    {enrollment.course.status_label}
                                  </Badge>
                                ) : null}
                                {enrollment.course.learning_asset_count !=
                                  null &&
                                enrollment.course.learning_asset_count > 0 ? (
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                    {t(
                                      "pages.centerStudentProfile.enrollments.learningAssets",
                                    )}
                                    : {enrollment.course.learning_asset_count}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          <Badge
                            variant={
                              String(enrollment.status) === "0" ||
                              String(enrollment.status).toLowerCase() ===
                                "active"
                                ? "success"
                                : String(enrollment.status).toLowerCase() ===
                                    "completed"
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {enrollment.status_label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="w-44 space-y-2">
                            <div>
                              <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>
                                  {t(
                                    "pages.centerStudentProfile.enrollments.progressLabel",
                                  )}
                                </span>
                                <span>{enrollment.progress_percentage}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                                <div
                                  className="h-2 rounded-full bg-primary transition-all"
                                  style={{
                                    width: `${Math.min(100, Math.max(0, enrollment.progress_percentage))}%`,
                                  }}
                                />
                              </div>
                            </div>
                            {enrollment.course.learning_assets_progress &&
                            enrollment.course.learning_assets_progress.total >
                              0 ? (
                              <div>
                                <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                  <span>
                                    {t(
                                      "pages.centerStudentProfile.enrollments.learningAssets",
                                    )}
                                  </span>
                                  <span>
                                    {t(
                                      "pages.centerStudentProfile.enrollments.learningAssetsProgress",
                                      {
                                        completed:
                                          enrollment.course
                                            .learning_assets_progress.completed,
                                        total:
                                          enrollment.course
                                            .learning_assets_progress.total,
                                      },
                                    )}
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                                  <div
                                    className="h-2 rounded-full bg-emerald-500 transition-all"
                                    style={{
                                      width: `${Math.min(100, Math.max(0, enrollment.course.learning_assets_progress.progress_percentage))}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDateTime(enrollment.enrolled_at, locale)}
                        </TableCell>
                        <TableCell>
                          {enrollment.expires_at
                            ? formatDateTime(enrollment.expires_at, locale)
                            : t(
                                "pages.centerStudentProfile.enrollments.noExpiry",
                              )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setExpandedCourseIds((prev) =>
                                prev.includes(enrollment.course.id)
                                  ? prev.filter(
                                      (id) => id !== enrollment.course.id,
                                    )
                                  : [...prev, enrollment.course.id],
                              );
                            }}
                          >
                            {isExpanded
                              ? t(
                                  "pages.centerStudentProfile.actions.hideVideos",
                                )
                              : t(
                                  "pages.centerStudentProfile.actions.showVideos",
                                  {
                                    count: enrollment.course.video_count,
                                  },
                                )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="bg-gray-50 dark:bg-gray-900/30"
                          >
                            <div className="mb-3 max-w-sm">
                              <Input
                                value={
                                  videoSearchByCourse[enrollment.course.id] ??
                                  ""
                                }
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setVideoSearchByCourse((prev) => ({
                                    ...prev,
                                    [enrollment.course.id]: value,
                                  }));
                                }}
                                placeholder={t(
                                  "pages.centerStudentProfile.enrollments.searchVideosPlaceholder",
                                )}
                              />
                            </div>
                            <Table className="min-w-[720px]">
                              <TableHeader>
                                <TableRow>
                                  <TableHead>
                                    {t(
                                      "pages.centerStudentProfile.enrollments.videoHeaders.videoName",
                                    )}
                                  </TableHead>
                                  <TableHead className="text-center">
                                    {t(
                                      "pages.centerStudentProfile.enrollments.videoHeaders.watchCountLimit",
                                    )}
                                  </TableHead>
                                  <TableHead className="text-right">
                                    {t(
                                      "pages.centerStudentProfile.enrollments.videoHeaders.actions",
                                    )}
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {visibleVideos.length === 0 ? (
                                  <TableRow>
                                    <TableCell
                                      colSpan={3}
                                      className="py-5 text-center text-sm text-gray-500 dark:text-gray-400"
                                    >
                                      {t(
                                        "pages.centerStudentProfile.enrollments.noVideosMatch",
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ) : null}
                                {visibleVideos.map((video) => {
                                  const formattedDuration = formatDuration(
                                    resolveVideoDurationSeconds(video),
                                  );

                                  return (
                                    <TableRow key={video.id}>
                                      <TableCell>
                                        <div className="flex items-center gap-3">
                                          {video.thumbnail_url ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                              src={video.thumbnail_url}
                                              alt={t(
                                                "pages.centerStudentProfile.enrollments.thumbnailAlt",
                                                { title: video.title },
                                              )}
                                              className="h-14 w-24 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                                            />
                                          ) : (
                                            <div className="flex h-14 w-24 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-[11px] font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                                              {t(
                                                "pages.centerStudentProfile.enrollments.noThumbnail",
                                              )}
                                            </div>
                                          )}
                                          <div className="min-w-0">
                                            <p className="truncate font-medium text-gray-900 dark:text-white">
                                              {video.title}
                                            </p>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                              <div className="flex flex-wrap items-center gap-1.5">
                                                <span>
                                                  {
                                                    video.watch_progress_percentage
                                                  }
                                                  {t(
                                                    "pages.centerStudentProfile.enrollments.watchedSuffix",
                                                  )}
                                                </span>
                                                {video.source_provider ? (
                                                  <Badge
                                                    variant="secondary"
                                                    className="text-[9px] capitalize"
                                                  >
                                                    {video.source_provider}
                                                  </Badge>
                                                ) : null}
                                              </div>
                                              {formattedDuration ? (
                                                <p>{formattedDuration}</p>
                                              ) : null}
                                            </div>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center font-medium">
                                        <span>
                                          {video.watch_count}/
                                          {video.watch_limit ?? "∞"}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="inline-flex items-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              openPlaybackSessions(
                                                enrollment.course.id,
                                                enrollment.course.title,
                                                video.id,
                                                video.title,
                                              )
                                            }
                                          >
                                            {t(
                                              "pages.centerStudentProfile.actions.statistics",
                                            )}
                                          </Button>
                                          <Button
                                            size="sm"
                                            disabled={
                                              grantExtraViewsMutation.isPending
                                            }
                                            onClick={() => {
                                              setGrantError(null);
                                              setGrantTarget({
                                                courseId: enrollment.course.id,
                                                videoId: video.id,
                                                videoName: video.title,
                                              });
                                              setExtraViews(1);
                                            }}
                                          >
                                            {t(
                                              "pages.centerStudentProfile.actions.grantExtraViews",
                                            )}
                                          </Button>
                                          {canGenerateVideoCode ? (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                setGenerateCodeTarget({
                                                  courseId:
                                                    enrollment.course.id,
                                                  courseTitle:
                                                    enrollment.course.title,
                                                  videoId: video.id,
                                                  videoTitle: video.title,
                                                });
                                              }}
                                            >
                                              {t(
                                                "pages.centerStudentProfile.actions.generateCode",
                                              )}
                                            </Button>
                                          ) : null}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
                {filteredEnrollments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      {t(
                        "pages.centerStudentProfile.enrollments.emptyByCategory",
                      )}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PlaybackSessionsModal
        open={Boolean(playbackModalTarget)}
        onOpenChange={(open) => {
          if (!open) {
            closePlaybackSessions();
          }
        }}
        centerId={centerId}
        courseId={playbackModalTarget?.courseId ?? 0}
        courseTitle={playbackModalTarget?.courseTitle ?? null}
        videoId={playbackModalTarget?.videoId ?? 0}
        videoTitle={playbackModalTarget?.videoTitle ?? null}
        userId={profile?.id}
      />

      <Dialog
        open={Boolean(grantTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setGrantTarget(null);
            setExtraViews(1);
            setGrantError(null);
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-md overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {t("pages.centerStudentProfile.dialog.grantExtraViewsTitle")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "pages.centerStudentProfile.dialog.grantExtraViewsDescription",
                {
                  name: grantTarget?.videoName ?? "",
                },
              )}
            </DialogDescription>
          </DialogHeader>
          {grantError ? (
            <Alert variant="destructive">
              <AlertTitle>
                {t("pages.centerStudentProfile.dialog.grantFailedTitle")}
              </AlertTitle>
              <AlertDescription>{grantError}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[1, 3, 5].map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={extraViews === value ? "default" : "outline"}
                  disabled={grantExtraViewsMutation.isPending}
                  onClick={() => setExtraViews(value)}
                >
                  +{value}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="extra-views">
                {t("pages.centerStudentProfile.dialog.customExtraViews")}
              </Label>
              <Input
                id="extra-views"
                type="number"
                min={1}
                value={extraViews}
                disabled={grantExtraViewsMutation.isPending}
                onChange={(event) => {
                  const numeric = Number(event.target.value);
                  setExtraViews(Number.isFinite(numeric) ? numeric : 1);
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={grantExtraViewsMutation.isPending}
              onClick={() => {
                setGrantTarget(null);
                setExtraViews(1);
                setGrantError(null);
              }}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button
              onClick={handleGrantViews}
              disabled={extraViews < 1 || grantExtraViewsMutation.isPending}
            >
              {grantExtraViewsMutation.isPending
                ? t("pages.centerStudentProfile.actions.granting")
                : t("pages.centerStudentProfile.actions.grantViews", {
                    count: extraViews,
                    plural: extraViews === 1 ? "" : "s",
                  })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GenerateVideoAccessCodeDialog
        open={Boolean(generateCodeTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setGenerateCodeTarget(null);
          }
        }}
        centerId={centerId}
        studentCenter={profile?.center ?? null}
        studentPreset={{
          id: profile?.id ?? studentId,
          label:
            profile?.name ?? t("pages.centerStudentProfile.defaults.student"),
        }}
        coursePreset={
          generateCodeTarget
            ? {
                id: generateCodeTarget.courseId,
                label: generateCodeTarget.courseTitle,
              }
            : null
        }
        videoPreset={
          generateCodeTarget
            ? {
                id: generateCodeTarget.videoId,
                label: generateCodeTarget.videoTitle,
              }
            : null
        }
      />
    </div>
  );
}
