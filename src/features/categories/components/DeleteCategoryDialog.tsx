"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HardDeletePanel } from "@/components/ui/hard-delete-panel";
import { useDeleteCategory } from "@/features/categories/hooks/use-categories";
import type { Category } from "@/features/categories/types/category";

type DeleteCategoryDialogProps = {
  centerId: string | number;
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  category?: Category | null;
  onSuccess?: (_value: string) => void;
};

function getCategoryTitle(category: Category) {
  if (category.title_translations?.en) return category.title_translations.en;
  if (category.title_translations?.ar) return category.title_translations.ar;
  if (category.title) return String(category.title);
  if (category.name) return String(category.name);
  return `Category #${category.id}`;
}

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }

  return "Unable to delete category. Please try again.";
}

export function DeleteCategoryDialog({
  centerId,
  open,
  onOpenChange,
  category,
  onSuccess,
}: DeleteCategoryDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteCategory();

  const handleDelete = () => {
    if (!category) return;
    setErrorMessage(null);

    deleteMutation.mutate(
      {
        centerId,
        categoryId: category.id,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.("Category deleted successfully.");
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error));
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (deleteMutation.isPending) return;
        if (!nextOpen) setErrorMessage(null);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="sr-only">Delete Category</DialogTitle>
        </DialogHeader>
        <HardDeletePanel
          title="Delete Category"
          entityName={category ? getCategoryTitle(category) : null}
          entityFallback="this category"
          confirmButtonLabel="Delete Category"
          pendingLabel="Deleting..."
          errorTitle="Could not delete category"
          errorMessage={errorMessage}
          isPending={deleteMutation.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleDelete}
          resetKey={open ? (category?.id ?? "category") : null}
        />
      </DialogContent>
    </Dialog>
  );
}
