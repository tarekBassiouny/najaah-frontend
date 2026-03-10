"use client";

import { use, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "@/features/localization";
import { CategoriesTable } from "@/features/categories/components/CategoriesTable";
import { CategoryFormDialog } from "@/features/categories/components/CategoryFormDialog";
import { DeleteCategoryDialog } from "@/features/categories/components/DeleteCategoryDialog";
import { BulkUpdateCategoryStatusDialog } from "@/features/categories/components/BulkUpdateCategoryStatusDialog";
import { BulkDeleteCategoryDialog } from "@/features/categories/components/BulkDeleteCategoryDialog";
import type { Category } from "@/features/categories/types/category";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterCategoriesPage({ params }: PageProps) {
  const { t } = useTranslation();
  const { centerId } = use(params);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );
  const [bulkStatusCategories, setBulkStatusCategories] = useState<Category[]>(
    [],
  );
  const [bulkDeleteCategories, setBulkDeleteCategories] = useState<Category[]>(
    [],
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.centerCategories.title")}
        description={t("pages.centerCategories.description")}
        actions={
          <>
            <Button
              onClick={() => {
                setEditingCategory(null);
                setIsFormOpen(true);
              }}
            >
              {t("pages.categories.createCategory")}
            </Button>
            <Link href={`/centers/${centerId}`}>
              <Button variant="outline">
                {t("pages.centerCourses.backToCenter")}
              </Button>
            </Link>
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
        onBulkChangeStatus={(categories) => {
          setFeedback(null);
          setBulkStatusCategories(categories);
        }}
        onBulkDelete={(categories) => {
          setFeedback(null);
          setBulkDeleteCategories(categories);
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

      <BulkUpdateCategoryStatusDialog
        centerId={centerId}
        open={bulkStatusCategories.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkStatusCategories([]);
        }}
        categories={bulkStatusCategories}
        onSuccess={(message) => setFeedback(message)}
      />

      <BulkDeleteCategoryDialog
        centerId={centerId}
        open={bulkDeleteCategories.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkDeleteCategories([]);
        }}
        categories={bulkDeleteCategories}
        onSuccess={(message) => setFeedback(message)}
      />
    </div>
  );
}
