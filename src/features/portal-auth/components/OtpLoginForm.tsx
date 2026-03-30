"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseMutationResult } from "@tanstack/react-query";
import { portalTokenStorage } from "@/lib/portal-token-storage";
import { extractPortalErrorMessage } from "../lib/extract-portal-error";
import { usePortalAuth } from "../context/portal-auth-context";
import { getStoredDeviceUuid } from "../hooks/use-student-verify";
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
import { PortalAuthShell } from "./PortalAuthShell";
import type {
  ParentVerifyResponse,
  PortalRole,
  SendOtpRequest,
  SendOtpResponse,
  StudentVerifyResponse,
  VerifyOtpRequest,
} from "../types/portal-auth";

function createPhoneSchema(t: (_key: string) => string) {
  return z.object({
    phone: z
      .string()
      .trim()
      .regex(
        /^(?=.*\d)[+\d()\s-]{6,20}$/,
        t("pages.portalAuth.validation.invalidPhone"),
      ),
    country_code: z
      .string()
      .trim()
      .regex(
        /^[+\d][+\d\s-]{0,7}$/,
        t("pages.portalAuth.validation.invalidCountryCode"),
      ),
    rememberMe: z.boolean().default(false),
  });
}

function createOtpSchema(t: (_key: string) => string) {
  return z.object({
    otp: z.string().min(4, t("pages.portalAuth.validation.invalidOtp")),
  });
}

type PhoneFormValues = z.infer<ReturnType<typeof createPhoneSchema>>;
type OtpFormValues = z.infer<ReturnType<typeof createOtpSchema>>;
type Step = "phone" | "otp";
type VerifyResponse = StudentVerifyResponse | ParentVerifyResponse;
type UseSendOtpHook = () => UseMutationResult<
  SendOtpResponse,
  Error,
  SendOtpRequest
>;
type UseVerifyHook = () => UseMutationResult<
  VerifyResponse,
  Error,
  VerifyOtpRequest
>;

type OtpLoginFormProps = {
  role: PortalRole;
  redirectPath: string;
  allowReturnUrl?: boolean;
  includeDeviceInfo?: boolean;
  useSendOtp: UseSendOtpHook;
  useVerify: UseVerifyHook;
  footer?: ReactNode;
  badge: string;
  title: string;
  subtitlePhone: string;
  subtitleOtp: string;
  panelEyebrow: string;
  panelTitle: string;
  panelDescription: string;
  highlights: string[];
  verifyButtonLabel: string;
  t: (_key: string) => string;
};

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
    device_name: "Web Browser",
    device_os: os,
  };
}

export function OtpLoginForm({
  role,
  redirectPath,
  allowReturnUrl = false,
  includeDeviceInfo = false,
  useSendOtp,
  useVerify,
  footer,
  badge,
  title,
  subtitlePhone,
  subtitleOtp,
  panelEyebrow,
  panelTitle,
  panelDescription,
  highlights,
  verifyButtonLabel,
  t,
}: OtpLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = usePortalAuth();
  const [step, setStep] = useState<Step>("phone");
  const [otpToken, setOtpToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useSendOtp();
  const verify = useVerify();
  const reason = searchParams.get("reason");
  const destination = allowReturnUrl
    ? searchParams.get("returnUrl") || redirectPath
    : redirectPath;

  useEffect(() => {
    const hasRole = role === "student" ? user?.is_student : user?.is_parent;
    if (isAuthenticated && hasRole) {
      router.replace(destination);
    }
  }, [destination, isAuthenticated, role, router, user]);

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(createPhoneSchema(t)),
    defaultValues: { phone: "", country_code: "+20", rememberMe: false },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(createOtpSchema(t)),
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

    const storedDeviceUuid = includeDeviceInfo ? getStoredDeviceUuid() : null;
    const verifyPayload: VerifyOtpRequest = {
      otp: values.otp,
      token: otpToken,
      ...(includeDeviceInfo ? getBrowserInfo() : {}),
      ...(storedDeviceUuid ? { device_uuid: storedDeviceUuid } : {}),
    };

    verify.mutate(verifyPayload, {
      onSuccess: () => {
        router.replace(destination);
      },
      onError: (err) => {
        setError(extractPortalErrorMessage(err));
      },
    });
  };

  return (
    <PortalAuthShell
      badge={badge}
      title={title}
      subtitle={step === "phone" ? subtitlePhone : subtitleOtp}
      panelEyebrow={panelEyebrow}
      panelTitle={panelTitle}
      panelDescription={panelDescription}
      highlights={highlights}
      footer={footer}
    >
      {(error || reason === "session_expired") && (
        <Alert className="mb-6 border-red-100 bg-red-50 text-red-700">
          <AlertDescription>
            {error || t("pages.portalAuth.common.sessionExpired")}
          </AlertDescription>
        </Alert>
      )}

      {step === "phone" && (
        <Form {...phoneForm}>
          <form
            onSubmit={phoneForm.handleSubmit(handleSendOtp)}
            className="space-y-5"
          >
            <div className="grid gap-4 md:grid-cols-[140px_minmax(0,1fr)]">
              <FormField
                control={phoneForm.control}
                name="country_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">
                      {t("pages.portalAuth.common.countryCode")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm shadow-none focus-visible:bg-white"
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
                    <FormLabel className="text-sm font-semibold text-slate-700">
                      {t("pages.portalAuth.common.phoneNumber")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm shadow-none focus-visible:bg-white"
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
            </div>

            <FormField
              control={phoneForm.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="space-y-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        id={`${role}RememberMe`}
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                      />
                    </FormControl>
                    <FormLabel
                      htmlFor={`${role}RememberMe`}
                      className="!mt-0 cursor-pointer text-sm font-medium text-slate-600"
                    >
                      {t("pages.portalAuth.common.rememberMe")}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-teal-700 text-sm font-semibold hover:bg-teal-800"
              disabled={sendOtp.isPending}
            >
              {sendOtp.isPending
                ? t("pages.portalAuth.common.sending")
                : t("pages.portalAuth.common.sendVerificationCode")}
            </Button>
          </form>
        </Form>
      )}

      {step === "otp" && (
        <Form {...otpForm}>
          <form
            onSubmit={otpForm.handleSubmit(handleVerify)}
            className="space-y-5"
          >
            <FormField
              control={otpForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700">
                    {t("pages.portalAuth.common.verificationCode")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      className="h-14 rounded-2xl border-slate-200 bg-slate-50 px-4 text-center text-lg tracking-[0.35em] shadow-none focus-visible:bg-white"
                      placeholder={t("pages.portalAuth.common.otpPlaceholder")}
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
              className="h-12 w-full rounded-2xl bg-teal-700 text-sm font-semibold hover:bg-teal-800"
              disabled={verify.isPending}
            >
              {verify.isPending
                ? t("pages.portalAuth.common.verifying")
                : verifyButtonLabel}
            </Button>

            <button
              type="button"
              className="w-full text-center text-sm font-medium text-slate-500 transition-colors hover:text-teal-700"
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
    </PortalAuthShell>
  );
}
