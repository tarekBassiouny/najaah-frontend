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

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function CenterProfileForm({
  center,
  mode,
  isPlatformAdmin,
  onCreateDataChange,
}: CenterProfileFormProps) {
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
      setSaveError("Center name is required.");
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
              "Unable to update center profile. Please try again.",
            ),
          );
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isCreate ? "Center Details" : "Center Profile"}</CardTitle>
        <CardDescription>
          {isCreate
            ? "Provide required metadata for the center profile."
            : "Update center metadata used in listings and branding."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {saveError ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to save</AlertTitle>
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="center-name">Center Name {isCreate ? "*" : ""}</Label>
          {isPlatformAdmin ? (
            <Input
              id="center-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g., North Campus"
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
            <Label htmlFor="center-slug">Slug *</Label>
            <div className="flex gap-2">
              <Input
                id="center-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="e.g., north-campus"
                required
                className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateSlug}
                disabled={!name}
              >
                Generate
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={center?.slug ?? ""}
                disabled
                className="h-10 bg-gray-50 dark:bg-gray-900/60"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Input
                value={toTitleCase(String(center?.type ?? "unbranded"))}
                disabled
                className="h-10 bg-gray-50 dark:bg-gray-900/60"
              />
            </div>
          </div>
        )}

        {isCreate && isPlatformAdmin ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Type *</Label>
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
                  <SelectItem value="unbranded">Unbranded</SelectItem>
                  <SelectItem value="branded">Branded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tier</Label>
              <Select
                value={tier}
                onValueChange={(value) => setTier(value as TierValue)}
              >
                <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

        {!isCreate && isPlatformAdmin ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tier</Label>
              <Select
                value={tier}
                onValueChange={(value) => setTier(value as TierValue)}
              >
                <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Featured</Label>
              <label className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(event) => setIsFeatured(event.target.checked)}
                />
                Show in featured centers
              </label>
            </div>
          </div>
        ) : null}

        {!isCreate && !isPlatformAdmin ? (
          <div className="space-y-2">
            <Label>Tier</Label>
            <Input
              value={toTitleCase(String(center?.tier ?? "standard"))}
              disabled
              className="h-10 bg-gray-50 dark:bg-gray-900/60"
            />
          </div>
        ) : null}

        {isCreate && isPlatformAdmin ? (
          <div className="space-y-2">
            <Label>Featured</Label>
            <label className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(event) => setIsFeatured(event.target.checked)}
              />
              Show in featured centers
            </label>
          </div>
        ) : null}

        {!isCreate && isPlatformAdmin ? (
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateCenterMutation.isPending}
            >
              {updateCenterMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { type TierValue };
