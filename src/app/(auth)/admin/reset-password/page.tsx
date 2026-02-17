import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set Password",
};

export default function AdminResetPasswordPage() {
  return (
    <div className="w-full max-w-lg">
      <ResetPasswordForm />
    </div>
  );
}
