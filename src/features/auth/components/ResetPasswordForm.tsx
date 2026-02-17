"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import { useAdminPasswordReset } from "@/features/auth/hooks/use-admin-password-reset";
import { Button } from "@/components/ui/button";
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
import { TenantIdentityBadge } from "@/components/ui/tenant-identity-badge";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

type FormValues = z.infer<typeof schema>;

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

function extractErrorMessage(error: unknown) {
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

  return "Unable to reset password. Please try again.";
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const token = useMemo(
    () => searchParams.get("token")?.trim() ?? "",
    [searchParams],
  );
  const email = useMemo(
    () => searchParams.get("email")?.trim() ?? "",
    [searchParams],
  );

  const hasValidLink = Boolean(token) && Boolean(email);

  const mutation = useAdminPasswordReset({
    onSuccess: () => {
      setIsSuccess(true);
      setFormMessage("Password set successfully. Redirecting to login...");

      const params = new URLSearchParams({
        reason: "password_reset",
        email,
      });

      window.setTimeout(() => {
        router.replace(`/login?${params.toString()}`);
      }, 900);
    },
    onError: (error) => {
      setIsSuccess(false);
      setFormMessage(extractErrorMessage(error));
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    setFormMessage(null);
    setIsSuccess(false);
    form.reset({ password: "", confirmPassword: "" });
  }, [email, form, token]);

  const onSubmit = (values: FormValues) => {
    if (!hasValidLink) {
      setIsSuccess(false);
      setFormMessage("Invalid or expired reset link.");
      return;
    }

    setFormMessage(null);
    mutation.mutate({
      token,
      email,
      password: values.password,
    });
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-dark-3 dark:bg-gray-900">
      <TenantIdentityBadge className="mb-6" />

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">
          Set Password
        </h1>
        <p className="text-sm text-dark-6 dark:text-dark-5">
          Create your password to activate your admin account.
        </p>
      </div>

      {formMessage ? (
        <Alert variant={isSuccess ? "default" : "destructive"} className="mt-6">
          <AlertTitle>
            {isSuccess ? "Success" : "Unable to continue"}
          </AlertTitle>
          <AlertDescription>{formMessage}</AlertDescription>
        </Alert>
      ) : null}

      {!hasValidLink ? (
        <div className="mt-6 space-y-4">
          <Alert variant="destructive">
            <AlertTitle>Invalid reset link</AlertTitle>
            <AlertDescription>
              This link is missing required data. Request a new password reset
              email.
            </AlertDescription>
          </Alert>

          <Button className="w-full" onClick={() => router.push("/login")}>
            Back to Login
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 space-y-6"
          >
            <div className="space-y-2">
              <FormLabel>Email</FormLabel>
              <Input value={email} disabled readOnly />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending || isSuccess}
            >
              {mutation.isPending ? "Saving..." : "Set Password"}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
