"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeletePdf, usePdf } from "@/features/pdfs/hooks/use-pdfs";
import { useRouter } from "next/navigation";

type PageProps = {
  params: Promise<{ centerId: string; pdfId: string }>;
};

export default function CenterPdfDetailPage({ params }: PageProps) {
  const { centerId, pdfId } = use(params);
  const router = useRouter();
  const { data: pdf, isLoading, isError } = usePdf(centerId, pdfId);
  const { mutate: deletePdf, isPending: isDeleting } = useDeletePdf();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={pdf?.title ?? `PDF #${pdfId}`}
        description="Center PDF details"
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "PDFs", href: `/centers/${centerId}/pdfs` },
          { label: `PDF ${pdfId}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/centers/${centerId}/pdfs`}>
              <Button variant="outline">Back</Button>
            </Link>
            <Link href={`/centers/${centerId}/pdfs/${pdfId}/edit`}>
              <Button>Edit</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm("Delete this PDF?")) {
                  deletePdf(
                    { centerId, pdfId },
                    {
                      onSuccess: () => {
                        router.push(`/centers/${centerId}/pdfs`);
                      },
                    },
                  );
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>PDF Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {isError || !pdf ? (
            <p className="text-red-600 dark:text-red-400">
              Failed to load PDF.
            </p>
          ) : (
            <>
              <p>
                <span className="font-medium">ID:</span> {String(pdf.id)}
              </p>
              <p>
                <span className="font-medium">Status:</span> {pdf.status ?? "—"}
              </p>
              <p>
                <span className="font-medium">File Size:</span>{" "}
                {String(pdf.file_size ?? "—")}
              </p>
              <p>
                <span className="font-medium">Created:</span>{" "}
                {String(pdf.created_at ?? "—")}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
