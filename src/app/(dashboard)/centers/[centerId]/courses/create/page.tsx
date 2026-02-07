"use client";

import { use, useState } from "react";
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
import { useCreateCenterCourse } from "@/features/courses/hooks/use-courses";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterCoursesCreatePage({ params }: PageProps) {
  const { centerId } = use(params);
  const router = useRouter();
  const {
    mutate: createCourse,
    isPending,
    isError,
    error,
  } = useCreateCenterCourse();

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createCourse(
      {
        centerId,
        payload: {
          title: formData.title,
          slug: formData.slug || undefined,
          description: formData.description || undefined,
        },
      },
      {
        onSuccess: (course) => {
          router.push(`/centers/${centerId}/courses/${course.id}`);
        },
      },
    );
  };

  const handleChange =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData((prev) => ({ ...prev, slug }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Course"
        description="Create a course inside this center"
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Courses", href: `/centers/${centerId}/courses` },
          { label: "Create" },
        ]}
        actions={
          <Link href={`/centers/${centerId}/courses`}>
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
                <CardDescription>
                  Basic details about your course
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={handleChange("title")}
                    placeholder="e.g., Introduction to React"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <div className="flex gap-2">
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={handleChange("slug")}
                      placeholder="e.g., intro-to-react"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateSlug}
                      disabled={!formData.title}
                    >
                      Generate
                    </Button>
                  </div>
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
                  {isPending ? "Creating..." : "Create Course"}
                </Button>
              </CardContent>
            </Card>

            {isError && (
              <Card className="border-red-200 dark:border-red-900">
                <CardContent className="py-4">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {(error as Error)?.message ||
                      "Failed to create course. Please try again."}
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
