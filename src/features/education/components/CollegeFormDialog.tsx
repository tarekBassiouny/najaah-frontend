"use client";

import { useEffect } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { College } from "@/features/education/types/education";
import {
  useCreateCollege,
  useUpdateCollege,
} from "@/features/education/hooks/use-colleges";
import {
  getAdminApiErrorCode,
  getAdminApiErrorMessage,
  getAdminApiFirstFieldError,
} from "@/lib/admin-response";

const schema = z
  .object({
    nameEn: z.string().trim().optional(),
    nameAr: z.string().trim().optional(),
    type: z.string().trim().optional(),
    address: z.string().trim().optional(),
    isActive: z.boolean(),
  })
  .refine((values) => Boolean(values.nameEn || values.nameAr), {
    message: "Enter at least one name (English or Arabic).",
    path: ["nameEn"],
  })
  .refine(
    (values) => {
      const rawType = values.type?.trim() ?? "";
      if (!rawType) return true;
      const parsed = Number(rawType);
      return Number.isInteger(parsed) && parsed >= 0;
    },
    {
      message: "Type must be a whole number (0 or greater).",
      path: ["type"],
    },
  );

type FormValues = z.infer<typeof schema>;

type CollegeFormDialogProps = {
  centerId: string | number;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  college?: College | null;
  onSuccess?: (_message: string) => void;
  onSaved?: (_college: College) => void;
};

const ERROR_CODE_MESSAGES: Record<string, string> = {
  DUPLICATE_SLUG: "A college with this slug already exists in this center.",
  VALIDATION_ERROR: "Please check the college fields and try again.",
};

function getErrorMessage(error: unknown) {
  const code = getAdminApiErrorCode(error);
  if (code && ERROR_CODE_MESSAGES[code]) {
    return ERROR_CODE_MESSAGES[code];
  }

  const fieldMessage = getAdminApiFirstFieldError(error);
  if (fieldMessage) {
    return fieldMessage;
  }

  return getAdminApiErrorMessage(error, "Unable to save college.");
}

export function CollegeFormDialog({
  centerId,
  open,
  onOpenChange,
  college,
  onSuccess,
  onSaved,
}: CollegeFormDialogProps) {
  const isEditMode = Boolean(college);
  const createMutation = useCreateCollege();
  const updateMutation = useUpdateCollege();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameEn: "",
      nameAr: "",
      type: "",
      address: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      nameEn: college?.name_translations?.en ?? "",
      nameAr: college?.name_translations?.ar ?? "",
      type:
        college?.type != null && Number.isFinite(Number(college.type))
          ? String(college.type)
          : "",
      address: college?.address ?? "",
      isActive: college?.is_active ?? true,
    });
  }, [college, form, open]);

  const onSubmit = (values: FormValues) => {
    const rawType = values.type?.trim() ?? "";
    const payload = {
      name_translations: {
        ...(values.nameEn ? { en: values.nameEn } : {}),
        ...(values.nameAr ? { ar: values.nameAr } : {}),
      },
      type: rawType ? Number(rawType) : null,
      address: values.address?.trim() || null,
      is_active: values.isActive,
    };

    if (isEditMode && college) {
      updateMutation.mutate(
        {
          centerId,
          collegeId: college.id,
          payload,
        },
        {
          onSuccess: (savedCollege) => {
            onOpenChange(false);
            onSaved?.(savedCollege);
            onSuccess?.("College updated successfully.");
          },
          onError: (error) => {
            form.setError("root", { message: getErrorMessage(error) });
          },
        },
      );
      return;
    }

    createMutation.mutate(
      {
        centerId,
        payload,
      },
      {
        onSuccess: (savedCollege) => {
          onOpenChange(false);
          onSaved?.(savedCollege);
          onSuccess?.("College created successfully.");
        },
        onError: (error) => {
          form.setError("root", { message: getErrorMessage(error) });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit College" : "Create College"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update college details and status."
              : "Add a new college for this center."}
          </DialogDescription>
        </DialogHeader>

        {form.formState.errors.root?.message ? (
          <Alert variant="destructive">
            <AlertTitle>Could not save college</AlertTitle>
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        ) : null}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 md:grid-cols-2"
          >
            <FormField
              control={form.control}
              name="nameEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (English)</FormLabel>
                  <FormControl>
                    <Input placeholder="Cairo University" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nameAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (Arabic)</FormLabel>
                  <FormControl>
                    <Input placeholder="جامعة القاهرة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="e.g. 1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600"
                    />
                    Active college
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="md:col-span-2">
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
                  ? "Saving..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create College"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
