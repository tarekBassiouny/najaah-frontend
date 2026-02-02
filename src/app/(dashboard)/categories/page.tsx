"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useTenant } from "@/app/tenant-provider";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { CategoriesTable } from "@/features/categories/components/CategoriesTable";
import { CategoryFormDialog } from "@/features/categories/components/CategoryFormDialog";
import { DeleteCategoryDialog } from "@/features/categories/components/DeleteCategoryDialog";
import type { Category } from "@/features/categories/types/category";

export default function CategoriesPage() {
  const tenant = useTenant();
  const centerId = tenant.centerId;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  if (!centerId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Categories"
          description="Manage categories for each center. Select a center to begin."
          actions={<CenterPicker className="w-52" />}
        />
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select a center from the top-right picker to manage categories.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Manage course categories for your learning center"
        actions={
          <>
            <CenterPicker className="hidden md:block md:w-52" />
            <Button onClick={handleOpenCreate}>Create Category</Button>
          </>
        }
      />

      {feedback && (
        <Alert variant="success">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      )}

      <CategoriesTable
        centerId={centerId}
        onEdit={(category) => {
          setFeedback(null);
          setEditingCategory(category);
          setIsFormOpen(true);
        }}
        onDelete={(category) => {
          setFeedback(null);
          setDeletingCategory(category);
        }}
      />

      <CategoryFormDialog
        centerId={centerId}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingCategory(null);
        }}
        category={editingCategory}
        onSuccess={(message) => setFeedback(message)}
      />

      <DeleteCategoryDialog
        centerId={centerId}
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null);
        }}
        category={deletingCategory}
        onSuccess={(message) => setFeedback(message)}
      />
    </div>
  );
}
