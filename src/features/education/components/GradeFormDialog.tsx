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
  EDUCATIONAL_STAGE_OPTIONS,
  type Grade,
} from "@/features/education/types/education";
import {
  useCreateGrade,
  useUpdateGrade,
} from "@/features/education/hooks/use-grades";
import {
  getAdminApiErrorCode,
  getAdminApiErrorMessage,
  getAdminApiFirstFieldError,
} from "@/lib/admin-response";
import { useTranslation } from "@/features/localization";

const schema = z
  .object({
    nameEn: z.string().trim().optional(),
    nameAr: z.string().trim().optional(),
    stage: z.string().trim(),
    order: z.coerce.number().int().min(0, "Order must be 0 or more."),
    isActive: z.boolean(),
  })
  .refine((values) => Boolean(values.nameEn || values.nameAr), {
    message: "Enter at least one name (English or Arabic).",
    path: ["nameEn"],
  });

type FormValues = z.infer<typeof schema>;

type GradeFormDialogProps = {
  centerId: string | number;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  grade?: Grade | null;
  onSuccess?: (_message: string) => void;
  onSaved?: (_grade: Grade) => void;
};

const ERROR_CODE_MESSAGES: Record<string, string> = {
  DUPLICATE_SLUG: "A grade with this slug already exists in this center.",
  VALIDATION_ERROR: "Please check the grade fields and try again.",
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

  return getAdminApiErrorMessage(error, "Unable to save grade.");
}

export function GradeFormDialog({
  centerId,
  open,
  onOpenChange,
  grade,
  onSuccess,
  onSaved,
}: GradeFormDialogProps) {
  const { t } = useTranslation();

  const isEditMode = Boolean(grade);
  const createMutation = useCreateGrade();
  const updateMutation = useUpdateGrade();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameEn: "",
      nameAr: "",
      stage: "0",
      order: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      nameEn: grade?.name_translations?.en ?? "",
      nameAr: grade?.name_translations?.ar ?? "",
      stage:
        grade?.stage != null && Number.isFinite(Number(grade.stage))
          ? String(grade.stage)
          : "0",
      order:
        grade?.order != null && Number.isFinite(Number(grade.order))
          ? Number(grade.order)
          : 0,
      isActive: grade?.is_active ?? true,
    });
  }, [form, grade, open]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      name_translations: {
        ...(values.nameEn ? { en: values.nameEn } : {}),
        ...(values.nameAr ? { ar: values.nameAr } : {}),
      },
      stage: Number(values.stage),
      order: values.order,
      is_active: values.isActive,
    };

    if (isEditMode && grade) {
      updateMutation.mutate(
        {
          centerId,
          gradeId: grade.id,
          payload,
        },
        {
          onSuccess: (savedGrade) => {
            onOpenChange(false);
            onSaved?.(savedGrade);
            onSuccess?.("Grade updated successfully.");
          },
          onError: (error) => {
            form.setError("root", {
              message: getErrorMessage(error),
            });
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
        onSuccess: (savedGrade) => {
          onOpenChange(false);
          onSaved?.(savedGrade);
          onSuccess?.("Grade created successfully.");
        },
        onError: (error) => {
          form.setError("root", {
            message: getErrorMessage(error),
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Grade" : "Create Grade"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update grade names, stage, and status."
              : "Add a new grade for this center."}
          </DialogDescription>
        </DialogHeader>

        {form.formState.errors.root?.message ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t("auto.features.education.components.gradeformdialog.s1")}
            </AlertTitle>
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
                  <FormLabel>
                    {t("auto.features.education.components.gradeformdialog.s2")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "auto.features.education.components.gradeformdialog.s3",
                      )}
                      {...field}
                    />
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
                  <FormLabel>
                    {t("auto.features.education.components.gradeformdialog.s4")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "auto.features.education.components.gradeformdialog.s5",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("auto.features.education.components.gradeformdialog.s6")}
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EDUCATIONAL_STAGE_OPTIONS.map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
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
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
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
                    {t("auto.features.education.components.gradeformdialog.s7")}
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
                {t("auto.features.education.components.gradeformdialog.s8")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Grade"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
