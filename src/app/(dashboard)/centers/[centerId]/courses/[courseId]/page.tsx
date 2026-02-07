"use client";

import { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { http } from "@/lib/http";
import { useCenterCourse } from "@/features/courses/hooks/use-courses";
import { CoursePublishAction } from "@/features/courses/components/CoursePublishAction";
import { StudentsTable } from "@/features/students/components/StudentsTable";

type PageProps = {
  params: Promise<{ centerId: string; courseId: string }>;
};

type CourseSection = {
  id?: string | number;
  sort_order?: number;
  title?: string;
  name?: string;
  description?: string;
  videos?: CourseVideoItem[];
  pdfs?: Array<{ title?: string }>;
  [key: string]: unknown;
};

type CourseVideoItem = {
  title?: string;
  duration?: number | string | null;
  [key: string]: unknown;
};

const getSectionsBySortOrder = (sections: CourseSection[] = []) =>
  [...sections].sort((a, b) => {
    const aOrder =
      typeof a.sort_order === "number" ? a.sort_order : Number.POSITIVE_INFINITY;
    const bOrder =
      typeof b.sort_order === "number" ? b.sort_order : Number.POSITIVE_INFINITY;
    return aOrder - bOrder;
  });

export default function CenterCourseDetailPage({ params }: PageProps) {
  const { centerId, courseId } = use(params);
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [activePanel, setActivePanel] = useState<"overview" | "students">(
    "overview",
  );
  const { data: course, isLoading, isError } = useCenterCourse(centerId, courseId);
  const { mutate: reorderSections, isPending: isReordering } = useMutation({
    mutationFn: (orderedIds: Array<string | number>) =>
      http.put(
        `/api/v1/admin/centers/${centerId}/courses/${courseId}/sections/reorder`,
        { sections: orderedIds },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["center-course", centerId, courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["sections", centerId, courseId],
      });
    },
  });
  const [orderedSections, setOrderedSections] = useState<CourseSection[]>([]);
  const [draggingId, setDraggingId] = useState<string | number | null>(null);
  const [dragStartOrder, setDragStartOrder] = useState<Array<string | number>>([]);
  const [expandedSections, setExpandedSections] = useState<Array<string | number>>(
    [],
  );
  const [uploadTarget, setUploadTarget] = useState<{
    type: "video" | "pdf";
    sectionId: CourseSection["id"];
  } | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    if (!course) return;
    setOrderedSections(getSectionsBySortOrder(course.sections ?? []));
  }, [course]);

  const navItems = useMemo(
    () => [
      {
        id: "overview",
        label: "Overview",
        href: `/centers/${centerId}/courses/${courseId}`,
      },
      {
        id: "students",
        label: "Enrolled Students",
        href: null,
      },
      {
        id: "settings",
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
              This course may have been deleted or you may not have permission
              to view it.
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

  const canReorder = orderedSections.every((section) => section.id != null);

  const handleDragStart = (sectionId: string | number | null) => {
    if (!canReorder || sectionId == null) return;
    setDraggingId(sectionId);
    setDragStartOrder(
      orderedSections
        .map((section) => section.id)
        .filter((id): id is string | number => id != null),
    );
  };

  const handleDragOver = (targetId: string | number | null) => {
    if (!canReorder || draggingId == null || targetId == null || draggingId === targetId) {
      return;
    }

    setOrderedSections((prev) => {
      const fromIndex = prev.findIndex((section) => section.id === draggingId);
      const toIndex = prev.findIndex((section) => section.id === targetId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleDrop = () => {
    if (!canReorder || draggingId == null) {
      setDraggingId(null);
      setDragStartOrder([]);
      return;
    }
    setDraggingId(null);

    const nextOrderedIds = orderedSections
      .map((section) => section.id)
      .filter((id): id is string | number => id != null);

    const hasChanged =
      nextOrderedIds.length !== dragStartOrder.length ||
      nextOrderedIds.some((id, index) => id !== dragStartOrder[index]);

    if (!hasChanged) {
      setDragStartOrder([]);
      return;
    }

    reorderSections(
      nextOrderedIds,
      {
        onError: () => {
          setOrderedSections(getSectionsBySortOrder(course?.sections ?? orderedSections));
        },
      },
    );
    setDragStartOrder([]);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const getSectionCount = (section: CourseSection, key: "videos" | "pdfs") => {
    const countKey = `${key}_count` as keyof CourseSection;
    if (typeof section[countKey] === "number") {
      return section[countKey] as number;
    }
    return Array.isArray(section[key]) ? section[key]?.length ?? 0 : 0;
  };

  const formatDuration = (video?: CourseVideoItem | null) => {
    const raw = video?.duration;
    if (raw == null || raw === "") return "—";
    const numeric = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isNaN(numeric)) {
      const totalSeconds = Math.max(0, Math.floor(numeric));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${String(seconds).padStart(2, "0")}`;
    }
    return String(raw);
  };

  const getSectionKey = (section: CourseSection, index: number) => {
    if (section.id != null) return section.id;
    if (section.title) return section.title;
    if (section.name) return section.name;
    return `section-${index}`;
  };

  const toggleSectionExpanded = (sectionKey: string | number) => {
    setExpandedSections((prev) =>
      prev.includes(sectionKey)
        ? prev.filter((key) => key !== sectionKey)
        : [...prev, sectionKey],
    );
  };

  const shouldIgnoreToggle = (event: React.MouseEvent | React.KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    return Boolean(target?.closest("[data-no-toggle]"));
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
                const isActive =
                  item.id === "overview"
                    ? activePanel === "overview"
                    : item.id === "students"
                      ? activePanel === "students"
                      : pathname === item.href;
                const itemClass = `block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                }`;

                if (item.id === "students") {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setActivePanel("students")}
                      className={itemClass}
                    >
                      {item.label}
                    </button>
                  );
                }

                if (item.id === "overview") {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setActivePanel("overview")}
                      className={itemClass}
                    >
                      {item.label}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href!}
                    className={itemClass}
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
                  {course.description ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {String(course.description)}
                    </p>
                  ) : null}
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
                  <span>{course.center?.name ?? `Center ${centerId}`}</span>
                </div>
                {course.instructor ? (
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>
                      Instructor:{" "}
                      {typeof course.instructor === "object"
                        ? String((course.instructor as Record<string, unknown>).name ?? "")
                        : String(course.instructor)}
                    </span>
                  </div>
                ) : null}
                {course.created_at ? (
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>Created: {String(course.created_at)}</span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {activePanel === "overview" ? (
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

                <div className="space-y-2">
                  {orderedSections.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      No sections yet. Add the first section to get started.
                    </div>
                  ) : (
                    orderedSections.map((section, index) => {
                    const videoCount = getSectionCount(section, "videos");
                    const pdfCount = getSectionCount(section, "pdfs");
                    const sectionKey = getSectionKey(section, index);
                    const isExpanded = expandedSections.includes(sectionKey);
                    return (
                      <div
                        key={sectionKey}
                        className={`flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm transition-[transform,opacity,box-shadow,border-color,background-color] duration-200 ease-out hover:border-gray-300 dark:border-gray-700 dark:bg-gray-dark dark:hover:border-gray-600 ${
                          section.id === draggingId
                            ? "border-primary/40 opacity-0 ring-2 ring-primary/20"
                            : ""
                        }`}
                        draggable={!isReordering && canReorder}
                        onDragStart={() => handleDragStart(section.id ?? null)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(event) => {
                          event.preventDefault();
                          handleDragOver(section.id ?? null);
                        }}
                        onDrop={handleDrop}
                        onClick={(event) => {
                          if (shouldIgnoreToggle(event)) return;
                          toggleSectionExpanded(sectionKey);
                        }}
                        onKeyDown={(event) => {
                          if (shouldIgnoreToggle(event)) return;
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            toggleSectionExpanded(sectionKey);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                      >
                        <div
                          className={`flex cursor-grab items-center gap-2 text-gray-400 dark:text-gray-500 ${
                            !canReorder ? "opacity-40" : ""
                          }`}
                          data-no-toggle
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <circle cx="4" cy="4" r="1.3" />
                            <circle cx="4" cy="8" r="1.3" />
                            <circle cx="4" cy="12" r="1.3" />
                            <circle cx="10" cy="4" r="1.3" />
                            <circle cx="10" cy="8" r="1.3" />
                            <circle cx="10" cy="12" r="1.3" />
                          </svg>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : "rotate-0"}`}
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {section.title ?? section.name ?? "Untitled Section"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {videoCount} {videoCount === 1 ? "video" : "videos"} •{" "}
                            {pdfCount} PDFs
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
                            data-no-toggle
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
                            data-no-toggle
                          >
                            <span className="text-lg leading-none">+</span>
                            PDF
                          </Button>
                        </div>

                        {isExpanded ? (
                          <div className="w-full border-t border-gray-200 bg-white pt-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-dark dark:text-gray-300">
                            <div className="space-y-3">
                              {(section.videos ?? []).length === 0 &&
                              (section.pdfs ?? []).length === 0 ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  No content yet.
                                </p>
                              ) : (
                                <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-dark">
                                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {(section.videos ?? []).map((video, vidx) => (
                                      <li
                                        key={`${sectionKey}-video-${vidx}`}
                                        className="flex items-center gap-3 px-3 py-3 text-sm"
                                      >
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                          <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                          >
                                            <path d="M8.25 6.75a.75.75 0 00-1.5 0v10.5a.75.75 0 001.5 0v-4.19l8.25 4.69a.75.75 0 001.125-.655V7.405a.75.75 0 00-1.125-.655L8.25 11.44V6.75z" />
                                          </svg>
                                        </span>
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {video.title ?? "Untitled video"}
                                          </p>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                          {formatDuration(video)}
                                        </span>
                                      </li>
                                    ))}
                                    {(section.pdfs ?? []).map((pdf, pidx) => (
                                      <li
                                        key={`${sectionKey}-pdf-${pidx}`}
                                        className="flex items-center gap-3 px-3 py-3 text-sm"
                                      >
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                          <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              clipRule="evenodd"
                                              d="M7.5 2.75c-.966 0-1.75.784-1.75 1.75v15c0 .966.784 1.75 1.75 1.75h9a1.75 1.75 0 001.75-1.75V8.664a1.75 1.75 0 00-.513-1.237l-3.164-3.164A1.75 1.75 0 0013.336 3.75H7.5zm5.25 1.5v3.5c0 .414.336.75.75.75h3.5v-.087a.25.25 0 00-.073-.177L13.763 4.323A.25.25 0 0013.586 4.25h-.086z"
                                            />
                                          </svg>
                                        </span>
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {pdf.title ?? "Untitled PDF"}
                                          </p>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Enrolled Students
              </p>
              <StudentsTable
                centerId={centerId}
                initialPage={1}
                initialPerPage={15}
              />
            </div>
          )}
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
