"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { isAxiosError } from "axios";
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

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .optional()
    .or(z.literal("")),
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

type StudentFormDialogProps = {
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  centerId?: string | number | null;
  student?: Student | null;
  onSuccess?: (_value: string) => void;
  onCreated?: (_student: Student) => void;
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

  return "Unable to save student. Please try again.";
}

export function StudentFormDialog({
  open,
  onOpenChange,
  centerId,
  student,
  onSuccess,
  onCreated,
}: StudentFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isEditMode = Boolean(student);

  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const displayName = student?.name ? String(student.name) : "Student";
  const displayEmail = student?.email ? String(student.email) : "new.student";

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

    setFormError(null);
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
    setFormError(null);

    const normalizedPhone = normalizePhone(values.phone);
    const normalizedCountryCode = normalizeCountryCode(values.countryCode);

    if (!isEditMode && !normalizedPhone) {
      form.setError("phone", {
        type: "manual",
        message: "Phone is required to create a student.",
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
          onSuccess: () => {
            onOpenChange(false);
            onSuccess?.("Student updated successfully.");
          },
          onError: (error) => setFormError(getErrorMessage(error)),
        },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (createdStudent) => {
        onOpenChange(false);
        onSuccess?.("Student created successfully.");
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
      onError: (error) => setFormError(getErrorMessage(error)),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-4rem)] max-w-[640px] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold uppercase text-primary">
              {getInitials(displayName)}
            </div>
            <div className="space-y-1">
              <DialogTitle>
                {isEditMode ? "Edit Student" : "Create Student"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Update student profile and account status."
                  : "Add a new student, then optionally enroll them in a course."}
              </DialogDescription>
              <p className="text-xs text-gray-400">
                {displayName} · {displayEmail}
              </p>
            </div>
          </div>
          <div className="mt-1 flex flex-wrap gap-3 pb-3 text-xs">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
              {isEditMode ? "Student Details" : "1. Student Details"}
            </span>
            {!isEditMode ? (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                2. Optional Enrollment
              </span>
            ) : null}
          </div>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Advanced options
            </p>
            <p className="text-xs text-gray-400">
              Email, country code, and status settings.
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
            <AlertTitle>Could not save student</AlertTitle>
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
                    <Input placeholder="Student name" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="student@example.com" {...field} />
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
                    Phone{" "}
                    {!isEditMode ? (
                      <span className="text-red-500">*</span>
                    ) : null}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="1225291841" {...field} />
                  </FormControl>
                  <p className="text-xs text-gray-400">
                    Base number only (10 digits). Do not include country code or
                    a leading 0.
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
                      <Input placeholder="+20" {...field} />
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
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                  {!isEditMode ? (
                    <p className="text-xs text-gray-400">
                      Optional for platform admins. Leave empty to create a
                      student without a center.
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
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
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
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditMode
                    ? "Saving..."
                    : "Creating..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Student"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
