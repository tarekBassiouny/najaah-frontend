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
  getAdminApiAllValidationMessages,
  getAdminApiErrorCode,
  getAdminApiErrorMessage,
} from "@/lib/admin-response";
import { useTranslation } from "@/features/localization";

type FormValues = {
  nameEn?: string;
  nameAr?: string;
  type: string;
  address?: string;
  isActive: boolean;
};

type SchoolFormDialogProps = {
  centerId: string | number;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  school?: School | null;
  onSuccess?: (_message: string) => void;
  onSaved?: (_school: School) => void;
};

function getErrorMessages(
  error: unknown,
  t: (_key: string, _params?: Record<string, string | number>) => string,
): string[] {
  const code = getAdminApiErrorCode(error);
  if (code === "DUPLICATE_SLUG") {
    return [t("pages.education.dialogs.schoolForm.errors.duplicateSlug")];
  }

  const fieldMessages = getAdminApiAllValidationMessages(error);
  if (fieldMessages.length > 0) {
    return fieldMessages;
  }

  if (code === "VALIDATION_ERROR") {
    return [t("pages.education.dialogs.schoolForm.errors.validation")];
  }

  return [
    getAdminApiErrorMessage(
      error,
      t("pages.education.dialogs.schoolForm.errors.fallback"),
    ),
  ];
}

export function SchoolFormDialog({
  centerId,
  open,
  onOpenChange,
  school,
  onSuccess,
  onSaved,
}: SchoolFormDialogProps) {
  const { t } = useTranslation();
  const schema = z
    .object({
      nameEn: z.string().trim().optional(),
      nameAr: z.string().trim().optional(),
      type: z.string().trim(),
      address: z.string().trim().optional(),
      isActive: z.boolean(),
    })
    .refine((values) => Boolean(values.nameEn || values.nameAr), {
      message: t("pages.education.dialogs.schoolForm.validation.nameRequired"),
      path: ["nameEn"],
    });

  const isEditMode = Boolean(school);
  const [formErrors, setFormErrors] = useState<string[]>([]);
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

    setFormErrors([]);
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
    setFormErrors([]);

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
            setFormErrors([]);
            onOpenChange(false);
            onSaved?.(savedSchool);
            onSuccess?.(
              t("pages.education.dialogs.schoolForm.success.updated"),
            );
          },
          onError: (error) => {
            setFormErrors(getErrorMessages(error, t));
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
          setFormErrors([]);
          onOpenChange(false);
          onSaved?.(savedSchool);
          onSuccess?.(t("pages.education.dialogs.schoolForm.success.created"));
        },
        onError: (error) => {
          setFormErrors(getErrorMessages(error, t));
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
                ? "pages.education.dialogs.schoolForm.titleEdit"
                : "pages.education.dialogs.schoolForm.titleCreate",
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              isEditMode
                ? "pages.education.dialogs.schoolForm.descriptionEdit"
                : "pages.education.dialogs.schoolForm.descriptionCreate",
            )}
          </DialogDescription>
        </DialogHeader>

        {formErrors.length > 0 ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t("pages.education.dialogs.schoolForm.errorTitle")}
            </AlertTitle>
            <AlertDescription>
              {formErrors.length === 1 ? (
                formErrors[0]
              ) : (
                <ul className="list-inside list-disc space-y-1">
                  {formErrors.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              )}
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
                      "pages.education.dialogs.schoolForm.fields.nameEn.label",
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "pages.education.dialogs.schoolForm.fields.nameEn.placeholder",
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
                      "pages.education.dialogs.schoolForm.fields.nameAr.label",
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "pages.education.dialogs.schoolForm.fields.nameAr.placeholder",
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
                    {t("pages.education.dialogs.schoolForm.fields.type.label")}
                  </FormLabel>
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
                  <FormLabel>
                    {t(
                      "pages.education.dialogs.schoolForm.fields.address.label",
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "pages.education.dialogs.schoolForm.fields.address.placeholder",
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
                      "pages.education.dialogs.schoolForm.fields.isActive.label",
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
                {t("pages.education.dialogs.schoolForm.actions.cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? t("pages.education.dialogs.schoolForm.actions.saving")
                  : t(
                      isEditMode
                        ? "pages.education.dialogs.schoolForm.actions.save"
                        : "pages.education.dialogs.schoolForm.actions.create",
                    )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
