"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertTitle>Could not delete category</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {category ? getCategoryTitle(category) : "this category"}
          </span>
          ?
        </p>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending || !category}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
