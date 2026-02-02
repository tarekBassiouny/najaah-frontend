"use client";

import { use } from "react";
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
import { useCenterCourse } from "@/features/courses/hooks/use-courses";
import { CoursePublishAction } from "@/features/courses/components/CoursePublishAction";

type PageProps = {
  params: Promise<{ centerId: string; courseId: string }>;
};

export default function CenterCourseDetailPage({ params }: PageProps) {
  const { centerId, courseId } = use(params);
  const {
    data: course,
    isLoading,
    isError,
  } = useCenterCourse(centerId, courseId);

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
          breadcrumbs={[
            { label: "Centers", href: "/centers" },
            { label: `Center ${centerId}`, href: `/centers/${centerId}` },
            { label: "Courses", href: `/centers/${centerId}/courses` },
            { label: `Course ${courseId}` },
          ]}
          actions={
            <Link href={`/centers/${centerId}/courses`}>
              <Button variant="outline">Back to Courses</Button>
            </Link>
          }
        />
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={course.title ?? course.name ?? `Course #${course.id}`}
        description={course.description as string | undefined}
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Courses", href: `/centers/${centerId}/courses` },
          { label: course.title ?? course.name ?? `Course ${courseId}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/centers/${centerId}/courses`}>
              <Button variant="outline">Back</Button>
            </Link>
            <Link href={`/centers/${centerId}/courses/${courseId}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
            <CoursePublishAction course={course} />
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
              <Link
                href={`/centers/${centerId}/courses/${courseId}/sections`}
                className="block"
              >
                <Button variant="outline" className="w-full justify-start">
                  Manage Sections
                </Button>
              </Link>
              <Link href={`/centers/${centerId}/videos`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  Manage Videos
                </Button>
              </Link>
              <Link href={`/centers/${centerId}/pdfs`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  Manage PDFs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
