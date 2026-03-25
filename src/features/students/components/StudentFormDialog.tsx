"use client";

import { useEffect, useMemo, useState } from "react";
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
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import {
  useCreateStudent,
  useUpdateStudent,
} from "@/features/students/hooks/use-students";
import type { Student } from "@/features/students/types/student";
import {
  getAdminApiAllValidationMessages,
  getAdminApiErrorMessage,
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";
import {
  useTranslation,
  type TranslateFunction,
} from "@/features/localization";

function getInitials(value: string) {
  const parts = value.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "ST";
  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const BASE_MOBILE_REGEX = /^[1-9]\d{9}$/;
const COUNTRY_CODE_REGEX = /^\+[1-9]\d{0,3}$/;

function normalizePhone(value?: string) {
  return value?.replace(/\s+/g, "").trim() ?? "";
}

function normalizeCountryCode(value?: string) {
  return value?.replace(/\s+/g, "").trim() ?? "";
}

const buildSchema = (t: TranslateFunction) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(2, t("pages.students.dialogs.form.validation.nameMin")),
    email: z
      .string()
      .trim()
      .email(t("pages.students.dialogs.form.validation.emailInvalid"))
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => !value || BASE_MOBILE_REGEX.test(normalizePhone(value)),
        t("pages.students.dialogs.form.validation.phoneInvalid"),
      ),
    countryCode: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) =>
          !value || COUNTRY_CODE_REGEX.test(normalizeCountryCode(value)),
        t("pages.students.dialogs.form.validation.countryCodeInvalid"),
      ),
    centerId: z.string().trim().optional(),
    status: z.enum(["1", "0", "2"]),
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

type StudentFormDialogProps = {
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  centerId?: string | number | null;
  scopeCenterId?: string | number | null;
  student?: Student | null;
  onSuccess?: (_value: string) => void;
  onCreated?: (_student: Student) => void;
};

function getErrorMessages(error: unknown, t: TranslateFunction): string[] {
  const fieldMessages = getAdminApiAllValidationMessages(error);
  if (fieldMessages.length > 0) return fieldMessages;
  return [
    getAdminApiErrorMessage(
      error,
      t("pages.students.dialogs.form.errors.saveFailed"),
    ),
  ];
}

