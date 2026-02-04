"use client";

import { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCenterCourse } from "@/features/courses/hooks/use-courses";
import { CoursePublishAction } from "@/features/courses/components/CoursePublishAction";
import { useCenter } from "@/features/centers/hooks/use-centers";
import { useReorderSections, useSections } from "@/features/sections/hooks/use-sections";
import type { Section } from "@/features/sections/types/section";

type PageProps = {
  params: Promise<{ centerId: string; courseId: string }>;
};

export default function CenterCourseDetailPage({ params }: PageProps) {
  const { centerId, courseId } = use(params);
  const pathname = usePathname();
  const { data: course, isLoading, isError } = useCenterCourse(centerId, courseId);
  const { data: center } = useCenter(centerId);
  const { data: sectionsData, isLoading: isLoadingSections, isError: isSectionsError } =
    useSections(centerId, courseId, { page: 1, per_page: 100 });
  const { mutate: reorderSections, isPending: isReordering } = useReorderSections();
  const [orderedSections, setOrderedSections] = useState<Section[]>([]);
  const [draggingId, setDraggingId] = useState<Section["id"] | null>(null);
  const [uploadTarget, setUploadTarget] = useState<{
    type: "video" | "pdf";
    sectionId: Section["id"];
  } | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    if (sectionsData?.items) {
      setOrderedSections(sectionsData.items);
    }
  }, [sectionsData?.items]);

  const navItems = useMemo(
    () => [
      {
        label: "Overview",
        href: `/centers/${centerId}/courses/${courseId}`,
      },
      {
        label: "Enrolled Students",
        href: `/enrollments?course_id=${courseId}`,
      },
      {
        label: "Settings",
        href: `/centers/${centerId}/courses/${courseId}/edit`,
      },
    ],
    [centerId, courseId],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full lg:max-w-[220px]">
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
          <div className="flex-1 space-y-6">
            <Card>
              <CardContent className="space-y-3 py-6">
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 py-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              This course may have been deleted or you may not have permission to view it.
            </p>
            <Link href={`/centers/${centerId}/courses`}>
              <Button>Back to Courses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusVariant =
    course.status === "published" || course.status === "active"
      ? "success"
      : course.status === "draft"
        ? "secondary"
        : "default";

  const handleDragStart = (sectionId: Section["id"]) => {
    setDraggingId(sectionId);
  };

  const handleDrop = (targetId: Section["id"]) => {
    if (draggingId == null || draggingId === targetId) {
      setDraggingId(null);
      return;
    }

    const fromIndex = orderedSections.findIndex((section) => section.id === draggingId);
    const toIndex = orderedSections.findIndex((section) => section.id === targetId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggingId(null);
      return;
    }

    const next = [...orderedSections];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setOrderedSections(next);
    setDraggingId(null);

    reorderSections(
      {
        centerId,
        courseId,
        payload: { ordered_ids: next.map((section) => section.id) },
      },
      {
        onError: () => {
          setOrderedSections(sectionsData?.items ?? next);
        },
      },
    );
  };

  const getSectionCount = (section: Section, key: "videos" | "pdfs") => {
    const countKey = `${key}_count` as keyof Section;
    if (typeof section[countKey] === "number") {
      return section[countKey] as number;
    }
    return Array.isArray(section[key]) ? section[key]?.length ?? 0 : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full lg:max-w-[220px]">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Course Management
            </p>
            <h2 className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
              {course.title ?? course.name ?? `Course #${course.id}`}
            </h2>
            <nav className="mt-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex-1 space-y-6">
          <Card>
            <CardContent className="space-y-4 py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {course.title ?? course.name ?? `Course #${course.id}`}
                    </h1>
                    {course.status && (
                      <Badge variant={statusVariant} className="text-[11px] uppercase">
                        {course.status}
                      </Badge>
                    )}
                  </div>
                  {course.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {String(course.description)}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/centers/${centerId}/courses/${courseId}/edit`}>
                    <Button variant="outline" size="sm">
                      Settings
                    </Button>
                  </Link>
                  <CoursePublishAction course={course} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>{center?.name ?? `Center ${centerId}`}</span>
                </div>
                {course.instructor && (
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>
                      Instructor:{" "}
                      {typeof course.instructor === "object"
                        ? String((course.instructor as Record<string, unknown>).name ?? "")
                        : String(course.instructor)}
                    </span>
                  </div>
                )}
                {course.created_at && (
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>Created: {String(course.created_at)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Course Content
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Drag sections to reorder. Upload videos or PDFs inside each section.
                  </p>
                </div>
                <Link href={`/centers/${centerId}/courses/${courseId}/sections`}>
                  <Button size="sm" className="gap-2">
                    <span className="text-lg leading-none">+</span>
                    Add Section
                  </Button>
                </Link>
              </div>

              {isLoadingSections ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-12 w-full" />
                  ))}
                </div>
              ) : isSectionsError ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Failed to load sections.
                </p>
              ) : (
                <div className="space-y-2">
                  {orderedSections.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      No sections yet. Add the first section to get started.
                    </div>
                  ) : (
                    orderedSections.map((section) => {
                      const videoCount = getSectionCount(section, "videos");
                      return (
                        <div
                          key={section.id}
                          className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-dark dark:hover:border-gray-600"
                          draggable={!isReordering}
                          onDragStart={() => handleDragStart(section.id)}
                          onDragEnd={() => setDraggingId(null)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => handleDrop(section.id)}
                        >
                          <button
                            type="button"
                            className="cursor-grab text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                            aria-label="Drag to reorder"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <circle cx="4" cy="4" r="1.3" />
                              <circle cx="4" cy="8" r="1.3" />
                              <circle cx="4" cy="12" r="1.3" />
                              <circle cx="10" cy="4" r="1.3" />
                              <circle cx="10" cy="8" r="1.3" />
                              <circle cx="10" cy="12" r="1.3" />
                            </svg>
                          </button>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {section.title ?? section.name ?? `Section #${section.id}`}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {videoCount} {videoCount === 1 ? "video" : "videos"} •{" "}
                              {getSectionCount(section, "pdfs")} PDFs
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => {
                                setUploadTarget({ type: "video", sectionId: section.id });
                                setUploadFile(null);
                              }}
                              disabled={isReordering}
                            >
                              <span className="text-lg leading-none">+</span>
                              Video
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => {
                                setUploadTarget({ type: "pdf", sectionId: section.id });
                                setUploadFile(null);
                              }}
                              disabled={isReordering}
                            >
                              <span className="text-lg leading-none">+</span>
                              PDF
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={!!uploadTarget}
        onOpenChange={(open) => {
          if (!open) {
            setUploadTarget(null);
            setUploadFile(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Upload {uploadTarget?.type === "video" ? "Video" : "PDF"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="upload-file">
              Select {uploadTarget?.type === "video" ? "a video file" : "a PDF file"}
            </Label>
            <Input
              id="upload-file"
              type="file"
              accept={uploadTarget?.type === "video" ? "video/*" : "application/pdf"}
              onChange={(event) => {
                setUploadFile(event.target.files?.[0] ?? null);
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadTarget(null);
                setUploadFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setUploadTarget(null);
                setUploadFile(null);
              }}
              disabled={!uploadFile}
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
