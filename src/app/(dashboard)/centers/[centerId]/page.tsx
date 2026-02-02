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
import { useCenter } from "@/features/centers/hooks/use-centers";
import { Skeleton } from "@/components/ui/skeleton";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterDetailPage({ params }: PageProps) {
  const { centerId } = use(params);
  const { data: center, isLoading } = useCenter(centerId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={center?.name ?? `Center ${centerId}`}
        description={center?.slug ? `Slug: ${center.slug}` : "Center overview"}
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: center?.name ?? `Center ${centerId}` },
        ]}
        actions={
          <Link href="/centers">
            <Button variant="outline">Back to Centers</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
            <CardDescription>Manage center courses.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/centers/${centerId}/courses`}>
              <Button className="w-full">Manage Courses</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Videos</CardTitle>
            <CardDescription>Center video library.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/centers/${centerId}/videos`}>
              <Button className="w-full">Manage Videos</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PDFs</CardTitle>
            <CardDescription>Center PDF library.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/centers/${centerId}/pdfs`}>
              <Button className="w-full">Manage PDFs</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>Center student roster.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/centers/${centerId}/students`}>
              <Button className="w-full">Manage Students</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Center course categories.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/centers/${centerId}/categories`}>
              <Button className="w-full">Manage Categories</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