export function StudentFormDialog({
  open,
  onOpenChange,
  centerId,
  scopeCenterId,
  student,
  onSuccess,
  onCreated,
}: StudentFormDialogProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(t), [t]);

  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isEditMode = Boolean(student);

  const createMutation = useCreateStudent({ centerId: scopeCenterId ?? null });
  const updateMutation = useUpdateStudent({ centerId: scopeCenterId ?? null });
  const isPending = createMutation.isPending || updateMutation.isPending;
  const displayName = student?.name
    ? String(student.name)
    : t("pages.students.fallbacks.student");
  const displayEmail = student?.email
    ? String(student.email)
    : t("pages.students.dialogs.form.placeholders.email");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      countryCode: "+20",
      centerId: "",
      status: "1",
    },
  });

  useEffect(() => {
    if (!open) return;

    setFormErrors([]);
    setShowAdvanced(false);
    form.reset({
      name: student?.name ? String(student.name) : "",
      email: student?.email ? String(student.email) : "",
      phone: student?.phone ? String(student.phone) : "",
      countryCode: student?.country_code ? String(student.country_code) : "+20",
      centerId:
        student?.center_id != null
          ? String(student.center_id)
          : centerId != null
            ? String(centerId)
            : "",
      status:
        student?.status != null
          ? ["0", "1", "2"].includes(String(student.status))
            ? (String(student.status) as "0" | "1" | "2")
            : "1"
          : student?.status_key === "inactive"
            ? "0"
            : student?.status_key === "banned"
              ? "2"
              : "1",
    });
  }, [centerId, form, open, student]);

  const onSubmit = (values: FormValues) => {
    setFormErrors([]);

    const normalizedPhone = normalizePhone(values.phone);
    const normalizedCountryCode = normalizeCountryCode(values.countryCode);

    if (!isEditMode && !normalizedPhone) {
      form.setError("phone", {
        type: "manual",
        message: t("pages.students.dialogs.form.validation.phoneRequired"),
      });
      return;
    }

    if (normalizedPhone && !BASE_MOBILE_REGEX.test(normalizedPhone)) {
      form.setError("phone", {
        type: "manual",
        message: t("pages.students.dialogs.form.validation.phoneInvalid"),
      });
      return;
    }

    if (
      normalizedCountryCode &&
      !COUNTRY_CODE_REGEX.test(normalizedCountryCode)
    ) {
      form.setError("countryCode", {
        type: "manual",
        message: t("pages.students.dialogs.form.validation.countryCodeInvalid"),
      });
      return;
    }

    const payload = {
      name: values.name,
      email: values.email || undefined,
      phone: normalizedPhone || undefined,
      country_code: normalizedCountryCode || undefined,
      status: Number(values.status),
      center_id: values.centerId || null,
    };

    if (isEditMode && student) {
      updateMutation.mutate(
        {
          studentId: student.id,
          payload,
        },
        {
          onSuccess: (response) => {
            if (!isAdminRequestSuccessful(response)) {
              setFormErrors([
                getAdminResponseMessage(
                  response,
                  t("pages.students.dialogs.form.errors.saveFailed"),
                ),
              ]);
              return;
            }
            onOpenChange(false);
            onSuccess?.(
              getAdminResponseMessage(
                response,
                t("pages.students.dialogs.form.messages.updated"),
              ),
            );
          },
          onError: (error) => setFormErrors(getErrorMessages(error, t)),
        },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (createdStudent) => {
        if (!isAdminRequestSuccessful(createdStudent)) {
          setFormErrors([
            getAdminResponseMessage(
              createdStudent,
              t("pages.students.dialogs.form.errors.saveFailed"),
            ),
          ]);
          return;
        }
        onOpenChange(false);
        onSuccess?.(
          getAdminResponseMessage(
            createdStudent,
            t("pages.students.dialogs.form.messages.created"),
          ),
        );
        onCreated?.(
          createdStudent ??
            ({
              id: "new",
              name: values.name,
              phone: normalizedPhone,
              country_code: normalizedCountryCode || null,
              center_id: values.centerId || null,
            } as Student),
        );
      },
      onError: (error) => setFormErrors(getErrorMessages(error, t)),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[640px] overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold uppercase text-primary">
              {getInitials(displayName)}
            </div>
            <div className="space-y-1">
              <DialogTitle>
                {isEditMode
                  ? t("pages.students.dialogs.form.titleEdit")
                  : t("pages.students.dialogs.form.titleCreate")}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? t("pages.students.dialogs.form.descriptionEdit")
                  : t("pages.students.dialogs.form.descriptionCreate")}
              </DialogDescription>
              <p className="text-xs text-gray-400">
                {displayName} · {displayEmail}
              </p>
            </div>
          </div>
          <div className="mt-1 flex flex-wrap gap-3 pb-3 text-xs">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
              {t("pages.students.dialogs.form.badges.studentDetails")}
            </span>
            {!isEditMode ? (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                {t("pages.students.dialogs.form.badges.enrollLater")}
              </span>
            ) : null}
          </div>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {t("pages.students.dialogs.form.advanced.title")}
            </p>
            <p className="text-xs text-gray-400">
              {t("pages.students.dialogs.form.advanced.description")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced((prev) => !prev)}
          >
            {showAdvanced
              ? t("pages.students.dialogs.form.actions.hideAdvanced")
              : t("pages.students.dialogs.form.actions.showAdvanced")}
          </Button>
        </div>

        {formErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>
              {t("pages.students.dialogs.form.errors.errorTitle")}
            </AlertTitle>
            <AlertDescription>
              {formErrors.length === 1 ? (
                formErrors[0]
              ) : (
                <ul className="list-inside list-disc space-y-1">
                  {formErrors.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-900/40 md:grid-cols-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>
                    {t("pages.students.dialogs.form.fields.name")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "pages.students.dialogs.form.placeholders.name",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showAdvanced ? (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("pages.students.dialogs.form.fields.email")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "pages.students.dialogs.form.placeholders.email",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("pages.students.dialogs.form.fields.phone")}{" "}
                    {!isEditMode ? (
                      <span className="text-red-500">*</span>
                    ) : null}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "pages.students.dialogs.form.placeholders.phone",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-400">
                    {t("pages.students.dialogs.form.hints.phone")}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showAdvanced ? (
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("pages.students.dialogs.form.fields.countryCode")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "pages.students.dialogs.form.placeholders.countryCode",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="centerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("pages.students.dialogs.form.fields.center")}{" "}
                    <span className="text-gray-400">
                      {t("pages.students.dialogs.form.optionalLabel")}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <CenterPicker
                      value={field.value || null}
                      onValueChange={(selectedCenterId) =>
                        field.onChange(
                          selectedCenterId != null
                            ? String(selectedCenterId)
                            : "",
                        )
                      }
                      allLabel={t("pages.students.dialogs.form.centerAllLabel")}
                      hideWhenCenterScoped={false}
                      className="w-full min-w-0"
                      selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                  {!isEditMode ? (
                    <p className="text-xs text-gray-400">
                      {t("pages.students.dialogs.form.hints.enrollAfterCreate")}
                    </p>
                  ) : null}
                </FormItem>
              )}
            />

            {showAdvanced ? (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("pages.students.dialogs.form.fields.status")}
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">
                            {t("pages.students.table.status.active")}
                          </SelectItem>
                          <SelectItem value="0">
                            {t("pages.students.table.status.inactive")}
                          </SelectItem>
                          <SelectItem value="2">
                            {t("pages.students.table.status.banned")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <DialogFooter className="mt-4 md:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {t("common.actions.cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditMode
                    ? t("pages.students.dialogs.form.actions.saving")
                    : t("pages.students.dialogs.form.actions.creating")
                  : isEditMode
                    ? t("pages.students.dialogs.form.actions.saveChanges")
                    : t("pages.students.dialogs.form.actions.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
