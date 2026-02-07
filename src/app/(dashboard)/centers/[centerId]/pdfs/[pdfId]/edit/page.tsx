"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePdf, useUpdatePdf } from "@/features/pdfs/hooks/use-pdfs";

type PageProps = {
  params: Promise<{ centerId: string; pdfId: string }>;
};

export default function CenterPdfEditPage({ params }: PageProps) {
  const { centerId, pdfId } = use(params);
  const router = useRouter();
  const { data: pdf } = usePdf(centerId, pdfId);
  const { mutate: updatePdf, isPending } = useUpdatePdf();

  const [title, setTitle] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!pdf) return;
    setTitle(String(pdf.title ?? ""));
    setFileSize(String(pdf.file_size ?? ""));
    setStatus(String(pdf.status ?? ""));
  }, [pdf]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedFileSize = Number(fileSize);
    const fileSizeKb =
      fileSize.trim() === "" || Number.isNaN(parsedFileSize)
        ? undefined
        : parsedFileSize;

    updatePdf(
      {
        centerId,
        pdfId,
        payload: {
          title_translations: title.trim() ? { en: title.trim() } : undefined,
          file_size_kb: fileSizeKb,
          status: status || undefined,
        },
      },
      {
        onSuccess: () => {
          router.push(`/centers/${centerId}/pdfs/${pdfId}`);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit PDF"
        description="Update center PDF details"
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "PDFs", href: `/centers/${centerId}/pdfs` },
          { label: `PDF ${pdfId}`, href: `/centers/${centerId}/pdfs/${pdfId}` },
          { label: "Edit" },
        ]}
        actions={
          <Link href={`/centers/${centerId}/pdfs/${pdfId}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>PDF Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileSize">File Size</Label>
              <Input
                id="fileSize"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
