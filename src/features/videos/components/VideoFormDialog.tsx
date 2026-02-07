"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { isAxiosError } from "axios";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  useCreateVideo,
  useUpdateVideo,
} from "@/features/videos/hooks/use-videos";
import type { Video } from "@/features/videos/types/video";

const schema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters."),
  description: z.string().trim().optional(),
  url: z.string().trim().optional(),
  duration: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

type VideoFormDialogProps = {
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  centerId?: string | number | null;
  video?: Video | null;
  onSuccess?: (_value: string) => void;
};

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (data?.errors && typeof data.errors === "object") {
      const firstEntry = Object.values(data.errors)[0];
      if (Array.isArray(firstEntry) && firstEntry.length > 0) {
        return firstEntry[0];
      }
    }
  }

  return "Unable to save video. Please try again.";
}

export function VideoFormDialog({
  open,
  onOpenChange,
  centerId,
  video,
  onSuccess,
}: VideoFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const isEditMode = Boolean(video);
  const createMutation = useCreateVideo();
  const updateMutation = useUpdateVideo();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      duration: "",
      status: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    setFormError(null);
    form.reset({
      title:
        video?.title ??
        video?.title_translations?.en ??
        video?.title_translations?.ar ??
        "",
      description:
        video?.description ??
        video?.description_translations?.en ??
        video?.description_translations?.ar ??
        "",
      url: video?.url ? String(video.url) : "",
      duration: video?.duration ? String(video.duration) : "",
      status: video?.status ? String(video.status) : "",
    });
  }, [form, open, video]);

  const onSubmit = (values: FormValues) => {
    setFormError(null);
    if (!centerId) {
      setFormError("Select a center before saving this video.");
      return;
    }

    const payload = {
      title_translations: { en: values.title.trim() },
      description_translations: values.description?.trim()
        ? { en: values.description.trim() }
        : undefined,
      url: values.url?.trim() || undefined,
      duration: values.duration?.trim() || undefined,
      status: values.status?.trim() || undefined,
    };

    if (isEditMode && video) {
      updateMutation.mutate(
        {
          centerId,
          videoId: video.id,
          payload,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            onSuccess?.("Video updated successfully.");
          },
          onError: (error) => setFormError(getErrorMessage(error)),
        },
      );
      return;
    }

    createMutation.mutate(
      { centerId, payload },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.("Video created successfully.");
        },
        onError: (error) => setFormError(getErrorMessage(error)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px]">
        <DialogHeader className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold uppercase text-primary">
              VD
            </div>
            <div className="space-y-1">
              <DialogTitle>
                {isEditMode ? "Edit Video" : "Upload Video"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Update video details and metadata."
                  : "Add a new video to the catalog."}
              </DialogDescription>
            </div>
          </div>
          <div className="mt-1 flex flex-wrap gap-3 pb-3 text-xs">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
              Video Details
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
              Metadata
            </span>
          </div>
        </DialogHeader>

        {formError && (
          <Alert variant="destructive">
            <AlertTitle>Could not save video</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-900/40 md:grid-cols-2"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Video title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 12:34" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Short description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-4 md:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditMode
                    ? "Saving..."
                    : "Creating..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Video"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
