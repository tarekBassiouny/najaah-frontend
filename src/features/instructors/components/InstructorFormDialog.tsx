"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useModal } from "@/components/ui/modal-store";
import {
  useCreateInstructor,
  useUploadInstructorAvatar,
  useUpdateInstructor,
} from "@/features/instructors/hooks/use-instructors";
import type { Instructor } from "@/features/instructors/types/instructor";
import { getInstructorApiErrorMessage } from "@/features/instructors/lib/api-error";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .optional()
    .or(z.literal("")),
  title: z.string().trim().optional(),
  bio: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

type InstructorFormDialogProps = {
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  scopeCenterId?: string | number | null;
  instructor?: Instructor | null;
  onSuccess?: (_value: string) => void;
  onSaved?: (_value: Instructor) => void;
};

function getInitials(value: string) {
  const parts = value.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "IN";
  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function InstructorFormDialog({
  open,
  onOpenChange,
  scopeCenterId,
  instructor,
  onSuccess,
  onSaved,
}: InstructorFormDialogProps) {
  const { showToast } = useModal();
  const [formError, setFormError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const isEditMode = Boolean(instructor);

  const createMutation = useCreateInstructor({
    centerId: scopeCenterId ?? null,
  });
  const updateMutation = useUpdateInstructor({
    centerId: scopeCenterId ?? null,
  });
  const uploadAvatarMutation = useUploadInstructorAvatar({
    centerId: scopeCenterId ?? null,
  });
  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadAvatarMutation.isPending;
  const displayName = instructor?.name ? String(instructor.name) : "Instructor";
  const displayEmail = instructor?.email
    ? String(instructor.email)
    : "new.instructor";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      title: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    setFormError(null);
    setAvatarError(null);
    setAvatarFile(null);
    setAvatarPreview(null);
    form.reset({
      name: instructor?.name ? String(instructor.name) : "",
      email: instructor?.email ? String(instructor.email) : "",
      title: instructor?.title ? String(instructor.title) : "",
      bio: instructor?.bio ? String(instructor.bio) : "",
    });
  }, [form, instructor, open]);

  const avatarUrl =
    typeof instructor?.avatar_url === "string" &&
    instructor.avatar_url.trim().length > 0
      ? instructor.avatar_url
      : null;

  const avatarDisplayNameValue =
    instructor?.name ?? instructor?.email ?? instructor?.id;
  const avatarDisplayName =
    avatarDisplayNameValue != null
      ? String(
          instructor?.name ??
            instructor?.email ??
            `Instructor ${instructor?.id ?? ""}`,
        )
      : "Instructor";

  const avatarDisplaySrc = avatarPreview ?? avatarUrl;

  const validateAvatar = (file: File) => {
    if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.type)) {
      return "Please choose a valid image (JPG, PNG, or WebP).";
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      return "Avatar must be 5MB or smaller.";
    }

    return null;
  };

  const handleAvatarFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    setAvatarError(null);

    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }

    const validationMessage = validateAvatar(file);
    if (validationMessage) {
      setAvatarFile(null);
      setAvatarPreview(null);
      setAvatarError(validationMessage);
      event.target.value = "";
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = () => {
    setAvatarError(null);

    if (scopeCenterId == null) {
      setAvatarError("Select a center before uploading an avatar.");
      return;
    }

    if (!instructor) {
      setAvatarError("Save the instructor first, then upload an avatar.");
      return;
    }

    if (!avatarFile) {
      setAvatarError("Choose an image file first.");
      return;
    }

    uploadAvatarMutation.mutate(
      {
        instructorId: instructor.id,
        avatarFile,
      },
      {
        onSuccess: (savedInstructor) => {
          onSaved?.(savedInstructor);
          setAvatarFile(null);
          setAvatarPreview(null);
          const responseMessage =
            typeof savedInstructor._response_message === "string" &&
            savedInstructor._response_message.trim().length > 0
              ? savedInstructor._response_message
              : "Instructor avatar updated successfully.";
          showToast(responseMessage, "success");
        },
        onError: (error) => {
          setAvatarError(
            getInstructorApiErrorMessage(
              error,
              "Unable to upload avatar. Please try again.",
            ),
          );
        },
      },
    );
  };

  const onSubmit = (values: FormValues) => {
    setFormError(null);

    if (scopeCenterId == null) {
      setFormError("Select a center before creating or updating instructors.");
      return;
    }

    const payload = {
      name_translations: {
        en: values.name.trim(),
      },
      title_translations: values.title?.trim()
        ? { en: values.title.trim() }
        : undefined,
      bio_translations: values.bio?.trim()
        ? { en: values.bio.trim() }
        : undefined,
      email: values.email || undefined,
    };

    if (isEditMode && instructor) {
      updateMutation.mutate(
        {
          instructorId: instructor.id,
          payload,
        },
        {
          onSuccess: (savedInstructor) => {
            onOpenChange(false);
            onSaved?.(savedInstructor);
            onSuccess?.("Instructor updated successfully.");
          },
          onError: (error) =>
            setFormError(
              getInstructorApiErrorMessage(
                error,
                "Unable to save instructor. Please try again.",
              ),
            ),
        },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (savedInstructor) => {
        onOpenChange(false);
        onSaved?.(savedInstructor);
        onSuccess?.("Instructor created successfully.");
      },
      onError: (error) =>
        setFormError(
          getInstructorApiErrorMessage(
            error,
            "Unable to save instructor. Please try again.",
          ),
        ),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px]">
        <DialogHeader className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold uppercase text-primary">
              {getInitials(displayName)}
            </div>
            <div className="space-y-1">
              <DialogTitle>
                {isEditMode ? "Edit Instructor" : "Create Instructor"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Update instructor profile details."
                  : "Add a new instructor profile."}
              </DialogDescription>
              <p className="text-xs text-gray-400">
                {displayName} · {displayEmail}
              </p>
            </div>
          </div>
          <div className="mt-1 flex flex-wrap gap-3 pb-3 text-xs">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
              Profile Details
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
              Contact Info
            </span>
          </div>
        </DialogHeader>

        {formError && (
          <Alert variant="destructive">
            <AlertTitle>Could not save instructor</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-900/40 md:grid-cols-2"
          >
            {isEditMode ? (
              <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 md:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold uppercase text-white">
                    {avatarDisplaySrc ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={avatarDisplaySrc}
                        alt={`${avatarDisplayName} avatar`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(avatarDisplayName)
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Avatar
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      JPG, PNG, or WebP. Max size 5MB.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarFileChange}
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAvatarUpload}
                    disabled={!avatarFile || isPending}
                  >
                    {uploadAvatarMutation.isPending
                      ? "Uploading..."
                      : "Upload Avatar"}
                  </Button>
                </div>

                {avatarError ? (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {avatarError}
                  </p>
                ) : null}
              </div>
            ) : null}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Instructor name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="instructor@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Senior Lecturer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Short instructor bio"
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
                    : "Create Instructor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
