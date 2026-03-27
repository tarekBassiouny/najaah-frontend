"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParentRegister } from "@/features/portal-auth/hooks/use-parent-register";
import { useParentVerify } from "@/features/portal-auth/hooks/use-parent-verify";
import { portalTokenStorage } from "@/lib/portal-token-storage";
import { extractPortalErrorMessage } from "@/features/portal-auth/lib/extract-portal-error";
import { usePortalAuth } from "@/features/portal-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "@/features/localization";
import Link from "next/link";

const registerSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^(?=.*\d)[+\d()\s-]{6,20}$/, "Enter a valid phone number"),
  country_code: z
    .string()
    .trim()
    .regex(/^[+\d][+\d\s-]{0,7}$/, "Enter a valid country code"),
});

const otpSchema = z.object({
  otp: z.string().min(4, "Enter the OTP code"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

type Step = "register" | "otp";

export default function ParentRegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, user } = usePortalAuth();
  const [step, setStep] = useState<Step>("register");
  const [otpToken, setOtpToken] = useState("");
  const [autoLinked, setAutoLinked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect authenticated parents away from register
  useEffect(() => {
    if (isAuthenticated && user?.is_parent) {
      router.replace("/portal/parent");
    }
  }, [isAuthenticated, user, router]);

  const register = useParentRegister();
  const verify = useParentVerify();

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { phone: "", country_code: "+20" },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const handleRegister = (values: RegisterFormValues) => {
    setError(null);
    portalTokenStorage.setRememberMe(true);
    register.mutate(
      {
        phone: values.phone,
        country_code: values.country_code,
      },
      {
        onSuccess: (data) => {
          setOtpToken(data.token);
          setAutoLinked(data.auto_linked);
          setStep("otp");
        },
        onError: (err) => {
          setError(extractPortalErrorMessage(err));
        },
      },
    );
  };

  const handleVerify = (values: OtpFormValues) => {
    setError(null);
    verify.mutate(
      {
        otp: values.otp,
        token: otpToken,
      },
      {
        onSuccess: () => {
          router.replace("/portal/parent");
        },
        onError: (err) => {
          setError(extractPortalErrorMessage(err));
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-dark-3 dark:bg-gray-900">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-dark dark:text-white">
            {t("pages.portalAuth.parentRegister.title")}
          </h1>
          <p className="text-sm text-dark-6 dark:text-dark-5">
            {step === "register"
              ? t("pages.portalAuth.parentRegister.subtitleRegister")
              : t("pages.portalAuth.parentRegister.subtitleOtp")}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "otp" && autoLinked && (
          <Alert className="mt-6">
            <AlertDescription>
              {t("pages.portalAuth.parentRegister.autoLinked")}
            </AlertDescription>
          </Alert>
        )}

        {step === "register" && (
          <Form {...registerForm}>
            <form
              onSubmit={registerForm.handleSubmit(handleRegister)}
              className="mt-6 space-y-6"
            >
              <FormField
                control={registerForm.control}
                name="country_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("pages.portalAuth.common.countryCode")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "pages.portalAuth.common.countryCodePlaceholder",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("pages.portalAuth.common.phoneNumber")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder={t(
                          "pages.portalAuth.common.phonePlaceholder",
                        )}
                        autoComplete="tel"
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
                disabled={register.isPending}
              >
                {register.isPending
                  ? t("pages.portalAuth.parentRegister.registering")
                  : t("pages.portalAuth.parentRegister.registerAndSend")}
              </Button>

              <p className="text-center text-sm text-dark-6 dark:text-dark-5">
                {t("pages.portalAuth.parentRegister.alreadyRegistered")}{" "}
                <Link
                  href="/portal/parent/login"
                  className="font-medium text-primary hover:underline"
                >
                  {t("pages.portalAuth.parentRegister.loginHere")}
                </Link>
              </p>
            </form>
          </Form>
        )}

        {step === "otp" && (
          <Form {...otpForm}>
            <form
              onSubmit={otpForm.handleSubmit(handleVerify)}
              className="mt-6 space-y-6"
            >
              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("pages.portalAuth.common.verificationCode")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder={t(
                          "pages.portalAuth.common.otpPlaceholder",
                        )}
                        autoComplete="one-time-code"
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
                disabled={verify.isPending}
              >
                {verify.isPending
                  ? t("pages.portalAuth.common.verifying")
                  : t("pages.portalAuth.parentRegister.verifyAndComplete")}
              </Button>

              <button
                type="button"
                className="w-full text-center text-sm text-primary hover:underline"
                onClick={() => {
                  setStep("register");
                  setError(null);
                  otpForm.reset();
                }}
              >
                {t("pages.portalAuth.parentRegister.backToRegister")}
              </button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
