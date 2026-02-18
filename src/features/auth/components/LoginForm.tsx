"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAdminLogin } from "@/features/auth/hooks/use-admin-login";
import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { isAxiosError } from "axios";
import { type ApiErrorResponse } from "@/types/auth";
import { getAdminScope, getCenterAdminHomeUrl } from "@/lib/user-scope";
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
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;
type MessageTone = "default" | "destructive";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [messageTitle, setMessageTitle] = useState<string>("Unable to sign in");
  const [messageTone, setMessageTone] = useState<MessageTone>("destructive");
  const { data: user } = useAdminMe();
  const loginMutation = useAdminLogin({
    onSuccess: (result) => {
      setFormMessage(null);
      const scope = getAdminScope(result.user);
      if (scope.isCenterAdmin && scope.centerId) {
        router.push(getCenterAdminHomeUrl(scope.centerId));
      } else {
        router.push("/dashboard");
      }
    },
    onError: (error) => {
      setMessageTone("destructive");
      setMessageTitle("Unable to sign in");
      setFormMessage(extractErrorMessage(error));
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const reason = searchParams.get("reason");
  const emailFromQuery = searchParams.get("email") ?? "";

  useEffect(() => {
    if (emailFromQuery) {
      form.setValue("email", emailFromQuery, {
        shouldDirty: false,
        shouldTouch: false,
      });
    }
  }, [emailFromQuery, form]);

  useEffect(() => {
    if (reason === "session_expired") {
      setMessageTone("default");
      setMessageTitle("Session expired");
      setFormMessage("Your session expired. Please sign in again.");
      return;
    }

    if (reason === "password_reset") {
      setMessageTone("default");
      setMessageTitle("Password updated");
      setFormMessage(
        "Password set successfully. Sign in with your new password.",
      );
      return;
    }
  }, [reason]);

  useEffect(() => {
    if (!user) return;
    const scope = getAdminScope(user);
    if (scope.isCenterAdmin && scope.centerId) {
      router.replace(getCenterAdminHomeUrl(scope.centerId));
    } else {
      router.replace("/dashboard");
    }
  }, [router, user]);

  const onSubmit = (values: FormValues) => {
    setFormMessage(null);
    loginMutation.mutate({
      email: values.email,
      password: values.password,
      remember: values.rememberMe,
    });
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-dark-3 dark:bg-gray-900">
      <TenantIdentityBadge className="mb-6" />

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">
          Admin Login
        </h1>
        <p className="text-sm text-dark-6 dark:text-dark-5">
          Sign in to manage the LMS admin panel.
        </p>
      </div>

      {formMessage && (
        <Alert variant={messageTone} className="mt-6">
          <AlertTitle>{messageTitle}</AlertTitle>
          <AlertDescription>{formMessage}</AlertDescription>
        </Alert>
      )}

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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        id="rememberMe"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-dark-3 dark:bg-dark-2"
                      />
                    </FormControl>
                    <FormLabel
                      htmlFor="rememberMe"
                      className="!mt-0 cursor-pointer text-sm font-normal"
                    >
                      Remember me for 30 days
                    </FormLabel>
                  </div>

                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:text-primary/80 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function extractErrorMessage(error: unknown) {
  if (isAxiosError<ApiErrorResponse>(error)) {
    const responseMessage =
      error.response?.data?.message || error.response?.data?.errors;
    if (typeof responseMessage === "string") {
      return responseMessage;
    }

    if (responseMessage && typeof responseMessage === "object") {
      const first = Object.values(responseMessage)[0];
      if (Array.isArray(first) && first.length > 0) {
        return first[0];
      }
    }

    if (error.response?.status === 401) {
      return "Invalid credentials. Please check your email and password.";
    }
  }

  return "Something went wrong while signing in. Please try again.";
}
