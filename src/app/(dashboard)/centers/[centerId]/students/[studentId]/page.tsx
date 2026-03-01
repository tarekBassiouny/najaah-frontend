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
import { isAdminApiNotFoundError } from "@/lib/admin-response";
import { getStudentRequestApiErrorMessage } from "@/features/student-requests/lib/api-error";

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

function formatDateTime(isoString: string | null): string {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
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
  last_used_at?: string | null;
} | null;

function formatActiveDevice(device: ProfileDevice): string {
  if (!device) return "No active device";

  const name = device.device_name?.trim() || device.model?.trim() || null;
  const type = device.device_type?.trim() || null;
  const deviceId = device.device_id?.trim() || null;

  return [name, type, deviceId].filter(Boolean).join(" • ") || "Active device";
}

function formatActiveDeviceMeta(device: ProfileDevice): string {
  if (!device) return "";

  const osVersion = device.os_version?.trim() || null;
  const status =
    device.status_label?.trim() || device.status_key?.trim() || null;
  const lastUsed = device.last_used_at
    ? `Last used: ${formatDateTime(device.last_used_at)}`
    : null;

  return [osVersion, status, lastUsed].filter(Boolean).join(" • ");
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

  const canOpenFromCenter = from === "center";
  const canOpenFromCourse = from === "course" && Boolean(courseId);
  const hasAllowedEntry = canOpenFromCenter || canOpenFromCourse;

  const backHref = canOpenFromCourse
    ? `/centers/${centerId}/courses/${courseId}?panel=students`
    : `/centers/${centerId}/students`;

  const profileInitials = useMemo(() => {
    const value = profile?.name ?? "Student";
    return value
      .split(" ")
      .map((part) => part.trim().charAt(0))
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [profile?.name]);

  const filteredEnrollments = useMemo(() => {
    if (!profile?.enrollments) return [];
    if (selectedCourseCategory === "all") return profile.enrollments;
    return profile.enrollments.filter(
      (enrollment) => enrollment.status === selectedCourseCategory,
    );
  }, [profile?.enrollments, selectedCourseCategory]);
  const activeDevice = profile?.device ?? profile?.active_device ?? null;
  const activeDeviceMeta = formatActiveDeviceMeta(activeDevice);

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
        `Granted ${extraViews} extra view${extraViews === 1 ? "" : "s"} for ${grantTarget.videoName}.`,
        "success",
      );
      setGrantTarget(null);
      setExtraViews(1);
    } catch (error) {
      const message = getStudentRequestApiErrorMessage(
        error,
        "Unable to grant extra views.",
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
            Open this student profile from Center Students or from Enrolled
            Students inside course details.
          </p>
          <Link href={`/centers/${centerId}/students`}>
            <Button>Back to Center Students</Button>
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
            { label: "Centers", href: "/centers" },
            { label: `Center ${centerId}`, href: `/centers/${centerId}` },
            { label: "Students", href: `/centers/${centerId}/students` },
            { label: "Profile" },
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
        scopeLabel="Student"
        title="Student not found"
        description="The student profile you requested does not exist or is no longer available in this center."
        primaryAction={{
          href: `/centers/${centerId}/students`,
          label: "Go to Students",
        }}
      />
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="space-y-4 py-8 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load student profile. Please try again.
          </p>
          <Link href={`/centers/${centerId}/students`}>
            <Button variant="outline">Back to Students</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const studentProfile = profile!;

  return (
    <div className="space-y-6">
      <PageHeader
        title={studentProfile.name}
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Students", href: `/centers/${centerId}/students` },
          { label: "Profile" },
        ]}
        actions={
          <Link href={backHref}>
            <Button variant="outline">Back</Button>
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
              </div>
            </div>
            <Badge variant={resolveStatusVariant(studentProfile.status_label)}>
              {studentProfile.status_label}
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200/80 bg-white/85 p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Last Activity
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {formatDateTime(studentProfile.last_activity_at)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200/80 bg-white/85 p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Active Device
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {formatActiveDevice(activeDevice)}
              </p>
              {activeDeviceMeta ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {activeDeviceMeta}
                </p>
              ) : null}
            </div>
            <div className="rounded-lg border border-gray-200/80 bg-white/85 p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Total Enrollments
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {studentProfile.total_enrollments}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200/80 bg-white/85 p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Device Changes
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
          <CardTitle className="text-base">Device Change Log</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {studentProfile.device_change_log.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No device changes recorded.
            </p>
          ) : (
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Changed At</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentProfile.device_change_log.map((log, index) => (
                  <TableRow key={`${log.device_id}-${index}`}>
                    <TableCell className="font-medium">
                      {log.device_name}
                    </TableCell>
                    <TableCell>{log.device_id}</TableCell>
                    <TableCell>{formatDateTime(log.changed_at)}</TableCell>
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
          <CardTitle className="text-base">Enrolled Courses</CardTitle>
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
                  {category === "all"
                    ? "All"
                    : category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ),
            )}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {studentProfile.enrollments.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No enrollments found.
            </p>
          ) : (
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Enrolled At</TableHead>
                  <TableHead className="text-right">Content</TableHead>
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
                          {enrollment.course.title}
                        </TableCell>
                        <TableCell className="capitalize">
                          <Badge
                            variant={
                              enrollment.status === "active"
                                ? "success"
                                : enrollment.status === "completed"
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {enrollment.status_label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="w-40">
                            <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>Progress</span>
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
                        </TableCell>
                        <TableCell>
                          {formatDateTime(enrollment.enrolled_at)}
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
                              ? "Hide videos"
                              : `Show videos (${enrollment.course.video_count})`}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
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
                                placeholder="Search videos in this course"
                              />
                            </div>
                            <Table className="min-w-[720px]">
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Video Name</TableHead>
                                  <TableHead className="text-center">
                                    Watch Count / Limit
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Actions
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
                                      No videos match your search.
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
                                              alt={`${video.title} thumbnail`}
                                              className="h-14 w-24 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                                            />
                                          ) : (
                                            <div className="flex h-14 w-24 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-[11px] font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                                              No thumbnail
                                            </div>
                                          )}
                                          <div className="min-w-0">
                                            <p className="truncate font-medium text-gray-900 dark:text-white">
                                              {video.title}
                                            </p>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                              <p>
                                                {
                                                  video.watch_progress_percentage
                                                }
                                                % watched
                                              </p>
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
                                          <Button variant="outline" size="sm">
                                            Statistics
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
                                            Grant extra views
                                          </Button>
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
                      colSpan={5}
                      className="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No courses in this category.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
            <DialogTitle>Grant Extra Views</DialogTitle>
            <DialogDescription>
              Add extra views for {grantTarget?.videoName}.
            </DialogDescription>
          </DialogHeader>
          {grantError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not grant extra views</AlertTitle>
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
              <Label htmlFor="extra-views">Custom extra views</Label>
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
              Cancel
            </Button>
            <Button
              onClick={handleGrantViews}
              disabled={extraViews < 1 || grantExtraViewsMutation.isPending}
            >
              {grantExtraViewsMutation.isPending
                ? "Granting..."
                : `Grant ${extraViews} view${extraViews === 1 ? "" : "s"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
