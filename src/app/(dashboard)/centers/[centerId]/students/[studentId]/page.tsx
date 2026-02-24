"use client";

import { Fragment, use, useMemo, useState } from "react";
import Link from "next/link";
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

function formatActiveDevice(
  device: { model: string; device_id: string } | null,
): string {
  if (!device) return "No active device";
  return `${device.model} (${device.device_id})`;
}

function formatPhone(countryCode: string, phone: string): string {
  return `${countryCode} ${phone}`;
}

export default function StudentProfilePage({
  params,
  searchParams,
}: PageProps) {
  const { centerId, studentId } = use(params);
  const { from, courseId } = use(searchParams);

  const {
    data: profile,
    isLoading,
    isError,
  } = useStudentProfile(
    studentId,
    { centerId },
    { enabled: Boolean(studentId) && Boolean(centerId) },
  );

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

  const handleGrantViews = () => {
    if (!grantTarget || extraViews < 1) return;
    // TODO: Implement grant extra views API call
    setGrantTarget(null);
    setExtraViews(1);
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

  if (isError || !profile) {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={profile.name}
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
              {profile.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary font-semibold text-white">
                  {profileInitials}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {profile.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatPhone(profile.country_code, profile.phone)}
                </p>
              </div>
            </div>
            <Badge variant={resolveStatusVariant(profile.status_label)}>
              {profile.status_label}
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200/80 bg-white/85 p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Last Activity
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {formatDateTime(profile.last_activity_at)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200/80 bg-white/85 p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Active Device
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {formatActiveDevice(profile.active_device)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200/80 bg-white/85 p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Total Enrollments
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {profile.total_enrollments}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200/80 bg-white/85 p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Device Changes
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {profile.device_changes_count}
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
          {profile.device_change_log.length === 0 ? (
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
                {profile.device_change_log.map((log, index) => (
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
          {profile.enrollments.length === 0 ? (
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
                                {visibleVideos.map((video) => (
                                  <TableRow key={video.id}>
                                    <TableCell>{video.title}</TableCell>
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
                                          onClick={() => {
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
                                ))}
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
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[1, 3, 5].map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={extraViews === value ? "default" : "outline"}
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
              onClick={() => {
                setGrantTarget(null);
                setExtraViews(1);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleGrantViews} disabled={extraViews < 1}>
              Grant {extraViews} view{extraViews === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
