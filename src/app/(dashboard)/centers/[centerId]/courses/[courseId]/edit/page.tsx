"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCenterCourse,
  useUpdateCenterCourse,
} from "@/features/courses/hooks/use-courses";

type PageProps = {
  params: Promise<{ centerId: string; courseId: string }>;
};

export default function CenterCourseEditPage({ params }: PageProps) {
  const { centerId, courseId } = use(params);
  const router = useRouter();
  const { data: course } = useCenterCourse(centerId, courseId);
  const {
    mutate: updateCourse,
    isPending,
    isError,
    error,
  } = useUpdateCenterCourse();

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    status: "",
  });

  useEffect(() => {
    if (!course) return;
    setFormData({
      title: String(course.title ?? course.name ?? ""),
      slug: String(course.slug ?? ""),
      description: String(course.description ?? ""),
      status: String(course.status ?? ""),
    });
  }, [course]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateCourse(
      {
        centerId,
        courseId,
        payload: {
          title: formData.title || undefined,
          slug: formData.slug || undefined,
          description: formData.description || undefined,
          status: formData.status || undefined,
        },
      },
      {
        onSuccess: () => {
          router.push(`/centers/${centerId}/courses/${courseId}`);
        },
      },
    );
  };

  const handleChange =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Course"
        description="Update this center course"
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Courses", href: `/centers/${centerId}/courses` },
          {
            label: `Course ${courseId}`,
            href: `/centers/${centerId}/courses/${courseId}`,
          },
          { label: "Edit" },
        ]}
        actions={
          <Link href={`/centers/${centerId}/courses/${courseId}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
                <CardDescription>Update course details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={handleChange("title")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={handleChange("slug")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    value={formData.status}
                    onChange={handleChange("status")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={handleChange("description")}
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending || !formData.title}
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            {isError && (
              <Card className="border-red-200 dark:border-red-900">
                <CardContent className="py-4">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {(error as Error)?.message ||
                      "Failed to update course. Please try again."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
