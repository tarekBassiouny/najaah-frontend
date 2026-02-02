"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAttachSectionPdf,
  useAttachSectionVideo,
  useCreateSection,
  useDeleteSection,
  useDetachSectionPdf,
  useDetachSectionVideo,
  usePublishSection,
  useSections,
  useUnpublishSection,
} from "@/features/sections/hooks/use-sections";

const DEFAULT_PER_PAGE = 10;

type MediaAction = "attach-video" | "detach-video" | "attach-pdf" | "detach-pdf";

type Feedback = {
  type: "success" | "error";
  message: string;
};

type SectionManagerProps = {
  centerId: string | number;
  courseId: string | number;
  backHref: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
};

export function SectionManager({ centerId, courseId, backHref, breadcrumbs }: SectionManagerProps) {
  const router = useRouter();

  const { data, isLoading, isError } = useSections(
    centerId,
    courseId,
    { page: 1, per_page: DEFAULT_PER_PAGE },
  );

  const { mutate: createSection, isPending: isCreating } = useCreateSection();
  const { mutate: deleteSection, isPending: isDeleting } = useDeleteSection();
  const { mutate: publishSection, isPending: isPublishing } = usePublishSection();
  const { mutate: unpublishSection, isPending: isUnpublishing } = useUnpublishSection();
  const { mutate: attachVideo, isPending: isAttachingVideo } = useAttachSectionVideo();
  const { mutate: detachVideo, isPending: isDetachingVideo } = useDetachSectionVideo();
  const { mutate: attachPdf, isPending: isAttachingPdf } = useAttachSectionPdf();
  const { mutate: detachPdf, isPending: isDetachingPdf } = useDetachSectionPdf();

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [mediaAction, setMediaAction] = useState<MediaAction | null>(null);
  const [mediaSectionId, setMediaSectionId] = useState<string | number | null>(null);
  const [mediaValue, setMediaValue] = useState("");
  const [mediaError, setMediaError] = useState<string | null>(null);

  const isBusy =
    isCreating ||
    isDeleting ||
    isPublishing ||
    isUnpublishing ||
    isAttachingVideo ||
    isDetachingVideo ||
    isAttachingPdf ||
    isDetachingPdf;

  useEffect(() => {
    if (!mediaAction) {
      setMediaValue("");
      setMediaError(null);
    }
  }, [mediaAction]);

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") || "").trim();
    if (!title) return;

    createSection(
      {
        centerId,
        courseId,
        payload: { title },
      },
      {
        onSuccess: () => {
          event.currentTarget.reset();
        },
      },
    );
  };

  const openMediaDialog = (action: MediaAction, sectionId: string | number) => {
    setMediaAction(action);
    setMediaSectionId(sectionId);
    setMediaValue("");
    setMediaError(null);
  };

  const closeMediaDialog = () => {
    if (isBusy) return;
    setMediaAction(null);
    setMediaSectionId(null);
  };

  const handleMediaSubmit = () => {
    if (!mediaAction || mediaSectionId == null) return;
    const value = mediaValue.trim();
    if (!value) {
      setMediaError("ID is required.");
      return;
    }

    setMediaError(null);

    const onSuccess = () => {
      setFeedback({
        type: "success",
        message: "Section media updated successfully.",
      });
      closeMediaDialog();
    };

    const onError = (error: unknown) => {
      setFeedback({
        type: "error",
        message: (error as Error)?.message || "Failed to update section media.",
      });
    };

    if (mediaAction === "attach-video") {
      attachVideo(
        {
          centerId,
          courseId,
          sectionId: mediaSectionId,
          payload: { video_id: value },
        },
        { onSuccess, onError },
      );
      return;
    }

    if (mediaAction === "detach-video") {
      detachVideo(
        {
          centerId,
          courseId,
          sectionId: mediaSectionId,
          videoId: value,
        },
        { onSuccess, onError },
      );
      return;
    }

    if (mediaAction === "attach-pdf") {
      attachPdf(
        {
          centerId,
          courseId,
          sectionId: mediaSectionId,
          payload: { pdf_id: value },
        },
        { onSuccess, onError },
      );
      return;
    }

    detachPdf(
      {
        centerId,
        courseId,
        sectionId: mediaSectionId,
        pdfId: value,
      },
      { onSuccess, onError },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections"
        description="Create and manage sections for this course"
        breadcrumbs={breadcrumbs}
        actions={
          <Link href={backHref}>
            <Button variant="outline">Back to Course</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sections</CardTitle>
              <CardDescription>Manage section status and content.</CardDescription>
            </CardHeader>
            <CardContent>
              {feedback && (
                <div
                  className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                    feedback.type === "success"
                      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-200"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200"
                  }`}
                >
                  {feedback.message}
                </div>
              )}
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-10 w-full" />
                  ))}
                </div>
              ) : isError ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Failed to load sections.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-4">
                          Title
                        </TableHead>
                        <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-4">
                          Status
                        </TableHead>
                        <TableHead className="h-11 px-3 text-right text-xs font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-4">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.items ?? []).map((section) => {
                        const status = String(section.status ?? "draft");
                        const isPublished = status.toLowerCase() === "published";
                        return (
                          <TableRow key={section.id}>
                            <TableCell className="px-3 py-2 text-sm font-medium text-dark dark:text-white">
                              {section.title ?? section.name ?? `Section #${section.id}`}
                            </TableCell>
                            <TableCell className="px-3 py-2 text-sm">{status}</TableCell>
                            <TableCell className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (isPublished) {
                                      unpublishSection({ centerId, courseId, sectionId: section.id });
                                    } else {
                                      publishSection({ centerId, courseId, sectionId: section.id });
                                    }
                                  }}
                                  disabled={isBusy}
                                >
                                  {isPublished ? "Unpublish" : "Publish"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openMediaDialog("attach-video", section.id)}
                                  disabled={isBusy}
                                >
                                  Attach Video
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openMediaDialog("detach-video", section.id)}
                                  disabled={isBusy}
                                >
                                  Detach Video
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openMediaDialog("attach-pdf", section.id)}
                                  disabled={isBusy}
                                >
                                  Attach PDF
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openMediaDialog("detach-pdf", section.id)}
                                  disabled={isBusy}
                                >
                                  Detach PDF
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (window.confirm("Delete this section?")) {
                                      deleteSection({ centerId, courseId, sectionId: section.id });
                                    }
                                  }}
                                  disabled={isBusy}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Section</CardTitle>
              <CardDescription>Quickly add a new section.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreate}>
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" placeholder="e.g., Getting Started" required />
                </div>
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Section"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <p>Add videos or PDFs to each section once created.</p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push(backHref)}
              >
                Back to Course
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!mediaAction} onOpenChange={(open) => (!open ? closeMediaDialog() : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mediaAction === "attach-video" && "Attach Video"}
              {mediaAction === "detach-video" && "Detach Video"}
              {mediaAction === "attach-pdf" && "Attach PDF"}
              {mediaAction === "detach-pdf" && "Detach PDF"}
            </DialogTitle>
            <DialogDescription>
              {mediaAction?.includes("video")
                ? "Provide the video ID to update this section."
                : "Provide the PDF ID to update this section."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="media-id">Media ID</Label>
            <Input
              id="media-id"
              value={mediaValue}
              onChange={(event) => setMediaValue(event.target.value)}
              placeholder="e.g., 123"
            />
            {mediaError && (
              <p className="text-sm text-red-600 dark:text-red-400">{mediaError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeMediaDialog} disabled={isBusy}>
              Cancel
            </Button>
            <Button onClick={handleMediaSubmit} disabled={isBusy}>
              {isBusy ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
