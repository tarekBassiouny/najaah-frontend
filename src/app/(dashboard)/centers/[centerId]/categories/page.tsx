"use client";

import { use } from "react";
import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CategoriesTable } from "@/features/categories/components/CategoriesTable";
import { CategoryFormDialog } from "@/features/categories/components/CategoryFormDialog";
import { DeleteCategoryDialog } from "@/features/categories/components/DeleteCategoryDialog";
import type { Category } from "@/features/categories/types/category";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterCategoriesPage({ params }: PageProps) {
  const { centerId } = use(params);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Center Categories"
        description="Manage categories for this center"
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Categories" },
        ]}
        actions={
          <>
            <Button
              onClick={() => {
                setEditingCategory(null);
                setIsFormOpen(true);
              }}
            >
              Create Category
            </Button>
            <Link href={`/centers/${centerId}`}>
              <Button variant="outline">Back to Center</Button>
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
