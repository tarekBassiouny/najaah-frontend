"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { isAxiosError } from "axios";
import { z } from "zod";
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
import {
  useCreateAdminUser,
  useUpdateAdminUser,
} from "@/features/admin-users/hooks/use-admin-users";
import type { AdminUser } from "@/features/admin-users/types/admin-user";

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
  phone: z.string().trim().optional(),
  centerId: z.string().trim().optional(),
  password: z.string().trim().optional(),
  status: z.enum(["1", "0", "2"]),
});

type FormValues = z.infer<typeof schema>;

type AdminUserFormDialogProps = {
  user?: AdminUser | null;
  onSuccess?: (_value: string) => void;
  onClose: () => void;
  onCreated?: (_user: AdminUser) => void;
};

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (data?.errors && typeof data.errors === "object") {
      const firstEntry = Object.values(data.errors)[0];
      if (Array.isArray(firstEntry) && firstEntry.length > 0) {
        return firstEntry[0];
      }
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
  const isEditMode = Boolean(user);
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
      centerId: "",
      password: "",
      status: "1",
    },
  });

  useEffect(() => {
    setFormError(null);
    form.reset({
      name: user?.name ? String(user.name) : "",
      email: user?.email ? String(user.email) : "",
      phone: user?.phone ? String(user.phone) : "",
      centerId: user?.center_id ? String(user.center_id) : "",
      password: "",
      status:
        user?.status != null && ["0", "1", "2"].includes(String(user.status))
          ? (String(user.status) as "0" | "1" | "2")
          : user?.status_key === "inactive"
            ? "0"
            : user?.status_key === "banned"
              ? "2"
              : "1",
    });
  }, [form, user]);

  const onSubmit = (values: FormValues) => {
    setFormError(null);

    if (!isEditMode && !values.password) {
      form.setError("password", {
        message: "Password is required when creating an admin user.",
      });
      return;
    }

    const payload = {
      name: values.name,
      email: values.email,
      phone: values.phone || undefined,
      center_id: values.centerId || undefined,
      password: values.password || undefined,
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
        onSuccess?.("Admin user created successfully.");
        if (createdUser) {
          onCreated?.(createdUser);
        }
      },
      onError: (error) => setFormError(getErrorMessage(error)),
    });
  };

  const passwordValue = form.watch("password");
  const isSubmitDisabled =
    isPending ||
    !form.formState.isValid ||
    (!isEditMode && !passwordValue?.trim());

  return (
    <>
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
                ? "Update admin account details."
                : "Create a new admin account and assign it later to roles."}
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
            Security & Status
          </span>
        </div>
      </DialogHeader>

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
                <FormLabel>Name</FormLabel>
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
                <FormLabel>Email</FormLabel>
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
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="19990000003"
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
            name="centerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Center ID</FormLabel>
                <FormControl>
                  <Input placeholder="12" {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Password {isEditMode ? "(optional)" : "*"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="secret123"
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
                  : "Creating..."
                : isEditMode
                  ? "Save Changes"
                  : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
