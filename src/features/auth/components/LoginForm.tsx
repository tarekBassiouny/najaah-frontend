"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAdminLogin } from "@/features/auth/hooks/use-admin-login";
import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { useTranslation } from "@/features/localization";
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

type FormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type MessageTone = "default" | "destructive";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [messageTitle, setMessageTitle] = useState<string>("");
  const [messageTone, setMessageTone] = useState<MessageTone>("destructive");
  const { data: user } = useAdminMe();

  const schema = z.object({
    email: z.string().email(t("forms.validation.email")),
    password: z.string().min(1, t("forms.validation.required")),
    rememberMe: z.boolean().default(false),
  });

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
      setMessageTitle(t("pages.login.unableToSignIn"));
      setFormMessage(extractErrorMessage(error, t));
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
      setMessageTitle(t("pages.login.sessionExpiredTitle"));
      setFormMessage(t("pages.login.sessionExpiredMessage"));
      return;
    }

    if (reason === "password_reset") {
      setMessageTone("default");
      setMessageTitle(t("pages.login.passwordUpdatedTitle"));
      setFormMessage(t("pages.login.passwordUpdatedMessage"));
      return;
    }
  }, [reason, t]);

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
          {t("pages.login.title")}
        </h1>
        <p className="text-sm text-dark-6 dark:text-dark-5">
          {t("pages.login.subtitle")}
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
                <FormLabel>{t("pages.login.email")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("pages.login.emailPlaceholder")}
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
                <FormLabel>{t("pages.login.password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("pages.login.passwordPlaceholder")}
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
                      {t("pages.login.rememberMe")}
                    </FormLabel>
                  </div>

                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:text-primary/80 hover:underline"
                  >
                    {t("pages.login.forgotPassword")}
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
            {loginMutation.isPending
              ? t("pages.login.signingIn")
              : t("pages.login.signIn")}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function extractErrorMessage(
  error: unknown,
  t: (_key: string) => string,
): string {
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
      return t("pages.login.invalidCredentials");
    }
  }

  return t("pages.login.genericError");
}
