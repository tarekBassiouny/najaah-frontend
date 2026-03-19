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

type FormValues = {
  nameEn?: string;
  nameAr?: string;
  stage: string;
  order: number;
  isActive: boolean;
};

type GradeFormDialogProps = {
  centerId: string | number;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  grade?: Grade | null;
  onSuccess?: (_message: string) => void;
  onSaved?: (_grade: Grade) => void;
};

function getErrorMessage(
  error: unknown,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  const code = getAdminApiErrorCode(error);
  if (code === "DUPLICATE_SLUG") {
    return t("pages.education.dialogs.gradeForm.errors.duplicateSlug");
  }
  if (code === "VALIDATION_ERROR") {
    return t("pages.education.dialogs.gradeForm.errors.validation");
  }

  const fieldMessage = getAdminApiFirstFieldError(error);
  if (fieldMessage) {
    return fieldMessage;
  }

  return getAdminApiErrorMessage(
    error,
    t("pages.education.dialogs.gradeForm.errors.fallback"),
  );
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
  const schema = z
    .object({
      nameEn: z.string().trim().optional(),
      nameAr: z.string().trim().optional(),
      stage: z.string().trim(),
      order: z.coerce
        .number()
        .int()
        .min(0, t("pages.education.dialogs.gradeForm.validation.orderMin")),
      isActive: z.boolean(),
    })
    .refine((values) => Boolean(values.nameEn || values.nameAr), {
      message: t("pages.education.dialogs.gradeForm.validation.nameRequired"),
      path: ["nameEn"],
    });

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
            onSuccess?.(t("pages.education.dialogs.gradeForm.success.updated"));
          },
          onError: (error) => {
            form.setError("root", {
              message: getErrorMessage(error, t),
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
          onSuccess?.(t("pages.education.dialogs.gradeForm.success.created"));
        },
        onError: (error) => {
          form.setError("root", {
            message: getErrorMessage(error, t),
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
            {t(
              isEditMode
                ? "pages.education.dialogs.gradeForm.titleEdit"
                : "pages.education.dialogs.gradeForm.titleCreate",
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              isEditMode
                ? "pages.education.dialogs.gradeForm.descriptionEdit"
                : "pages.education.dialogs.gradeForm.descriptionCreate",
            )}
          </DialogDescription>
        </DialogHeader>

        {form.formState.errors.root?.message ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t("pages.education.dialogs.gradeForm.errorTitle")}
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
                    {t("pages.education.dialogs.gradeForm.fields.nameEn.label")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "pages.education.dialogs.gradeForm.fields.nameEn.placeholder",
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
                    {t("pages.education.dialogs.gradeForm.fields.nameAr.label")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "pages.education.dialogs.gradeForm.fields.nameAr.placeholder",
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
                    {t("pages.education.dialogs.gradeForm.fields.stage.label")}
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
                  <FormLabel>
                    {t("pages.education.dialogs.gradeForm.fields.order.label")}
                  </FormLabel>
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
                    {t(
                      "pages.education.dialogs.gradeForm.fields.isActive.label",
                    )}
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
                {t("pages.education.dialogs.gradeForm.actions.cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? t("pages.education.dialogs.gradeForm.actions.saving")
                  : t(
                      isEditMode
                        ? "pages.education.dialogs.gradeForm.actions.save"
                        : "pages.education.dialogs.gradeForm.actions.create",
                    )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
