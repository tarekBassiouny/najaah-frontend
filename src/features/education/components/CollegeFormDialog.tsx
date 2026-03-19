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
import { useTranslation } from "@/features/localization";

type FormValues = {
  nameEn?: string;
  nameAr?: string;
  type?: string;
  address?: string;
  isActive: boolean;
};

type CollegeFormDialogProps = {
  centerId: string | number;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  college?: College | null;
  onSuccess?: (_message: string) => void;
  onSaved?: (_college: College) => void;
};

function getErrorMessage(
  error: unknown,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  const code = getAdminApiErrorCode(error);
  if (code === "DUPLICATE_SLUG") {
    return t("pages.education.dialogs.collegeForm.errors.duplicateSlug");
  }
  if (code === "VALIDATION_ERROR") {
    return t("pages.education.dialogs.collegeForm.errors.validation");
  }

  const fieldMessage = getAdminApiFirstFieldError(error);
  if (fieldMessage) {
    return fieldMessage;
  }

  return getAdminApiErrorMessage(
    error,
    t("pages.education.dialogs.collegeForm.errors.fallback"),
  );
}

export function CollegeFormDialog({
  centerId,
  open,
  onOpenChange,
  college,
  onSuccess,
  onSaved,
}: CollegeFormDialogProps) {
  const { t } = useTranslation();
  const schema = z
    .object({
      nameEn: z.string().trim().optional(),
      nameAr: z.string().trim().optional(),
      type: z.string().trim().optional(),
      address: z.string().trim().optional(),
      isActive: z.boolean(),
    })
    .refine((values) => Boolean(values.nameEn || values.nameAr), {
      message: t("pages.education.dialogs.collegeForm.validation.nameRequired"),
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
        message: t(
          "pages.education.dialogs.collegeForm.validation.typeInteger",
        ),
        path: ["type"],
      },
    );

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
            onSuccess?.(
              t("pages.education.dialogs.collegeForm.success.updated"),
            );
          },
          onError: (error) => {
            form.setError("root", { message: getErrorMessage(error, t) });
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
          onSuccess?.(t("pages.education.dialogs.collegeForm.success.created"));
        },
        onError: (error) => {
          form.setError("root", { message: getErrorMessage(error, t) });
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
                ? "pages.education.dialogs.collegeForm.titleEdit"
                : "pages.education.dialogs.collegeForm.titleCreate",
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              isEditMode
                ? "pages.education.dialogs.collegeForm.descriptionEdit"
                : "pages.education.dialogs.collegeForm.descriptionCreate",
            )}
          </DialogDescription>
        </DialogHeader>

        {form.formState.errors.root?.message ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t("pages.education.dialogs.collegeForm.errorTitle")}
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
                    {t(
                      "pages.education.dialogs.collegeForm.fields.nameEn.label",
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "pages.education.dialogs.collegeForm.fields.nameEn.placeholder",
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
                    {t(
                      "pages.education.dialogs.collegeForm.fields.nameAr.label",
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "pages.education.dialogs.collegeForm.fields.nameAr.placeholder",
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("pages.education.dialogs.collegeForm.fields.type.label")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder={t(
                        "pages.education.dialogs.collegeForm.fields.type.placeholder",
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t(
                      "pages.education.dialogs.collegeForm.fields.address.label",
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "pages.education.dialogs.collegeForm.fields.address.placeholder",
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
                      "pages.education.dialogs.collegeForm.fields.isActive.label",
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
                {t("pages.education.dialogs.collegeForm.actions.cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? t("pages.education.dialogs.collegeForm.actions.saving")
                  : t(
                      isEditMode
                        ? "pages.education.dialogs.collegeForm.actions.save"
                        : "pages.education.dialogs.collegeForm.actions.create",
                    )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
