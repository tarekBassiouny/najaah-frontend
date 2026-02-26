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

  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");

  useEffect(() => {
    if (!pdf) return;
    setTitleEn(String(pdf.title_translations?.en ?? pdf.title ?? ""));
    setTitleAr(String(pdf.title_translations?.ar ?? ""));
    setDescriptionEn(
      String(pdf.description_translations?.en ?? pdf.description ?? ""),
    );
    setDescriptionAr(String(pdf.description_translations?.ar ?? ""));
  }, [pdf]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedTitleEn = titleEn.trim();
    const normalizedTitleAr = titleAr.trim();
    const normalizedDescriptionEn = descriptionEn.trim();
    const normalizedDescriptionAr = descriptionAr.trim();

    updatePdf(
      {
        centerId,
        pdfId,
        payload: {
          title_translations: {
            ...(normalizedTitleEn ? { en: normalizedTitleEn } : {}),
            ...(normalizedTitleAr ? { ar: normalizedTitleAr } : {}),
          },
          description_translations: {
            ...(normalizedDescriptionEn ? { en: normalizedDescriptionEn } : {}),
            ...(normalizedDescriptionAr ? { ar: normalizedDescriptionAr } : {}),
          },
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
              <Label htmlFor="titleEn">Title (English)</Label>
              <Input
                id="titleEn"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="titleAr">Title (Arabic)</Label>
              <Input
                id="titleAr"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descriptionEn">Description (English)</Label>
              <textarea
                id="descriptionEn"
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descriptionAr">Description (Arabic)</Label>
              <textarea
                id="descriptionAr"
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                rows={3}
                dir="rtl"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <Button type="submit" disabled={isPending || !titleEn.trim()}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
