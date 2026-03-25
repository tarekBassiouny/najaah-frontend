"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCenterSettings,
  useUpdateCenterSettings,
} from "@/features/centers/hooks/use-center-settings";
import { useUploadCenterLogo } from "@/features/centers/hooks/use-centers";
import { getCenterApiErrorMessage } from "@/features/centers/lib/api-error";
import type { Center } from "@/features/centers/types/center";
import { getAdminApiErrorMessage } from "@/lib/admin-response";
import { useTranslation } from "@/features/localization";

type CenterBrandingFormProps = {
  center?: Center | null;
  isPlatformAdmin: boolean;
  mode?: "create" | "edit";
  onLogoChange?: (_file: File | null) => void;
  onPrimaryColorChange?: (_color: string) => void;
  refetchCenter?: () => Promise<unknown>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function hasOwnKey(
  record: Record<string, unknown> | null,
  key: string,
): boolean {
  return Boolean(record && Object.prototype.hasOwnProperty.call(record, key));
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function resolveCenterLogoUrlFromCenter(center: unknown): string | null {
  const centerRecord = asRecord(center);
  if (!centerRecord) return null;

  const direct = readString(centerRecord.logo_url);
  if (direct) return direct;

  const setting = asRecord(centerRecord.setting);
  const settings = asRecord(setting?.settings);
  const branding = asRecord(settings?.branding);
  const brandingLogo = readString(branding?.logo_url);
  if (brandingLogo) return brandingLogo;

  const metadata = asRecord(centerRecord.branding_metadata);
  const metadataLogo = readString(metadata?.logo_url);
  if (metadataLogo) return metadataLogo;

  return null;
}

function resolveCenterLogoUrlFromUploadResponse(
  response: unknown,
): string | null {
  const root = asRecord(response);
  if (!root) return null;

  const direct = readString(root.logo_url);
  if (direct) return direct;

  const data = asRecord(root.data);
  const dataDirect = readString(data?.logo_url);
  if (dataDirect) return dataDirect;

  const centerData = asRecord(data?.center);
  return resolveCenterLogoUrlFromCenter(centerData);
}

function LogoPreviewThumbnail({
  src,
  alt,
  label,
  loadErrorText,
  expandHintText,
  onExpandClick,
  onLoadError,
  hasError,
}: {
  src: string;
  alt: string;
  label: string;
  loadErrorText: string;
  expandHintText: string;
  onExpandClick: () => void;
  onLoadError: () => void;
  hasError: boolean;
}) {
  if (hasError) {
    return (
      <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
        {loadErrorText}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {label}
      </p>
      <button
        type="button"
        onClick={onExpandClick}
        className="group relative block w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition-colors hover:border-primary/50 dark:border-gray-700 dark:bg-gray-900/50"
      >
        <Image
          src={src}
          alt={alt}
          width={200}
          height={128}
          unoptimized
          className="mx-auto h-32 w-auto object-contain p-2"
          onError={onLoadError}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/10 group-hover:opacity-100">
          <span className="rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 shadow-sm dark:bg-gray-800/90 dark:text-gray-200">
            {expandHintText}
          </span>
        </div>
      </button>
    </div>
  );
}

export function CenterBrandingForm({
  center,
  isPlatformAdmin: _isPlatformAdmin,
  mode = "edit",
  onLogoChange,
  onPrimaryColorChange,
  refetchCenter,
}: CenterBrandingFormProps) {
  const { t } = useTranslation();

  const { data: centerSettings, refetch: refetchCenterSettings } =
    useCenterSettings(center?.id);
  const { mutateAsync: updateCenterSettings, isPending: isColorSavePending } =
    useUpdateCenterSettings();
  const uploadLogoMutation = useUploadCenterLogo();

  const [primaryColor, setPrimaryColor] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);
  const [isLogoPreviewOpen, setIsLogoPreviewOpen] = useState(false);
  const [logoPreviewFailed, setLogoPreviewFailed] = useState(false);
  const [currentLogoFailed, setCurrentLogoFailed] = useState(false);
  const [selectedLogoFailed, setSelectedLogoFailed] = useState(false);

  const [colorError, setColorError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const isCreate = mode === "create";
  const isBranded =
    String(center?.type ?? "")
      .trim()
      .toLowerCase() === "branded";

  const centerLogoUrl =
    resolveCenterLogoUrlFromCenter(center) ?? uploadedLogoUrl ?? null;

  const selectedLogoPreviewUrl = useMemo(() => {
    if (!logoFile) return null;
    return URL.createObjectURL(logoFile);
  }, [logoFile]);

  const previewImageUrl = selectedLogoPreviewUrl ?? centerLogoUrl;
  const isPreviewingSelectedFile = Boolean(selectedLogoPreviewUrl);
  const centerName = center?.name ?? t("pages.centerSettings.titleFallback");
  useEffect(() => {
    return () => {
      if (selectedLogoPreviewUrl) {
        URL.revokeObjectURL(selectedLogoPreviewUrl);
      }
    };
  }, [selectedLogoPreviewUrl]);

  useEffect(() => {
    if (!center) return;

    const resolvedBranding = asRecord(
      centerSettings?.resolved_settings?.branding,
    );
    const existingColor =
      typeof resolvedBranding?.primary_color === "string"
        ? resolvedBranding.primary_color
        : typeof center.primary_color === "string"
          ? center.primary_color
          : "";
    setPrimaryColor(existingColor);
  }, [center, centerSettings?.resolved_settings]);

  const handleLogoFileChange = (file: File | null) => {
    setLogoFile(file);
    setLogoPreviewFailed(false);
    setSelectedLogoFailed(false);
    onLogoChange?.(file);
  };

  const handleClearSelectedLogo = () => {
    setLogoFile(null);
    setSelectedLogoFailed(false);
    onLogoChange?.(null);
  };

  const handlePrimaryColorChange = (color: string) => {
    setPrimaryColor(color);
    onPrimaryColorChange?.(color);
  };

  const handleOpenLogoPreview = () => {
    if (!previewImageUrl) return;
    setLogoPreviewFailed(false);
    setIsLogoPreviewOpen(true);
  };

  const hasPrimaryColorOverride = hasOwnKey(
    asRecord(asRecord(centerSettings?.settings)?.branding),
    "primary_color",
  );

  const handleSaveColor = async () => {
    if (!center || !isBranded) return;

    if (!primaryColor.trim()) {
      setColorError(
        t(
          "pages.centerSettings.forms.branding.validation.primaryColorRequired",
        ),
      );
      return;
    }

    setColorError(null);

    const existingBrandingSettings = asRecord(
      centerSettings?.settings?.branding,
    );

    try {
      await updateCenterSettings({
        centerId: center.id,
        payload: {
          settings: {
            branding: {
              ...(existingBrandingSettings ?? {}),
              primary_color: primaryColor.trim(),
            },
          },
        },
      });

      await refetchCenterSettings();
      if (refetchCenter) {
        await refetchCenter();
      }
    } catch (error) {
      setColorError(
        getAdminApiErrorMessage(
          error,
          t("pages.centerSettings.forms.branding.errors.colorFallback"),
        ),
      );
    }
  };

  const handleUploadLogo = () => {
    if (!center || !logoFile) return;

    setLogoError(null);
    uploadLogoMutation.mutate(
      {
        id: center.id,
        payload: {
          file: logoFile,
          filename: logoFile.name,
        },
      },
      {
        onSuccess: async (response) => {
          setLogoFile(null);
          setCurrentLogoFailed(false);
          const uploadedUrl = resolveCenterLogoUrlFromUploadResponse(response);
          if (uploadedUrl) {
            setUploadedLogoUrl(uploadedUrl);
          }
          if (refetchCenter) {
            await refetchCenter();
          }
        },
        onError: (error) => {
          setLogoError(
            getCenterApiErrorMessage(
              error,
              t("pages.centerSettings.forms.branding.errors.logoFallback"),
            ),
          );
        },
      },
    );
  };

  if (isCreate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {t("pages.centerSettings.forms.branding.title")}
          </CardTitle>
          <CardDescription>
            {t("pages.centerSettings.forms.branding.descriptionCreate")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primary-color">
              {t(
                "pages.centerSettings.forms.branding.fields.primaryColor.label",
              )}
            </Label>
            <Input
              id="primary-color"
              value={primaryColor}
              onChange={(event) => handlePrimaryColorChange(event.target.value)}
              placeholder={t(
                "pages.centerSettings.forms.branding.fields.primaryColor.placeholder",
              )}
              className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="center-logo">
              {t("pages.centerSettings.forms.branding.fields.logo.label")}
            </Label>
            <Input
              id="center-logo"
              type="file"
              accept="image/*"
              className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                handleLogoFileChange(file);
              }}
            />

            {selectedLogoPreviewUrl ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {t("pages.centerSettings.forms.branding.preview.selected")}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelectedLogo}
                    className="h-auto px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {t("pages.centerSettings.forms.branding.actions.clear")}
                  </Button>
                </div>
                {selectedLogoFailed ? (
                  <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
                    {t(
                      "pages.centerSettings.forms.branding.preview.selectedLoadFailed",
                    )}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                    <Image
                      src={selectedLogoPreviewUrl}
                      alt={t(
                        "pages.centerSettings.forms.branding.preview.selected",
                      )}
                      width={200}
                      height={128}
                      unoptimized
                      className="mx-auto h-32 w-auto object-contain p-2"
                      onError={() => setSelectedLogoFailed(true)}
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {logoFile?.name}
                </p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {t("pages.centerSettings.forms.branding.title")}
          </CardTitle>
          <CardDescription>
            {t(
              isBranded
                ? "pages.centerSettings.forms.branding.descriptionBranded"
                : "pages.centerSettings.forms.branding.descriptionUnbranded",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isBranded ? (
            <>
              {colorError ? (
                <Alert variant="destructive">
                  <AlertTitle>
                    {t("pages.centerSettings.forms.branding.colorErrorTitle")}
                  </AlertTitle>
                  <AlertDescription>{colorError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="primary-color">
                    {t(
                      "pages.centerSettings.forms.branding.fields.primaryColor.label",
                    )}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {hasPrimaryColorOverride
                      ? t("pages.centerSettings.forms.branding.source.custom")
                      : t(
                          "pages.centerSettings.forms.branding.source.inherited",
                        )}
                  </p>
                </div>
                <Input
                  id="primary-color"
                  value={primaryColor}
                  onChange={(event) =>
                    handlePrimaryColorChange(event.target.value)
                  }
                  placeholder={t(
                    "pages.centerSettings.forms.branding.fields.primaryColor.placeholder",
                  )}
                  className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => void handleSaveColor()}
                  disabled={isColorSavePending}
                >
                  {isColorSavePending
                    ? t(
                        "pages.centerSettings.forms.branding.actions.savingColor",
                      )
                    : t(
                        "pages.centerSettings.forms.branding.actions.saveColor",
                      )}
                </Button>
              </div>
            </>
          ) : null}

          {logoError ? (
            <Alert variant="destructive">
              <AlertTitle>
                {t("pages.centerSettings.forms.branding.logoErrorTitle")}
              </AlertTitle>
              <AlertDescription>{logoError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-3">
            <Label>
              {t("pages.centerSettings.forms.branding.fields.logo.label")}
            </Label>

            {centerLogoUrl && !selectedLogoPreviewUrl ? (
              <LogoPreviewThumbnail
                src={centerLogoUrl}
                alt={t(
                  "pages.centerSettings.forms.branding.preview.currentAlt",
                  {
                    name: centerName,
                  },
                )}
                label={t("pages.centerSettings.forms.branding.preview.current")}
                loadErrorText={t(
                  "pages.centerSettings.forms.branding.preview.currentLoadFailed",
                )}
                expandHintText={t(
                  "pages.centerSettings.forms.branding.preview.expand",
                )}
                onExpandClick={handleOpenLogoPreview}
                onLoadError={() => setCurrentLogoFailed(true)}
                hasError={currentLogoFailed}
              />
            ) : null}

            {!centerLogoUrl && !selectedLogoPreviewUrl ? (
              <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
                {t("pages.centerSettings.forms.branding.preview.empty")}
              </div>
            ) : null}

            {selectedLogoPreviewUrl ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {centerLogoUrl ? (
                  <LogoPreviewThumbnail
                    src={centerLogoUrl}
                    alt={t(
                      "pages.centerSettings.forms.branding.preview.currentAlt",
                      {
                        name: centerName,
                      },
                    )}
                    label={t(
                      "pages.centerSettings.forms.branding.preview.current",
                    )}
                    loadErrorText={t(
                      "pages.centerSettings.forms.branding.preview.currentLoadFailed",
                    )}
                    expandHintText={t(
                      "pages.centerSettings.forms.branding.preview.expand",
                    )}
                    onExpandClick={() => {
                      setIsLogoPreviewOpen(true);
                      setLogoPreviewFailed(false);
                    }}
                    onLoadError={() => setCurrentLogoFailed(true)}
                    hasError={currentLogoFailed}
                  />
                ) : null}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400">
                      {t("pages.centerSettings.forms.branding.preview.new")}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSelectedLogo}
                      className="h-auto px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {t("pages.centerSettings.forms.branding.actions.clear")}
                    </Button>
                  </div>
                  {selectedLogoFailed ? (
                    <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
                      {t(
                        "pages.centerSettings.forms.branding.preview.selectedLoadFailed",
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleOpenLogoPreview}
                      className="group relative block w-full overflow-hidden rounded-lg border-2 border-dashed border-green-300 bg-green-50/50 transition-colors hover:border-green-400 dark:border-green-700 dark:bg-green-900/20"
                    >
                      <Image
                        src={selectedLogoPreviewUrl}
                        alt={t(
                          "pages.centerSettings.forms.branding.preview.newAlt",
                        )}
                        width={200}
                        height={128}
                        unoptimized
                        className="mx-auto h-32 w-auto object-contain p-2"
                        onError={() => setSelectedLogoFailed(true)}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/10 group-hover:opacity-100">
                        <span className="rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 shadow-sm dark:bg-gray-800/90 dark:text-gray-200">
                          {t(
                            "pages.centerSettings.forms.branding.preview.expand",
                          )}
                        </span>
                      </div>
                    </button>
                  )}
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {logoFile?.name}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="pt-2">
              <Label htmlFor="center-logo" className="sr-only">
                {t("pages.centerSettings.forms.branding.fields.logo.label")}
              </Label>
              <Input
                id="center-logo"
                type="file"
                accept="image/*"
                className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  handleLogoFileChange(file);
                }}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleUploadLogo}
              disabled={!logoFile || uploadLogoMutation.isPending}
            >
              {uploadLogoMutation.isPending
                ? t("pages.centerSettings.forms.branding.actions.uploading")
                : t("pages.centerSettings.forms.branding.actions.upload")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isLogoPreviewOpen}
        onOpenChange={(open) => {
          setIsLogoPreviewOpen(open);
          if (!open) {
            setLogoPreviewFailed(false);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {t(
                isPreviewingSelectedFile
                  ? "pages.centerSettings.forms.branding.preview.dialogTitleNew"
                  : "pages.centerSettings.forms.branding.preview.dialogTitleCurrent",
              )}
            </DialogTitle>
          </DialogHeader>

          {previewImageUrl ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-950">
              {logoPreviewFailed ? (
                <div className="flex min-h-[14rem] items-center justify-center px-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  {isPreviewingSelectedFile
                    ? t(
                        "pages.centerSettings.forms.branding.preview.selectedLoadFailed",
                      )
                    : t(
                        "pages.centerSettings.forms.branding.preview.currentLoadFailed",
                      )}
                </div>
              ) : (
                <Image
                  src={previewImageUrl}
                  alt={t(
                    "pages.centerSettings.forms.branding.preview.logoAlt",
                    {
                      name: centerName,
                    },
                  )}
                  width={600}
                  height={400}
                  unoptimized
                  className="mx-auto max-h-[70vh] w-auto rounded-md object-contain"
                  onError={() => setLogoPreviewFailed(true)}
                />
              )}
            </div>
          ) : (
            <div className="flex min-h-[10rem] items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
              {t("pages.centerSettings.forms.branding.preview.empty")}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
