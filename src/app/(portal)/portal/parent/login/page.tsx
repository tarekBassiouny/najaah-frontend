"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParentSendOtp } from "@/features/portal-auth/hooks/use-parent-send-otp";
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

export default function ParentLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = usePortalAuth();
  const [step, setStep] = useState<Step>("phone");
  const [otpToken, setOtpToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reason = searchParams.get("reason");

  // Redirect authenticated parents away from login
  useEffect(() => {
    if (isAuthenticated && user?.is_parent) {
      router.replace("/portal/parent");
    }
  }, [isAuthenticated, user, router]);

  const sendOtp = useParentSendOtp();
  const verify = useParentVerify();

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
            Parent Login
          </h1>
          <p className="text-sm text-dark-6 dark:text-dark-5">
            {step === "phone"
              ? "Enter your phone number to receive a verification code"
              : "Enter the verification code sent to your phone"}
          </p>
        </div>

        {(error || reason === "session_expired") && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>
              {error || "Your session has expired. Please log in again."}
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
                    <FormLabel>Country Code</FormLabel>
                    <FormControl>
                      <Input placeholder="+20 or 0020" {...field} />
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="01012345678 or +201012345678"
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
                          id="parentRememberMe"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-dark-3 dark:bg-dark-2"
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="parentRememberMe"
                        className="!mt-0 cursor-pointer text-sm font-normal"
                      >
                        Remember me
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
                {sendOtp.isPending ? "Sending..." : "Send Verification Code"}
              </Button>

              <div className="space-y-2 text-center text-sm text-dark-6 dark:text-dark-5">
                <p>
                  New parent?{" "}
                  <Link
                    href="/portal/parent/register"
                    className="font-medium text-primary hover:underline"
                  >
                    Register here
                  </Link>
                </p>
                <p>
                  Are you a student?{" "}
                  <Link
                    href="/portal/student/login"
                    className="font-medium text-primary hover:underline"
                  >
                    Student Login
                  </Link>
                </p>
              </div>
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
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter OTP"
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
                {verify.isPending ? "Verifying..." : "Verify & Login"}
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
                Back to phone number
              </button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
