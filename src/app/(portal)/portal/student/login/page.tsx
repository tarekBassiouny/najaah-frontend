"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStudentSendOtp } from "@/features/portal-auth/hooks/use-student-send-otp";
import {
  useStudentVerify,
  getStoredDeviceUuid,
} from "@/features/portal-auth/hooks/use-student-verify";
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

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^(?=.*\d)[+\d()\s-]{6,20}$/, "Enter a valid phone number"),
  country_code: z
    .string()
    .trim()
    .regex(/^[+\d][+\d\s-]{0,7}$/, "Enter a valid country code"),
  rememberMe: z.boolean().default(false),
});

const otpSchema = z.object({
  otp: z.string().min(4, "Enter the OTP code"),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

type Step = "phone" | "otp";

function getBrowserInfo() {
  if (typeof navigator === "undefined") return {};
  const ua = navigator.userAgent;
  let os = "Unknown";
  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return {
    device_name: `Web Browser`,
    device_os: os,
  };
}

export default function StudentLoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = usePortalAuth();
  const [step, setStep] = useState<Step>("phone");
  const [otpToken, setOtpToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reason = searchParams.get("reason");
  const returnUrl = searchParams.get("returnUrl") || "/portal/student";

  // Redirect authenticated students away from login
  useEffect(() => {
    if (isAuthenticated && user?.is_student) {
      router.replace(returnUrl);
    }
  }, [isAuthenticated, user, router, returnUrl]);

  const sendOtp = useStudentSendOtp();
  const verify = useStudentVerify();

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "", country_code: "+20", rememberMe: false },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const handleSendOtp = (values: PhoneFormValues) => {
    setError(null);
    portalTokenStorage.setRememberMe(values.rememberMe);
    sendOtp.mutate(
      {
        phone: values.phone,
        country_code: values.country_code,
      },
      {
        onSuccess: (data) => {
          setOtpToken(data.token);
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
    const deviceUuid = getStoredDeviceUuid();
    const browserInfo = getBrowserInfo();

    verify.mutate(
      {
        otp: values.otp,
        token: otpToken,
        ...(deviceUuid ? { device_uuid: deviceUuid } : {}),
        ...browserInfo,
      },
      {
        onSuccess: () => {
          router.replace(returnUrl);
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
            {t("pages.portalAuth.studentLogin.title")}
          </h1>
          <p className="text-sm text-dark-6 dark:text-dark-5">
            {step === "phone"
              ? t("pages.portalAuth.studentLogin.subtitlePhone")
              : t("pages.portalAuth.studentLogin.subtitleOtp")}
          </p>
        </div>

        {(error || reason === "session_expired") && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>
              {error || t("pages.portalAuth.common.sessionExpired")}
            </AlertDescription>
          </Alert>
        )}

        {step === "phone" && (
          <Form {...phoneForm}>
            <form
              onSubmit={phoneForm.handleSubmit(handleSendOtp)}
              className="mt-6 space-y-6"
            >
              <FormField
                control={phoneForm.control}
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
                control={phoneForm.control}
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

              <FormField
                control={phoneForm.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="space-y-0">
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
                        {t("pages.portalAuth.common.rememberMe")}
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={sendOtp.isPending}
              >
                {sendOtp.isPending
                  ? t("pages.portalAuth.common.sending")
                  : t("pages.portalAuth.common.sendVerificationCode")}
              </Button>

              <p className="text-center text-sm text-dark-6 dark:text-dark-5">
                {t("pages.portalAuth.studentLogin.parentPrompt")}{" "}
                <Link
                  href="/portal/parent/login"
                  className="font-medium text-primary hover:underline"
                >
                  {t("pages.portalAuth.common.parentLogin")}
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
                  : t("pages.portalAuth.studentLogin.verifyAndLogin")}
              </Button>

              <button
                type="button"
                className="w-full text-center text-sm text-primary hover:underline"
                onClick={() => {
                  setStep("phone");
                  setError(null);
                  otpForm.reset();
                }}
              >
                {t("pages.portalAuth.common.backToPhone")}
              </button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
