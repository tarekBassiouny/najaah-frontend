"use client";

import Link from "next/link";
import {
  OtpLoginForm,
  useStudentSendOtp,
  useStudentVerify,
} from "@/features/portal-auth";
import { useTranslation } from "@/features/localization";

export default function StudentLoginPage() {
  const { t } = useTranslation();

  return (
    <OtpLoginForm
      role="student"
      redirectPath="/portal/student"
      allowReturnUrl
      includeDeviceInfo
      useSendOtp={useStudentSendOtp}
      useVerify={useStudentVerify}
      t={t}
      badge={t("pages.portalAuth.studentLogin.badge")}
      title={t("pages.portalAuth.studentLogin.title")}
      subtitlePhone={t("pages.portalAuth.studentLogin.subtitlePhone")}
      subtitleOtp={t("pages.portalAuth.studentLogin.subtitleOtp")}
      panelEyebrow={t("pages.portalAuth.studentLogin.panelEyebrow")}
      panelTitle={t("pages.portalAuth.studentLogin.panelTitle")}
      panelDescription={t("pages.portalAuth.studentLogin.panelDescription")}
      highlights={[
        t("pages.portalAuth.studentLogin.highlights.one"),
        t("pages.portalAuth.studentLogin.highlights.two"),
        t("pages.portalAuth.studentLogin.highlights.three"),
      ]}
      verifyButtonLabel={t("pages.portalAuth.studentLogin.verifyAndLogin")}
      footer={
        <p className="text-center text-sm text-slate-500">
          {t("pages.portalAuth.studentLogin.parentPrompt")}{" "}
          <Link
            href="/portal/parent/login"
            className="font-semibold text-teal-700 transition-colors hover:text-teal-800"
          >
            {t("pages.portalAuth.common.parentLogin")}
          </Link>
        </p>
      }
    />
  );
}
