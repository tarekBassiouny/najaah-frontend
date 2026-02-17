"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { useAdminPasswordForgot } from "@/features/auth/hooks/use-admin-password-forgot";
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

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

type FormValues = z.infer<typeof schema>;
type MessageTone = "default" | "destructive";

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

  return "Unable to send reset instructions. Please try again.";
}

export function ForgotPasswordForm() {
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<MessageTone>("default");

  const mutation = useAdminPasswordForgot({
    onSuccess: () => {
      setMessageTone("default");
      setFormMessage(
        "If an account exists for this email, reset instructions have been sent.",
      );
    },
    onError: (error) => {
      setMessageTone("destructive");
      setFormMessage(extractErrorMessage(error));
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    setFormMessage(null);
    mutation.mutate({ email: values.email.trim() });
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-dark-3 dark:bg-gray-900">
      <TenantIdentityBadge className="mb-6" />

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">
          Forgot Password
        </h1>
        <p className="text-sm text-dark-6 dark:text-dark-5">
          Enter your admin email and we will send password reset instructions.
        </p>
      </div>

      {formMessage ? (
        <Alert variant={messageTone} className="mt-6">
          <AlertTitle>
            {messageTone === "default"
              ? "Check your email"
              : "Unable to continue"}
          </AlertTitle>
          <AlertDescription>{formMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    autoComplete="email"
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
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Sending..." : "Send Reset Link"}
          </Button>

          <div className="text-center text-sm">
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 hover:underline"
            >
              Back to login
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
