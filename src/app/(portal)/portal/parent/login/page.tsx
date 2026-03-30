"use client";

import Link from "next/link";
import {
  OtpLoginForm,
  useParentSendOtp,
  useParentVerify,
} from "@/features/portal-auth";
import { useTranslation } from "@/features/localization";

export default function ParentLoginPage() {
  const { t } = useTranslation();

  return (
    <OtpLoginForm
      role="parent"
      redirectPath="/portal/parent"
      useSendOtp={useParentSendOtp}
      useVerify={useParentVerify}
      t={t}
      badge={t("pages.portalAuth.parentLogin.badge")}
      title={t("pages.portalAuth.parentLogin.title")}
      subtitlePhone={t("pages.portalAuth.parentLogin.subtitlePhone")}
      subtitleOtp={t("pages.portalAuth.parentLogin.subtitleOtp")}
      panelEyebrow={t("pages.portalAuth.parentLogin.panelEyebrow")}
      panelTitle={t("pages.portalAuth.parentLogin.panelTitle")}
      panelDescription={t("pages.portalAuth.parentLogin.panelDescription")}
      highlights={[
        t("pages.portalAuth.parentLogin.highlights.one"),
        t("pages.portalAuth.parentLogin.highlights.two"),
        t("pages.portalAuth.parentLogin.highlights.three"),
      ]}
      verifyButtonLabel={t("pages.portalAuth.parentLogin.verifyAndLogin")}
      footer={
        <div className="space-y-2 text-center text-sm text-slate-500">
          <p>
            {t("pages.portalAuth.parentLogin.newParentPrompt")}{" "}
            <Link
              href="/portal/parent/register"
              className="font-semibold text-teal-700 transition-colors hover:text-teal-800"
            >
              {t("pages.portalAuth.parentLogin.registerHere")}
            </Link>
          </p>
          <p>
            {t("pages.portalAuth.parentLogin.studentPrompt")}{" "}
            <Link
              href="/portal/student/login"
              className="font-semibold text-teal-700 transition-colors hover:text-teal-800"
            >
              {t("pages.portalAuth.common.studentLogin")}
            </Link>
          </p>
        </div>
      }
    />
  );
}
