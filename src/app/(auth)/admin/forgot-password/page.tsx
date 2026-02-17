import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function AdminForgotPasswordPage() {
  return (
    <div className="w-full max-w-lg">
      <ForgotPasswordForm />
    </div>
  );
}
