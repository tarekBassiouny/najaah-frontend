"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTenant } from "@/app/tenant-provider";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogHeader } from "@/components/ui/dialog";
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
  useCreateAdminUser,
  useUpdateAdminUser,
} from "@/features/admin-users/hooks/use-admin-users";
import type { AdminUser } from "@/features/admin-users/types/admin-user";
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

const BASE_MOBILE_REGEX = /^[1-9]\d{9}$/;
const COUNTRY_CODE_REGEX = /^\+[1-9]\d{0,3}$/;

function normalizePhone(value?: string) {
  return value?.replace(/\s+/g, "").trim() ?? "";
}

function normalizeCountryCode(value?: string) {
  return value?.replace(/\s+/g, "").trim() ?? "";
}

function getInitials(value: string) {
  const parts = value.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "AU";
  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const buildSchema = (t: TranslateFunction) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(2, t("pages.admins.dialogs.form.validation.nameMin")),
    email: z
      .string()
      .trim()
      .email(t("pages.admins.dialogs.form.validation.emailInvalid")),
    phone: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => !value || BASE_MOBILE_REGEX.test(normalizePhone(value)),
        t("pages.admins.dialogs.form.validation.phoneInvalid"),
      ),
    countryCode: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) =>
          !value || COUNTRY_CODE_REGEX.test(normalizeCountryCode(value)),
        t("pages.admins.dialogs.form.validation.countryCodeInvalid"),
      ),
    centerId: z.string().trim().optional(),
    status: z.enum(["1", "0", "2"]),
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

type AdminUserFormDialogProps = {
  user?: AdminUser | null;
  onSuccess?: (_value: string) => void;
  onClose: () => void;
  onCreated?: (_user: AdminUser) => void;
  scopeCenterId?: string | number | null;
};

function getErrorMessages(error: unknown, t: TranslateFunction): string[] {
  const fieldMessages = getAdminApiAllValidationMessages(error);
  if (fieldMessages.length > 0) return fieldMessages;
  return [
    getAdminApiErrorMessage(
      error,
      t("pages.admins.dialogs.form.errors.saveFailed"),
    ),
  ];
}

