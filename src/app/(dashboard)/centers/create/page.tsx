"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  useCreateCenter,
  useUploadCenterLogo,
} from "@/features/centers/hooks/use-centers";
import { getCenterApiErrorMessage } from "@/features/centers/lib/api-error";
import {
  CenterProfileForm,
  CenterBrandingForm,
  CenterPrimaryAdminForm,
  type TierValue,
} from "@/features/centers/components/forms";
import { useTranslation } from "@/features/localization";

type CenterType = "branded" | "unbranded";

type ProfileData = {
  name: string;
  slug: string;
  type: CenterType;
  tier: TierValue;
  isFeatured: boolean;
};

export default function CentersCreatePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const createCenterMutation = useCreateCenter();
  const uploadLogoMutation = useUploadCenterLogo();

  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    slug: "",
    type: "unbranded",
    tier: "standard",
    isFeatured: false,
  });
  const [primaryColor, setPrimaryColor] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleProfileDataChange = useCallback((data: ProfileData) => {
    setProfileData(data);
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!profileData.slug.trim()) {
      setErrorMessage(t("pages.centerCreate.validation.slugRequired"));
      return;
    }

    if (profileData.type === "branded" && !primaryColor.trim()) {
      setErrorMessage(t("pages.centerCreate.validation.primaryColorRequired"));
      return;
    }

    if (!adminName.trim() || !adminEmail.trim()) {
      setErrorMessage(t("pages.centerCreate.validation.adminRequired"));
      return;
    }

    setErrorMessage(null);

    createCenterMutation.mutate(
      {
        name: profileData.name.trim(),
        slug: profileData.slug.trim(),
        type: profileData.type,
        tier: profileData.tier,
        is_featured: profileData.isFeatured,
        branding_metadata:
          profileData.type === "branded"
            ? { primary_color: primaryColor.trim() }
            : undefined,
        admin: {
          name: adminName.trim(),
          email: adminEmail.trim(),
        },
      },
      {
        onSuccess: (createdCenter) => {
          if (logoFile && createdCenter?.id != null) {
            uploadLogoMutation.mutate(
              {
                id: createdCenter.id,
                payload: { file: logoFile, filename: logoFile.name },
              },
              {
                onSuccess: () => {
                  router.push("/centers");
                },
                onError: (error) => {
                  setErrorMessage(
                    getCenterApiErrorMessage(
                      error,
                      t("pages.centerCreate.errors.logoUploadFailed"),
                    ),
                  );
                  router.push(`/manage/centers/${createdCenter.id}/settings`);
                },
              },
            );
            return;
          }

          router.push("/centers");
        },
        onError: (error) => {
          setErrorMessage(
            getCenterApiErrorMessage(
              error,
              t("pages.centerCreate.errors.createFailed"),
            ),
          );
        },
      },
    );
  };

  const isPending =
    createCenterMutation.isPending || uploadLogoMutation.isPending;

  const isFormValid =
    profileData.name.trim() &&
    profileData.slug.trim() &&
    adminName.trim() &&
    adminEmail.trim() &&
    (profileData.type !== "branded" || primaryColor.trim());

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.centersPage.addCenter")}
        description={t("pages.centerCreate.description")}
        actions={
          <Link href="/centers">
            <Button variant="outline">{t("common.actions.cancel")}</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle>{t("pages.centerCreate.errors.unable")}</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <CenterProfileForm
              mode="create"
              isPlatformAdmin={true}
              onCreateDataChange={handleProfileDataChange}
            />

            <CenterBrandingForm
              mode="create"
              isPlatformAdmin={true}
              onLogoChange={setLogoFile}
              onPrimaryColorChange={setPrimaryColor}
            />

            <CenterPrimaryAdminForm
              adminName={adminName}
              adminEmail={adminEmail}
              onAdminNameChange={setAdminName}
              onAdminEmailChange={setAdminEmail}
            />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("common.labels.actions")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending || !isFormValid}
                >
                  {isPending
                    ? t("pages.centerCreate.creating")
                    : t("pages.centersPage.addCenter")}
                </Button>
                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                  {t("pages.centerCreate.apiKeyHint")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
