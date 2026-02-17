"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { isAxiosError } from "axios";
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

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || BASE_MOBILE_REGEX.test(normalizePhone(value)),
      "Use base mobile number only (10 digits, no leading 0).",
    ),
  countryCode: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || COUNTRY_CODE_REGEX.test(normalizeCountryCode(value)),
      "Country code must be in +NN format (for example +20).",
    ),
  centerId: z.string().trim().optional(),
  status: z.enum(["1", "0", "2"]),
});

type FormValues = z.infer<typeof schema>;

type AdminUserFormDialogProps = {
  user?: AdminUser | null;
  onSuccess?: (_value: string) => void;
  onClose: () => void;
  onCreated?: (_user: AdminUser) => void;
};

function getFirstValidationMessage(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;

  for (const value of Object.values(details as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      const first = value.find(
        (item) => typeof item === "string" && item.trim(),
      ) as string | undefined;
      if (first) return first;
      continue;
    }

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string;
          errors?: Record<string, string[] | string>;
          error?: {
            code?: string;
            message?: string;
            details?: Record<string, string[] | string>;
          };
        }
      | undefined;

    const validationMessage =
      getFirstValidationMessage(data?.error?.details) ??
      getFirstValidationMessage(data?.errors);

    if (validationMessage) {
      return validationMessage;
    }

    if (typeof data?.error?.message === "string" && data.error.message.trim()) {
      return data.error.message;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  }

  return "Unable to save admin user. Please try again.";
}

export function AdminUserFormDialog({
  user,
  onSuccess,
  onClose,
  onCreated,
}: AdminUserFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isEditMode = Boolean(user);
  const { centerSlug, centerId: tenantCenterId, centerName } = useTenant();
  const isCenterScoped = Boolean(centerSlug);

  const displayName = user?.name ? String(user.name) : "Admin User";
  const displayEmail = user?.email ? String(user.email) : "new.admin@company";

  const createMutation = useCreateAdminUser();
  const updateMutation = useUpdateAdminUser();
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
    setFormError(null);
    setShowAdvanced(false);
    form.reset({
      name: user?.name ? String(user.name) : "",
      email: user?.email ? String(user.email) : "",
      phone: user?.phone ? String(user.phone) : "",
      countryCode: user?.country_code ? String(user.country_code) : "+20",
      centerId:
        user?.center_id != null
          ? String(user.center_id)
          : tenantCenterId != null
            ? String(tenantCenterId)
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
  }, [form, tenantCenterId, user]);

  const onSubmit = (values: FormValues) => {
    setFormError(null);

    const normalizedPhone = normalizePhone(values.phone);
    const normalizedCountryCode = normalizeCountryCode(values.countryCode);

    if (!isEditMode && !normalizedPhone) {
      form.setError("phone", {
        type: "manual",
        message: "Phone is required to create an admin user.",
      });
      return;
    }

    if (normalizedPhone && !BASE_MOBILE_REGEX.test(normalizedPhone)) {
      form.setError("phone", {
        type: "manual",
        message: "Use base mobile number only (10 digits, no leading 0).",
      });
      return;
    }

    if (
      normalizedCountryCode &&
      !COUNTRY_CODE_REGEX.test(normalizedCountryCode)
    ) {
      form.setError("countryCode", {
        type: "manual",
        message: "Country code must be in +NN format (for example +20).",
      });
      return;
    }

    const selectedCenterId = values.centerId?.trim() || "";
    const resolvedCenterId = isCenterScoped
      ? tenantCenterId != null
        ? String(tenantCenterId)
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
          onSuccess: () => {
            onClose();
            onSuccess?.("Admin user updated successfully.");
          },
          onError: (error) => setFormError(getErrorMessage(error)),
        },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (createdUser) => {
        onClose();
        onSuccess?.("Admin invitation sent successfully.");
        if (createdUser) {
          onCreated?.(createdUser);
        }
      },
      onError: (error) => setFormError(getErrorMessage(error)),
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
              {isEditMode ? "Edit Admin User" : "Create Admin User"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isEditMode
                ? "Update admin account details and status."
                : "Create a new admin account."}
            </p>
            <p className="text-xs text-gray-400">
              {displayName} · {displayEmail}
            </p>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap gap-3 pb-3 text-xs">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
            Account Details
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
            Account Access
          </span>
        </div>
      </DialogHeader>

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            Advanced options
          </p>
          <p className="text-xs text-gray-400">
            Center, country code, and status settings.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced((prev) => !prev)}
        >
          {showAdvanced ? "Hide" : "Show"}
        </Button>
      </div>

      {formError && (
        <Alert variant="destructive">
          <AlertTitle>Could not save admin user</AlertTitle>
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
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>
                  Name <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Jane Admin"
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
                  Email <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="jane.admin@example.com"
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
                  Phone{" "}
                  {!isEditMode ? <span className="text-red-500">*</span> : null}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="1225291841"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <p className="text-xs text-gray-400">
                  Base number only (10 digits). Do not include country code or a
                  leading 0.
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
                  <FormLabel>Country code</FormLabel>
                  <FormControl>
                    <Input placeholder="+20" {...field} disabled={isPending} />
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
                    Center <span className="text-gray-400">(optional)</span>
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
                      allLabel="No center (optional)"
                      hideWhenCenterScoped={false}
                      className="w-full min-w-0"
                      selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
                      disabled={isPending || isCenterScoped}
                    />
                  </FormControl>
                  {isCenterScoped ? (
                    <p className="text-xs text-gray-400">
                      Locked to current center: {centerName ?? "Current center"}
                      .
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      Leave empty to create system-level admin without center
                      assignment.
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
                  <FormLabel>Status</FormLabel>
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
                        <SelectItem value="1">Active</SelectItem>
                        <SelectItem value="0">Inactive</SelectItem>
                        <SelectItem value="2">Banned</SelectItem>
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
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isPending
                ? isEditMode
                  ? "Saving..."
                  : "Sending..."
                : isEditMode
                  ? "Save Changes"
                  : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </div>
  );
}