export function AdminUserFormDialog({
  user,
  onSuccess,
  onClose,
  onCreated,
  scopeCenterId,
}: AdminUserFormDialogProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(t), [t]);

  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isEditMode = Boolean(user);
  const { centerSlug, centerId: tenantCenterId, centerName } = useTenant();
  const isCenterScoped = Boolean(centerSlug) || scopeCenterId != null;
  const effectiveScopeCenterId = scopeCenterId ?? tenantCenterId ?? null;

  const displayName = user?.name
    ? String(user.name)
    : t("pages.admins.fallbacks.adminUser");
  const displayEmail = user?.email
    ? String(user.email)
    : t("pages.admins.dialogs.form.placeholders.email");

  const createMutation = useCreateAdminUser({
    centerId: effectiveScopeCenterId,
  });
  const updateMutation = useUpdateAdminUser({
    centerId: effectiveScopeCenterId,
  });
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
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
    setFormErrors([]);
    setShowAdvanced(false);
    form.reset({
      name: user?.name ? String(user.name) : "",
      email: user?.email ? String(user.email) : "",
      phone: user?.phone ? String(user.phone) : "",
      countryCode: user?.country_code ? String(user.country_code) : "+20",
      centerId:
        user?.center_id != null
          ? String(user.center_id)
          : effectiveScopeCenterId != null
            ? String(effectiveScopeCenterId)
            : "",
      status:
        user?.status != null && ["0", "1", "2"].includes(String(user.status))
          ? (String(user.status) as "0" | "1" | "2")
          : user?.status_key === "inactive"
            ? "0"
            : user?.status_key === "banned"
              ? "2"
              : "1",
    });
  }, [effectiveScopeCenterId, form, user]);

  const onSubmit = (values: FormValues) => {
    setFormErrors([]);

    const normalizedPhone = normalizePhone(values.phone);
    const normalizedCountryCode = normalizeCountryCode(values.countryCode);

    if (!isEditMode && !normalizedPhone) {
      form.setError("phone", {
        type: "manual",
        message: t("pages.admins.dialogs.form.validation.phoneRequired"),
      });
      return;
    }

    if (normalizedPhone && !BASE_MOBILE_REGEX.test(normalizedPhone)) {
      form.setError("phone", {
        type: "manual",
        message: t("pages.admins.dialogs.form.validation.phoneInvalid"),
      });
      return;
    }

    if (
      normalizedCountryCode &&
      !COUNTRY_CODE_REGEX.test(normalizedCountryCode)
    ) {
      form.setError("countryCode", {
        type: "manual",
        message: t("pages.admins.dialogs.form.validation.countryCodeInvalid"),
      });
      return;
    }

    const selectedCenterId = values.centerId?.trim() || "";
    const resolvedCenterId = isCenterScoped
      ? effectiveScopeCenterId != null
        ? String(effectiveScopeCenterId)
        : selectedCenterId || null
      : selectedCenterId || null;

    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: normalizedPhone || undefined,
      country_code: normalizedCountryCode || undefined,
      center_id: resolvedCenterId,
      status: Number(values.status),
    };

    if (isEditMode && user) {
      updateMutation.mutate(
        {
          userId: user.id,
          payload,
        },
        {
          onSuccess: (response) => {
            if (!isAdminRequestSuccessful(response)) {
              setFormErrors([
                getAdminResponseMessage(
                  response,
                  t("pages.admins.dialogs.form.errors.saveFailed"),
                ),
              ]);
              return;
            }
            onClose();
            onSuccess?.(
              getAdminResponseMessage(
                response,
                t("pages.admins.dialogs.form.messages.updated"),
              ),
            );
          },
          onError: (error) => setFormErrors(getErrorMessages(error, t)),
        },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (createdUser) => {
        if (!isAdminRequestSuccessful(createdUser)) {
          setFormErrors([
            getAdminResponseMessage(
              createdUser,
              t("pages.admins.dialogs.form.errors.saveFailed"),
            ),
          ]);
          return;
        }
        onClose();
        onSuccess?.(
          getAdminResponseMessage(
            createdUser,
            t("pages.admins.dialogs.form.messages.created"),
          ),
        );
        if (createdUser) {
          onCreated?.(createdUser);
        }
      },
      onError: (error) => setFormErrors(getErrorMessages(error, t)),
    });
  };

  const isSubmitDisabled = isPending || !form.formState.isValid;

  return (
    <div className="grid gap-4">
      <DialogHeader className="space-y-3">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold uppercase text-primary">
            {getInitials(displayName)}
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
              {isEditMode
                ? t("pages.admins.dialogs.form.titleEdit")
                : t("pages.admins.dialogs.form.titleCreate")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isEditMode
                ? t("pages.admins.dialogs.form.descriptionEdit")
                : t("pages.admins.dialogs.form.descriptionCreate")}
            </p>
            <p className="text-xs text-gray-400">
              {displayName} · {displayEmail}
            </p>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap gap-3 pb-3 text-xs">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
            {t("pages.admins.dialogs.form.badges.accountDetails")}
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
            {t("pages.admins.dialogs.form.badges.accountAccess")}
          </span>
        </div>
      </DialogHeader>

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {t("pages.admins.dialogs.form.advanced.title")}
          </p>
          <p className="text-xs text-gray-400">
            {t("pages.admins.dialogs.form.advanced.description")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced((prev) => !prev)}
        >
          {showAdvanced
            ? t("pages.admins.dialogs.form.actions.hideAdvanced")
            : t("pages.admins.dialogs.form.actions.showAdvanced")}
        </Button>
      </div>

      {formErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>
            {t("pages.admins.dialogs.form.errors.errorTitle")}
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
                  {t("pages.admins.dialogs.form.fields.name")}{" "}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t(
                      "pages.admins.dialogs.form.placeholders.name",
                    )}
                    {...field}
                    disabled={isPending}
                  />
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
                <FormLabel>
                  {t("pages.admins.dialogs.form.fields.email")}{" "}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t(
                      "pages.admins.dialogs.form.placeholders.email",
                    )}
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("pages.admins.dialogs.form.fields.phone")}{" "}
                  {!isEditMode ? <span className="text-red-500">*</span> : null}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t(
                      "pages.admins.dialogs.form.placeholders.phone",
                    )}
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <p className="text-xs text-gray-400">
                  {t("pages.admins.dialogs.form.hints.phone")}
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
                    {t("pages.admins.dialogs.form.fields.countryCode")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "pages.admins.dialogs.form.placeholders.countryCode",
                      )}
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          {showAdvanced ? (
            <FormField
              control={form.control}
              name="centerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("pages.admins.dialogs.form.fields.center")}{" "}
                    <span className="text-gray-400">
                      {t("pages.admins.dialogs.form.optionalLabel")}
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
                      allLabel={t("pages.admins.dialogs.form.centerAllLabel")}
                      hideWhenCenterScoped={false}
                      className="w-full min-w-0"
                      selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
                      disabled={isPending || isCenterScoped}
                    />
                  </FormControl>
                  {isCenterScoped ? (
                    <p className="text-xs text-gray-400">
                      {t("pages.admins.dialogs.form.hints.centerScoped", {
                        center:
                          centerName ??
                          t("pages.admins.fallbacks.currentCenter"),
                      })}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      {t("pages.admins.dialogs.form.hints.centerOptional")}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          {showAdvanced ? (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("pages.admins.dialogs.form.fields.status")}
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          {t("pages.admins.table.status.active")}
                        </SelectItem>
                        <SelectItem value="0">
                          {t("pages.admins.table.status.inactive")}
                        </SelectItem>
                        <SelectItem value="2">
                          {t("pages.admins.table.status.banned")}
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
              onClick={onClose}
              disabled={isPending}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isPending
                ? isEditMode
                  ? t("pages.admins.dialogs.form.actions.saving")
                  : t("pages.admins.dialogs.form.actions.sending")
                : isEditMode
                  ? t("pages.admins.dialogs.form.actions.saveChanges")
                  : t("pages.admins.dialogs.form.actions.sendInvite")}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </div>
  );
}
