"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateCenter,
  useUploadCenterLogo,
} from "@/features/centers/hooks/use-centers";
import { getCenterApiErrorMessage } from "@/features/centers/lib/api-error";

type CenterType = "branded" | "unbranded";
type CenterTier = "standard" | "premium" | "vip";

export default function CentersCreatePage() {
  const router = useRouter();
  const createCenterMutation = useCreateCenter();
  const uploadLogoMutation = useUploadCenterLogo();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    type: "unbranded" as CenterType,
    tier: "standard" as CenterTier,
    isFeatured: false,
    primaryColor: "",
    adminName: "",
    adminEmail: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange =
    (field: keyof typeof formData) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "isFeatured" ? event.target.checked : event.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!formData.slug.trim()) {
      setErrorMessage("Slug is required.");
      return;
    }

    if (formData.type === "branded" && !formData.primaryColor.trim()) {
      setErrorMessage("Primary color is required for branded centers.");
      return;
    }

    setErrorMessage(null);

    createCenterMutation.mutate(
      {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        type: formData.type,
        tier: formData.tier,
        is_featured: formData.isFeatured,
        branding_metadata:
          formData.type === "branded"
            ? { primary_color: formData.primaryColor.trim() }
            : undefined,
        admin: {
          name: formData.adminName.trim(),
          email: formData.adminEmail.trim(),
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
                      "Center created, but logo upload failed. You can upload it from center settings.",
                    ),
                  );
                  router.push(`/centers/${createdCenter.id}/settings`);
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
              "Failed to create center. Please try again.",
            ),
          );
        },
      },
    );
  };

  const isPending =
    createCenterMutation.isPending || uploadLogoMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Center"
        description="Set up a new learning center with required onboarding details"
        actions={
          <Link href="/centers">
            <Button variant="outline">Cancel</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Center Details</CardTitle>
                <CardDescription>
                  Provide required metadata for the center profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {errorMessage ? (
                  <Alert variant="destructive">
                    <AlertTitle>Unable to create center</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="name">Center Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleChange("name")}
                    placeholder="e.g., North Campus"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={handleChange("slug")}
                      placeholder="e.g., north-campus"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateSlug}
                      disabled={!formData.name}
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: value as CenterType,
                        }))
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
                      value={formData.tier}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          tier: value as CenterTier,
                        }))
                      }
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

                <div className="space-y-2">
                  <Label>Featured</Label>
                  <label className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={handleChange("isFeatured")}
                    />
                    Show in featured centers
                  </label>
                </div>

                {formData.type === "branded" ? (
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color *</Label>
                    <Input
                      id="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange("primaryColor")}
                      placeholder="#000000"
                      required={formData.type === "branded"}
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="logo">Center Logo (optional)</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setLogoFile(file);
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Primary Admin</CardTitle>
                <CardDescription>
                  This admin becomes the center owner on creation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Admin Name *</Label>
                  <Input
                    id="adminName"
                    value={formData.adminName}
                    onChange={handleChange("adminName")}
                    placeholder="e.g., Jane Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={handleChange("adminEmail")}
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isPending ||
                    !formData.name.trim() ||
                    !formData.slug.trim() ||
                    !formData.adminName.trim() ||
                    !formData.adminEmail.trim() ||
                    (formData.type === "branded" &&
                      !formData.primaryColor.trim())
                  }
                >
                  {isPending ? "Creating..." : "Create Center"}
                </Button>
                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                  API key is no longer returned in create response.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
