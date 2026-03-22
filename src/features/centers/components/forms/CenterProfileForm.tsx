"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUpdateCenter } from "@/features/centers/hooks/use-centers";
import { getCenterApiErrorMessage } from "@/features/centers/lib/api-error";
import type { Center, CenterTierValue } from "@/features/centers/types/center";
import { useTranslation } from "@/features/localization";

type TierValue = "standard" | "premium" | "vip";

type CenterProfileFormProps = {
  center?: Center | null;
  mode: "create" | "edit";
  isPlatformAdmin: boolean;
  onCreateDataChange?: (_data: {
    name: string;
    slug: string;
    type: "branded" | "unbranded";
    tier: TierValue;
    isFeatured: boolean;
  }) => void;
};

function resolveTier(value: CenterTierValue | undefined): TierValue {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (raw === "premium") return "premium";
  if (raw === "vip") return "vip";
  return "standard";
}

function getCenterTypeLabel(
  value: unknown,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  return String(value ?? "")
    .trim()
    .toLowerCase() === "branded"
    ? t("pages.centerSettings.forms.profile.options.type.branded")
    : t("pages.centerSettings.forms.profile.options.type.unbranded");
}

function getTierLabel(
  value: CenterTierValue | undefined,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  switch (resolveTier(value)) {
    case "premium":
      return t("pages.centerSettings.forms.profile.options.tier.premium");
    case "vip":
      return t("pages.centerSettings.forms.profile.options.tier.vip");
    default:
      return t("pages.centerSettings.forms.profile.options.tier.standard");
  }
}

