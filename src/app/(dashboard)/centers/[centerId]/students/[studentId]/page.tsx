"use client";

import { Fragment, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMockStudentProfile } from "@/features/students/lib/mock-student-profile";
import type { MockStudentProfile } from "@/features/students/lib/mock-student-profile";

type PageProps = {
  params: Promise<{ centerId: string; studentId: string }>;
  searchParams: Promise<{ from?: string; courseId?: string }>;
};

function resolveStatusVariant(status: string) {
  if (status === "active") return "success";
  if (status === "inactive") return "secondary";
  if (status === "banned") return "error";
  return "default";
}

export default function StudentProfilePage({
  params,
  searchParams,
}: PageProps) {
  const { centerId, studentId } = use(params);
  const { from, courseId } = use(searchParams);
  const [profile, setProfile] = useState<MockStudentProfile | null>(null);
  const [expandedCourseIds, setExpandedCourseIds] = useState<string[]>([]);
  const [selectedCourseCategory, setSelectedCourseCategory] = useState<
    "all" | "active" | "completed" | "paused"
  >("all");
  const [videoSearchByCourse, setVideoSearchByCourse] = useState<
    Record<string, string>
  >({});
  const [grantTarget, setGrantTarget] = useState<{
    courseId: string;
    videoId: string;
    videoName: string;
  } | null>(null);
  const [extraViews, setExtraViews] = useState<number>(1);
  const [grantedDeltas, setGrantedDeltas] = useState<Record<string, number>>(
    {},
  );

  const canOpenFromCenter = from === "center";
  const canOpenFromCourse = from === "course" && Boolean(courseId);
  const hasAllowedEntry = canOpenFromCenter || canOpenFromCourse;

  const backHref = canOpenFromCourse
    ? `/centers/${centerId}/courses/${courseId}?panel=students`
    : `/centers/${centerId}/students`;

  useEffect(() => {
    setProfile(getMockStudentProfile(studentId, centerId));
    setExpandedCourseIds([]);
    setVideoSearchByCourse({});
    setGrantTarget(null);
    setExtraViews(1);
    setGrantedDeltas({});
  }, [studentId, centerId]);

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

  const filteredCourses = useMemo(() => {
    if (!profile) return [];
    if (selectedCourseCategory === "all") return profile.enrolledCourses;
    return profile.enrolledCourses.filter(
      (course) => course.status === selectedCourseCategory,
    );
  }, [profile, selectedCourseCategory]);

  if (!profile) return null;

  const handleGrantViews = () => {
    if (!grantTarget || extraViews < 1) return;
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        enrolledCourses: prev.enrolledCourses.map((course) => {
          if (course.id !== grantTarget.courseId) return course;
          return {
            ...course,
            videos: course.videos.map((video) =>
              video.id === grantTarget.videoId
                ? { ...video, watchLimit: video.watchLimit + extraViews }
                : video,
            ),
          };
        }),
      };
    });
    setGrantedDeltas((prev) => ({
      ...prev,
      [`${grantTarget.courseId}:${grantTarget.videoId}`]: extraViews,
    }));
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={profile.name}
        description="Mocked profile data until student profile API is ready."
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
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary font-semibold text-white">
                {profileInitials}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {profile.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profile.phone}
                </p>
              </div>
            </div>
            <Badge variant={resolveStatusVariant(profile.status)}>
              {profile.status}
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200/80 bg-white/85 p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Last Activity
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {profile.lastActivity}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200/80 bg-white/85 p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Active Device
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {profile.activeDevice}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200/80 bg-white/85 p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Total Enrollments
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {profile.totalEnrollments}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200/80 bg-white/85 p-3 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Device Changes
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {profile.deviceChangeLog.length}
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
              {profile.deviceChangeLog.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {log.deviceName}
                  </TableCell>
                  <TableCell>{log.deviceId}</TableCell>
                  <TableCell>{log.changedAt}</TableCell>
                  <TableCell>{log.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
              {filteredCourses.map((course) => {
                const isExpanded = expandedCourseIds.includes(course.id);
                const videoQuery = (
                  videoSearchByCourse[course.id] ?? ""
                ).trim();
                // Keep video search purely local over the already-loaded list.
                const visibleVideos = videoQuery
                  ? course.videos.filter((video) =>
                      video.name
                        .toLowerCase()
                        .includes(videoQuery.toLowerCase()),
                    )
                  : course.videos;
                return (
                  <Fragment key={course.id}>
                    <TableRow id={`course-row-${course.id}`}>
                      <TableCell className="font-medium">
                        {course.title}
                      </TableCell>
                      <TableCell className="capitalize">
                        <Badge
                          variant={
                            course.status === "active"
                              ? "success"
                              : course.status === "completed"
                                ? "secondary"
                                : "default"
                          }
                        >
                          {course.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-40">
                          <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Progress</span>
                            <span>{course.progress}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className="h-2 rounded-full bg-primary transition-all"
                              style={{
                                width: `${Math.min(100, Math.max(0, course.progress))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{course.enrolledAt}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setExpandedCourseIds((prev) =>
                              prev.includes(course.id)
                                ? prev.filter((id) => id !== course.id)
                                : [...prev, course.id],
                            );
                          }}
                        >
                          {isExpanded
                            ? "Hide videos"
                            : `Show videos (${course.videos.length})`}
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
                              value={videoSearchByCourse[course.id] ?? ""}
                              onChange={(event) => {
                                const value = event.target.value;
                                setVideoSearchByCourse((prev) => ({
                                  ...prev,
                                  [course.id]: value,
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
                                  <TableCell>{video.name}</TableCell>
                                  <TableCell className="text-center font-medium">
                                    <span>
                                      {video.watchCount}/{video.watchLimit}
                                    </span>
                                    {grantedDeltas[
                                      `${course.id}:${video.id}`
                                    ] ? (
                                      <span className="ml-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                        +
                                        {
                                          grantedDeltas[
                                            `${course.id}:${video.id}`
                                          ]
                                        }{" "}
                                        views
                                      </span>
                                    ) : null}
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
                                            courseId: course.id,
                                            videoId: video.id,
                                            videoName: video.name,
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
              {filteredCourses.length === 0 ? (
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grant Extra Views</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Add extra views for{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {grantTarget?.videoName}
              </span>
              .
            </p>
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
