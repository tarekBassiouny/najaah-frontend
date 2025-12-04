"use client";
import { EmailIcon, PasswordIcon } from "@/assets/icons";
import { useAdminLogin } from "@/features/auth/hooks/use-admin-login";
import { useAdminSession } from "@/features/auth/hooks/use-admin-session";
import { type ApiErrorResponse } from "@/types/auth";
import { isAxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import InputGroup from "../FormElements/InputGroup";
import { Checkbox } from "../FormElements/checkbox";
import { Alert } from "../ui-elements/alert";

export default function SigninWithPassword() {
  const [data, setData] = useState({
    email: process.env.NEXT_PUBLIC_DEMO_USER_MAIL || "",
    password: process.env.NEXT_PUBLIC_DEMO_USER_PASS || "",
    remember: false,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  const {
    data: currentUser,
    isFetching: isCheckingSession,
  } = useAdminSession({
    retry: false,
  });

  useEffect(() => {
    if (currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  const loginMutation = useAdminLogin({
    onSuccess: () => {
      setFormError(null);
      router.replace("/dashboard");
    },
    onError: (error) => {
      setFormError(extractErrorMessage(error));
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setFormError(null);
    loginMutation.mutate({
      email: data.email,
      password: data.password,
      remember: data.remember,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <Alert
          variant="error"
          title="Unable to sign in"
          description={formError}
        />
      )}

      <InputGroup
        type="email"
        label="Email"
        className="mb-4 [&_input]:py-[15px]"
        placeholder="Enter your email"
        name="email"
        handleChange={handleChange}
        value={data.email}
        icon={<EmailIcon />}
      />

      <InputGroup
        type="password"
        label="Password"
        className="mb-5 [&_input]:py-[15px]"
        placeholder="Enter your password"
        name="password"
        handleChange={handleChange}
        value={data.password}
        icon={<PasswordIcon />}
      />

      <div className="mb-6 flex items-center justify-between gap-2 py-2 font-medium">
        <Checkbox
          label="Remember me"
          name="remember"
          withIcon="check"
          minimal
          radius="md"
          onChange={(e) =>
            setData({
              ...data,
              remember: e.target.checked,
            })
          }
        />

        <Link
          href="/auth/forgot-password"
          className="hover:text-primary dark:text-white dark:hover:text-primary"
        >
          Forgot Password?
        </Link>
      </div>

      <div className="mb-4.5">
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
          disabled={loginMutation.isPending || isCheckingSession}
        >
          Sign In
          {(loginMutation.isPending || isCheckingSession) && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
          )}
        </button>
      </div>
    </form>
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
