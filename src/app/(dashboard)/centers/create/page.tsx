"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateCenter } from "@/features/centers/hooks/use-centers";

export default function CentersCreatePage() {
  const router = useRouter();
  const { mutate: createCenter, isPending, isError, error } = useCreateCenter();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    type: "",
    tier: "",
    adminName: "",
    adminEmail: "",
  });

  const handleChange =
    (field: keyof typeof formData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    createCenter(
      {
        name: formData.name,
        slug: formData.slug || undefined,
        type: formData.type || undefined,
        tier: formData.tier || undefined,
        admin: {
          name: formData.adminName,
          email: formData.adminEmail,
        },
      },
      {
        onSuccess: () => {
          router.push("/centers");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Center"
        description="Set up a new learning center with core details"
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
                <CardDescription>Basic information for the new center.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Label htmlFor="slug">Slug</Label>
                  <div className="flex gap-2">
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={handleChange("slug")}
                      placeholder="e.g., north-campus"
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
                    <Label htmlFor="type">Type</Label>
                    <Input
                      id="type"
                      value={formData.type}
                      onChange={handleChange("type")}
                      placeholder="e.g., branded"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tier">Tier</Label>
                    <Input
                      id="tier"
                      value={formData.tier}
                      onChange={handleChange("tier")}
                      placeholder="e.g., premium"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Primary Admin</CardTitle>
                <CardDescription>Initial admin account for this center.</CardDescription>
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
                  disabled={isPending || !formData.name || !formData.adminName || !formData.adminEmail}
                >
                  {isPending ? "Creating..." : "Create Center"}
                </Button>
                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                  Center will be created with the provided admin account.
                </p>
              </CardContent>
            </Card>

            {isError && (
              <Card className="border-red-200 dark:border-red-900">
                <CardContent className="py-4">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {(error as Error)?.message || "Failed to create center. Please try again."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
