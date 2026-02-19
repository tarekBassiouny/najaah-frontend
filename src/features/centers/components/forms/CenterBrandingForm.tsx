"use client";

import { useEffect, useMemo, useState } from "react";
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
  useUpdateCenter,
  useUploadCenterLogo,
} from "@/features/centers/hooks/use-centers";
import { getCenterApiErrorMessage } from "@/features/centers/lib/api-error";
import type { Center } from "@/features/centers/types/center";

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
  onExpandClick,
  onLoadError,
  hasError,
}: {
  src: string;
  alt: string;
  label: string;
  onExpandClick: () => void;
  onLoadError: () => void;
  hasError: boolean;
}) {
  if (hasError) {
    return (
      <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
        Unable to load preview
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="mx-auto h-32 w-auto object-contain p-2"
          onError={onLoadError}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/10 group-hover:opacity-100">
          <span className="rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 shadow-sm dark:bg-gray-800/90 dark:text-gray-200">
            Click to expand
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
  const updateCenterMutation = useUpdateCenter();
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

  useEffect(() => {
    return () => {
      if (selectedLogoPreviewUrl) {
        URL.revokeObjectURL(selectedLogoPreviewUrl);
      }
    };
  }, [selectedLogoPreviewUrl]);

  useEffect(() => {
    if (!center) return;

    const existingColor =
      typeof center.primary_color === "string" ? center.primary_color : "";
    setPrimaryColor(existingColor);
  }, [center]);

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

  const handleSaveColor = () => {
    if (!center || !isBranded) return;

    if (!primaryColor.trim()) {
      setColorError("Primary color is required for branded centers.");
      return;
    }

    setColorError(null);

    const existingBrandingMetadata =
      center.branding_metadata &&
      typeof center.branding_metadata === "object" &&
      !Array.isArray(center.branding_metadata)
        ? center.branding_metadata
        : {};

    updateCenterMutation.mutate(
      {
        id: center.id,
        payload: {
          branding_metadata: {
            ...existingBrandingMetadata,
            primary_color: primaryColor.trim(),
          },
        },
      },
      {
        onError: (error) => {
          setColorError(
            getCenterApiErrorMessage(
              error,
              "Unable to update primary color. Please try again.",
            ),
          );
        },
      },
    );
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
              "Unable to upload center logo. Please try again.",
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
          <CardTitle>Branding</CardTitle>
          <CardDescription>
            Configure center branding and visual identity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primary-color">Primary Color</Label>
            <Input
              id="primary-color"
              value={primaryColor}
              onChange={(event) => handlePrimaryColorChange(event.target.value)}
              placeholder="#4F46E5"
              className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="center-logo">Center Logo (optional)</Label>
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
                    Selected logo preview
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelectedLogo}
                    className="h-auto px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Clear
                  </Button>
                </div>
                {selectedLogoFailed ? (
                  <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
                    Unable to preview this file
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedLogoPreviewUrl}
                      alt="Selected logo preview"
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
          <CardTitle>Branding</CardTitle>
          <CardDescription>
            {isBranded
              ? "Manage center branding including logo and primary color."
              : "Upload or replace the center logo (max 5MB)."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isBranded ? (
            <>
              {colorError ? (
                <Alert variant="destructive">
                  <AlertTitle>Unable to save</AlertTitle>
                  <AlertDescription>{colorError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <Input
                  id="primary-color"
                  value={primaryColor}
                  onChange={(event) =>
                    handlePrimaryColorChange(event.target.value)
                  }
                  placeholder="#4F46E5"
                  className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveColor}
                  disabled={updateCenterMutation.isPending}
                >
                  {updateCenterMutation.isPending ? "Saving..." : "Save Color"}
                </Button>
              </div>
            </>
          ) : null}

          {logoError ? (
            <Alert variant="destructive">
              <AlertTitle>Upload failed</AlertTitle>
              <AlertDescription>{logoError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-3">
            <Label>Center Logo</Label>

            {centerLogoUrl && !selectedLogoPreviewUrl ? (
              <LogoPreviewThumbnail
                src={centerLogoUrl}
                alt={`${center?.name ?? "Center"} current logo`}
                label="Current logo"
                onExpandClick={handleOpenLogoPreview}
                onLoadError={() => setCurrentLogoFailed(true)}
                hasError={currentLogoFailed}
              />
            ) : null}

            {!centerLogoUrl && !selectedLogoPreviewUrl ? (
              <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
                No logo uploaded yet
              </div>
            ) : null}

            {selectedLogoPreviewUrl ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {centerLogoUrl ? (
                  <LogoPreviewThumbnail
                    src={centerLogoUrl}
                    alt={`${center?.name ?? "Center"} current logo`}
                    label="Current logo"
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
                      New logo (to be uploaded)
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSelectedLogo}
                      className="h-auto px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Clear
                    </Button>
                  </div>
                  {selectedLogoFailed ? (
                    <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
                      Unable to preview this file
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleOpenLogoPreview}
                      className="group relative block w-full overflow-hidden rounded-lg border-2 border-dashed border-green-300 bg-green-50/50 transition-colors hover:border-green-400 dark:border-green-700 dark:bg-green-900/20"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedLogoPreviewUrl}
                        alt="New logo preview"
                        className="mx-auto h-32 w-auto object-contain p-2"
                        onError={() => setSelectedLogoFailed(true)}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/10 group-hover:opacity-100">
                        <span className="rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 shadow-sm dark:bg-gray-800/90 dark:text-gray-200">
                          Click to expand
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
                Upload new logo
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
              {uploadLogoMutation.isPending ? "Uploading..." : "Upload Logo"}
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
              {isPreviewingSelectedFile
                ? "New Logo Preview"
                : "Current Logo Preview"}
            </DialogTitle>
          </DialogHeader>

          {previewImageUrl ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-950">
              {logoPreviewFailed ? (
                <div className="flex min-h-[14rem] items-center justify-center px-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  {isPreviewingSelectedFile
                    ? "Unable to load the selected logo preview."
                    : "Unable to load the current logo preview."}
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewImageUrl}
                  alt={`${center?.name ?? "Center"} logo`}
                  className="mx-auto max-h-[70vh] w-auto rounded-md object-contain"
                  onError={() => setLogoPreviewFailed(true)}
                />
              )}
            </div>
          ) : (
            <div className="flex min-h-[10rem] items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
              No logo is available for preview yet.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
