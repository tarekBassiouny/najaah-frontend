"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  useCloneCourse,
  useCourse,
  useDeleteCourse,
} from "@/features/courses/hooks/use-courses";
import { CoursePublishAction } from "@/features/courses/components/CoursePublishAction";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function CourseDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: course, isLoading, isError } = useCourse(id);
  const { mutate: cloneCourse, isPending: isCloning } = useCloneCourse();
  const { mutate: deleteCourse, isPending: isDeleting } = useDeleteCourse();

  if (isLoading) {
    return (
      <div className="space-y-6">
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
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
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
        <PageHeader
          title="Course Not Found"
          description="The course you're looking for doesn't exist or you don't have access to it."
        />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              This course may have been deleted or you may not have permission
              to view it.
            </p>
            <Link href="/courses">
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={course.title ?? course.name ?? `Course #${course.id}`}
        description={course.description as string | undefined}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/courses/${id}/edit`}>
              <Button variant="outline">
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                cloneCourse(id, {
                  onSuccess: (cloned) => {
                    if (cloned?.id != null) {
                      router.push(`/courses/${cloned.id}`);
                    }
                  },
                });
              }}
              disabled={isCloning}
            >
              {isCloning ? "Cloning..." : "Clone"}
            </Button>
            <CoursePublishAction course={course} />
            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm("Delete this course?")) {
                  deleteCourse(id, {
                    onSuccess: () => {
                      router.push("/courses");
                    },
                  });
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>
                Basic information about this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <Badge variant={statusVariant}>
                      {course.status || "Unknown"}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Slug
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {course.slug || "—"}
                  </dd>
                </div>
                {course.instructor != null && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Instructor
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {typeof course.instructor === "object"
                        ? String(
                            (course.instructor as Record<string, unknown>)
                              .name ?? "",
                          )
                        : String(course.instructor)}
                    </dd>
                  </div>
                )}
                {course.category != null && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Category
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {typeof course.category === "object"
                        ? String(
                            (course.category as Record<string, unknown>).name ??
                              "",
                          )
                        : String(course.category)}
                    </dd>
                  </div>
                )}
                {course.sections_count !== undefined && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Sections
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {String(course.sections_count)}
                    </dd>
                  </div>
                )}
                {course.videos_count !== undefined && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Videos
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {String(course.videos_count)}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {typeof course.description === "string" && course.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                  {course.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/courses/${id}/sections`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                  Manage Sections
                </Button>
              </Link>
              <Link href={`/courses/${id}/videos`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Manage Videos
                </Button>
              </Link>
              <Link href={`/enrollments?course_id=${id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  View Enrollments
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">ID</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {String(course.id)}
                </span>
              </div>
              {typeof course.created_at === "string" && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Created
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(course.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {typeof course.updated_at === "string" && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Updated
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(course.updated_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
