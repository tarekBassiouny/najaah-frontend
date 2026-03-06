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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  SCHOOL_TYPE_OPTIONS,
  type School,
} from "@/features/education/types/education";
import {
  useCreateSchool,
  useUpdateSchool,
} from "@/features/education/hooks/use-schools";
import {
  getAdminApiErrorCode,
  getAdminApiErrorMessage,
  getAdminApiFirstFieldError,
} from "@/lib/admin-response";

const schema = z
  .object({
    nameEn: z.string().trim().optional(),
    nameAr: z.string().trim().optional(),
    type: z.string().trim(),
    address: z.string().trim().optional(),
    isActive: z.boolean(),
  })
  .refine((values) => Boolean(values.nameEn || values.nameAr), {
    message: "Enter at least one name (English or Arabic).",
    path: ["nameEn"],
  });

type FormValues = z.infer<typeof schema>;

type SchoolFormDialogProps = {
  centerId: string | number;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  school?: School | null;
  onSuccess?: (_message: string) => void;
  onSaved?: (_school: School) => void;
};

const ERROR_CODE_MESSAGES: Record<string, string> = {
  DUPLICATE_SLUG: "A school with this slug already exists in this center.",
  VALIDATION_ERROR: "Please check the school fields and try again.",
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

  return getAdminApiErrorMessage(error, "Unable to save school.");
}

export function SchoolFormDialog({
  centerId,
  open,
  onOpenChange,
  school,
  onSuccess,
  onSaved,
}: SchoolFormDialogProps) {
  const isEditMode = Boolean(school);
  const createMutation = useCreateSchool();
  const updateMutation = useUpdateSchool();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameEn: "",
      nameAr: "",
      type: "0",
      address: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      nameEn: school?.name_translations?.en ?? "",
      nameAr: school?.name_translations?.ar ?? "",
      type:
        school?.type != null && Number.isFinite(Number(school.type))
          ? String(school.type)
          : "0",
      address: school?.address ?? "",
      isActive: school?.is_active ?? true,
    });
  }, [form, open, school]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      name_translations: {
        ...(values.nameEn ? { en: values.nameEn } : {}),
        ...(values.nameAr ? { ar: values.nameAr } : {}),
      },
      type: Number(values.type),
      address: values.address?.trim() || null,
      is_active: values.isActive,
    };

    if (isEditMode && school) {
      updateMutation.mutate(
        {
          centerId,
          schoolId: school.id,
          payload,
        },
        {
          onSuccess: (savedSchool) => {
            onOpenChange(false);
            onSaved?.(savedSchool);
            onSuccess?.("School updated successfully.");
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
        onSuccess: (savedSchool) => {
          onOpenChange(false);
          onSaved?.(savedSchool);
          onSuccess?.("School created successfully.");
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
            {isEditMode ? "Edit School" : "Create School"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update school details and status."
              : "Add a new school for this center."}
          </DialogDescription>
        </DialogHeader>

        {form.formState.errors.root?.message ? (
          <Alert variant="destructive">
            <AlertTitle>Could not save school</AlertTitle>
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
                    <Input placeholder="Cairo School" {...field} />
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
                    <Input placeholder="مدرسة القاهرة" {...field} />
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
                  <FormLabel>School Type</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHOOL_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    Active school
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
                    : "Create School"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
