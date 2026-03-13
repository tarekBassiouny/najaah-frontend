"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useModal } from "@/components/ui/modal-store";
import {
  useLearningAsset,
  useUpdateLearningAsset,
  useUpdateLearningAssetStatus,
} from "@/features/learning-assets/hooks/use-learning-assets";
import { useTranslation } from "@/features/localization";
import { getAdminApiErrorMessage } from "@/lib/admin-response";
import { can } from "@/lib/capabilities";

type PageProps = {
  params: Promise<{ centerId: string; assetId: string }>;
};

function toPrettyJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

export default function LearningAssetDetailPage({ params }: PageProps) {
  const { centerId, assetId } = use(params);
  const { t } = useTranslation();
  const { showToast } = useModal();
  const canManageLearningAssets = can("manage_learning_assets");

  const { data, isLoading, isError, error, refetch } = useLearningAsset(
    centerId,
    assetId,
  );
  const { mutateAsync: updateAsset, isPending: isUpdating } =
    useUpdateLearningAsset();
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } =
    useUpdateLearningAssetStatus();

  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [contentAr, setContentAr] = useState("");
  const [payloadJson, setPayloadJson] = useState("{}");
  const [formError, setFormError] = useState<string | null>(null);

  const isBusy = isUpdating || isUpdatingStatus;

  const asset = data ?? null;

  useEffect(() => {
    if (!asset) return;

    const initialTitleEn =
      typeof asset.title_translations?.en === "string"
        ? asset.title_translations.en
        : (asset.title ?? "");
    const initialTitleAr =
      typeof asset.title_translations?.ar === "string"
        ? asset.title_translations.ar
        : "";
    const initialContentEn =
      typeof asset.content_translations?.en === "string"
        ? asset.content_translations.en
        : (asset.content ?? "");
    const initialContentAr =
      typeof asset.content_translations?.ar === "string"
        ? asset.content_translations.ar
        : "";

    setTitleEn(initialTitleEn);
    setTitleAr(initialTitleAr);
    setContentEn(initialContentEn);
    setContentAr(initialContentAr);
    setPayloadJson(toPrettyJson(asset.payload));
  }, [asset]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-2/5" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !asset) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t("common.messages.loadFailed")}</AlertTitle>
        <AlertDescription>
          {getAdminApiErrorMessage(
            error,
            t("pages.learningAssets.errors.loadFailed"),
          )}
        </AlertDescription>
      </Alert>
    );
  }

  const handleSave = async () => {
    setFormError(null);

    let parsedPayload: Record<string, unknown> | undefined;
    try {
      const parsed = JSON.parse(payloadJson);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        parsedPayload = parsed as Record<string, unknown>;
      }
    } catch {
      setFormError(t("pages.learningAssets.errors.invalidPayload"));
      return;
    }

    try {
      const titleTranslations: Record<string, string> = {};
      const contentTranslations: Record<string, string> = {};
      const trimmedTitleEn = titleEn.trim();
      const trimmedTitleAr = titleAr.trim();
      const trimmedContentEn = contentEn.trim();
      const trimmedContentAr = contentAr.trim();

      if (trimmedTitleEn) titleTranslations.en = trimmedTitleEn;
      if (trimmedTitleAr) titleTranslations.ar = trimmedTitleAr;
      if (trimmedContentEn) contentTranslations.en = trimmedContentEn;
      if (trimmedContentAr) contentTranslations.ar = trimmedContentAr;

      await updateAsset({
        centerId,
        assetId,
        payload: {
          title_translations: Object.keys(titleTranslations).length
            ? titleTranslations
            : undefined,
          content_translations: Object.keys(contentTranslations).length
            ? contentTranslations
            : undefined,
          payload: parsedPayload,
        },
      });
      showToast(t("pages.learningAssets.toasts.saveSuccess"), "success");
      await refetch();
    } catch (mutationError) {
      setFormError(
        getAdminApiErrorMessage(
          mutationError,
          t("pages.learningAssets.errors.saveFailed"),
        ),
      );
    }
  };

  const handleStatusUpdate = async (value: string) => {
    const status = Number(value);
    if (!Number.isInteger(status)) return;

    try {
      await updateStatus({
        centerId,
        assetId,
        payload: { status: status as 0 | 1 | 2 },
      });
      showToast(t("pages.learningAssets.toasts.statusUpdated"), "success");
      await refetch();
    } catch (mutationError) {
      showToast(
        getAdminApiErrorMessage(
          mutationError,
          t("pages.learningAssets.errors.statusFailed"),
        ),
        "error",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/centers/${centerId}/courses/${asset.course_id}/assets`}>
          <Button variant="outline">
            {t("pages.learningAssets.actions.backToAssets")}
          </Button>
        </Link>
        <Badge variant={asset.status === 1 ? "success" : "secondary"}>
          {asset.status_label}
        </Badge>
      </div>

      {!canManageLearningAssets ? (
        <Alert>
          <AlertTitle>
            {t("pages.learningAssets.permission.readOnlyTitle")}
          </AlertTitle>
          <AlertDescription>
            {t("pages.learningAssets.permission.readOnlyDescription")}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("pages.learningAssets.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="learning-asset-title-en">
                {t("pages.learningAssets.fields.titleEn")}
              </Label>
              <Input
                id="learning-asset-title-en"
                value={titleEn}
                onChange={(event) => setTitleEn(event.target.value)}
                disabled={!canManageLearningAssets || isBusy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="learning-asset-title-ar">
                {t("pages.learningAssets.fields.titleAr")}
              </Label>
              <Input
                id="learning-asset-title-ar"
                value={titleAr}
                onChange={(event) => setTitleAr(event.target.value)}
                disabled={!canManageLearningAssets || isBusy}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="learning-asset-content-en">
                {t("pages.learningAssets.fields.contentEn")}
              </Label>
              <Textarea
                id="learning-asset-content-en"
                rows={6}
                value={contentEn}
                onChange={(event) => setContentEn(event.target.value)}
                disabled={!canManageLearningAssets || isBusy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="learning-asset-content-ar">
                {t("pages.learningAssets.fields.contentAr")}
              </Label>
              <Textarea
                id="learning-asset-content-ar"
                rows={6}
                value={contentAr}
                onChange={(event) => setContentAr(event.target.value)}
                disabled={!canManageLearningAssets || isBusy}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="learning-asset-payload">
              {t("pages.learningAssets.fields.payload")}
            </Label>
            <Textarea
              id="learning-asset-payload"
              rows={10}
              value={payloadJson}
              onChange={(event) => setPayloadJson(event.target.value)}
              disabled={!canManageLearningAssets || isBusy}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="learning-asset-status">
                {t("pages.learningAssets.fields.status")}
              </Label>
              <Select
                value={String(asset.status)}
                onValueChange={handleStatusUpdate}
                disabled={!canManageLearningAssets || isBusy}
              >
                <SelectTrigger id="learning-asset-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t("common.status.draft")}</SelectItem>
                  <SelectItem value="1">
                    {t("common.status.published")}
                  </SelectItem>
                  <SelectItem value="2">
                    {t("common.status.archived")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSave}
              disabled={!canManageLearningAssets || isBusy}
            >
              {isUpdating
                ? t("common.actions.saving")
                : t("common.actions.save")}
            </Button>
          </div>

          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