export function CenterProfileForm({
  center,
  mode,
  isPlatformAdmin,
  onCreateDataChange,
}: CenterProfileFormProps) {
  const { t } = useTranslation();

  const updateCenterMutation = useUpdateCenter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<"branded" | "unbranded">("unbranded");
  const [tier, setTier] = useState<TierValue>("standard");
  const [isFeatured, setIsFeatured] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isCreate = mode === "create";

  useEffect(() => {
    if (!center || isCreate) return;

    setName(center.name ?? "");
    setSlug(center.slug ?? "");
    setType(center.type === "branded" ? "branded" : "unbranded");
    setTier(resolveTier(center.tier));
    setIsFeatured(Boolean(center.is_featured));
  }, [center, isCreate]);

  useEffect(() => {
    if (!isCreate || !onCreateDataChange) return;
    onCreateDataChange({ name, slug, type, tier, isFeatured });
  }, [name, slug, type, tier, isFeatured, isCreate, onCreateDataChange]);

  const generateSlug = () => {
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(generatedSlug);
  };

  const handleSave = () => {
    if (!center) return;

    if (!name.trim()) {
      setSaveError(
        t("pages.centerSettings.forms.profile.validation.nameRequired"),
      );
      return;
    }

    setSaveError(null);

    updateCenterMutation.mutate(
      {
        id: center.id,
        payload: {
          name: name.trim(),
          tier,
          is_featured: isFeatured,
        },
      },
      {
        onError: (error) => {
          setSaveError(
            getCenterApiErrorMessage(
              error,
              t("pages.centerSettings.forms.profile.errors.fallback"),
            ),
          );
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t(
            isCreate
              ? "pages.centerSettings.forms.profile.titleCreate"
              : "pages.centerSettings.forms.profile.titleEdit",
          )}
        </CardTitle>
        <CardDescription>
          {t(
            isCreate
              ? "pages.centerSettings.forms.profile.descriptionCreate"
              : "pages.centerSettings.forms.profile.descriptionEdit",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {saveError ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t("pages.centerSettings.forms.profile.errorTitle")}
            </AlertTitle>
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="center-name">
            {t("pages.centerSettings.forms.profile.fields.name.label")}
            {isCreate ? "*" : ""}
          </Label>
          {isPlatformAdmin ? (
            <Input
              id="center-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t(
                "pages.centerSettings.forms.profile.fields.name.placeholder",
              )}
              required={isCreate}
              className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            />
          ) : (
            <Input
              value={name}
              disabled
              className="h-10 bg-gray-50 dark:bg-gray-900/60"
            />
          )}
        </div>

        {isCreate ? (
          <div className="space-y-2">
            <Label htmlFor="center-slug">
              {t("pages.centerSettings.forms.profile.fields.slug.label")}
            </Label>
            <div className="flex gap-2">
              <Input
                id="center-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder={t(
                  "pages.centerSettings.forms.profile.fields.slug.placeholder",
                )}
                required
                className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateSlug}
                disabled={!name}
              >
                {t("pages.centerSettings.forms.profile.actions.generateSlug")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                {t("pages.centerSettings.forms.profile.fields.slug.label")}
              </Label>
              <Input
                value={center?.slug ?? ""}
                disabled
                className="h-10 bg-gray-50 dark:bg-gray-900/60"
              />
            </div>
            <div className="space-y-2">
              <Label>
                {t("pages.centerSettings.forms.profile.fields.type.label")}
              </Label>
              <Input
                value={getCenterTypeLabel(center?.type, t)}
                disabled
                className="h-10 bg-gray-50 dark:bg-gray-900/60"
              />
            </div>
          </div>
        )}

        {isCreate && isPlatformAdmin ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                {t("pages.centerSettings.forms.profile.fields.type.label")}
              </Label>
              <Select
                value={type}
                onValueChange={(value) =>
                  setType(value as "branded" | "unbranded")
                }
              >
                <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unbranded">
                    {t(
                      "pages.centerSettings.forms.profile.options.type.unbranded",
                    )}
                  </SelectItem>
                  <SelectItem value="branded">
                    {t(
                      "pages.centerSettings.forms.profile.options.type.branded",
                    )}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {t("pages.centerSettings.forms.profile.fields.tier.label")}
              </Label>
              <Select
                value={tier}
                onValueChange={(value) => setTier(value as TierValue)}
              >
                <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">
                    {t(
                      "pages.centerSettings.forms.profile.options.tier.standard",
                    )}
                  </SelectItem>
                  <SelectItem value="premium">
                    {t(
                      "pages.centerSettings.forms.profile.options.tier.premium",
                    )}
                  </SelectItem>
                  <SelectItem value="vip">
                    {t("pages.centerSettings.forms.profile.options.tier.vip")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

        {!isCreate && isPlatformAdmin ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>
                {t("pages.centerSettings.forms.profile.fields.tier.label")}
              </Label>
              <Select
                value={tier}
                onValueChange={(value) => setTier(value as TierValue)}
              >
                <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">
                    {t(
                      "pages.centerSettings.forms.profile.options.tier.standard",
                    )}
                  </SelectItem>
                  <SelectItem value="premium">
                    {t(
                      "pages.centerSettings.forms.profile.options.tier.premium",
                    )}
                  </SelectItem>
                  <SelectItem value="vip">
                    {t("pages.centerSettings.forms.profile.options.tier.vip")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {t("pages.centerSettings.forms.profile.fields.featured.label")}
              </Label>
              <label className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(event) => setIsFeatured(event.target.checked)}
                />
                {t(
                  "pages.centerSettings.forms.profile.fields.featured.checkbox",
                )}
              </label>
            </div>
          </div>
        ) : null}

        {!isCreate && !isPlatformAdmin ? (
          <div className="space-y-2">
            <Label>
              {t("pages.centerSettings.forms.profile.fields.tier.label")}
            </Label>
            <Input
              value={getTierLabel(center?.tier, t)}
              disabled
              className="h-10 bg-gray-50 dark:bg-gray-900/60"
            />
          </div>
        ) : null}

        {isCreate && isPlatformAdmin ? (
          <div className="space-y-2">
            <Label>
              {t("pages.centerSettings.forms.profile.fields.featured.label")}
            </Label>
            <label className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(event) => setIsFeatured(event.target.checked)}
              />
              {t("pages.centerSettings.forms.profile.fields.featured.checkbox")}
            </label>
          </div>
        ) : null}

        {!isCreate && isPlatformAdmin ? (
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateCenterMutation.isPending}
            >
              {updateCenterMutation.isPending
                ? t("pages.centerSettings.forms.profile.actions.saving")
                : t("pages.centerSettings.forms.profile.actions.save")}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { type TierValue };
