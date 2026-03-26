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
import { useTranslation } from "@/features/localization";
import { resolveTranslatedValue } from "@/lib/resolve-translated-value";

type DeleteCategoryDialogProps = {
  centerId: string | number;
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  category?: Category | null;
  onSuccess?: (_value: string) => void;
};

function getCategoryTitle(category: Category, locale: string) {
  return (
    resolveTranslatedValue(
      category.title_translations,
      locale,
      category.title ?? category.name,
    ) ?? `Category #${category.id}`
  );
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
  const { t, locale } = useTranslation();

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
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="sr-only">
            {t("auto.features.categories.components.deletecategorydialog.s1")}
          </DialogTitle>
        </DialogHeader>
        <HardDeletePanel
          title={t(
            "auto.features.categories.components.deletecategorydialog.s1",
          )}
          entityName={category ? getCategoryTitle(category, locale) : null}
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
