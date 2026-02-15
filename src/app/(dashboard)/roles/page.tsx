"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { RolesTable } from "@/features/roles/components/RolesTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateRole } from "@/features/roles/hooks/use-roles";

export default function RolesPage() {
  const { mutate: createRole, isPending: isCreating } = useCreateRole();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim()) return;

    createRole(
      {
        name_translations: {
          en: formData.name.trim(),
        },
        slug: formData.slug.trim() || undefined,
        description_translations: formData.description.trim()
          ? { en: formData.description.trim() }
          : undefined,
      },
      {
        onSuccess: () => {
          setFormData({ name: "", slug: "", description: "" });
          setIsCreateOpen(false);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Manage user roles and their access levels"
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>Add Role</Button>
        }
      />

      <RolesTable />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
            <DialogDescription>
              Add a new role with specific permissions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="role-name">Name *</Label>
              <Input
                id="role-name"
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="e.g., Content Admin"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role-slug">Slug</Label>
              <Input
                id="role-slug"
                value={formData.slug}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, slug: event.target.value }))
                }
                placeholder="content_admin"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role-desc">Description</Label>
              <Input
                id="role-desc"
                value={formData.description}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Short description"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !formData.name.trim()}
              >
                {isCreating ? "Creating..." : "Create Role"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
