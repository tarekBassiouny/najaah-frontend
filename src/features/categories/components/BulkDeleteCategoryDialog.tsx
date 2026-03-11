"use client";

import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBulkDeleteCategories } from "@/features/categories/hooks/use-categories";
import type { Category } from "@/features/categories/types/category";
import type { BulkDeleteCategoriesResult } from "@/features/categories/services/categories.service";
import { useTranslation } from "@/features/localization";

type BulkDeleteCategoryDialogProps = {
  centerId: string | number;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  categories: Category[];
  onSuccess?: (_message: string) => void;
};

const CONFIRM_TEXT = "DELETE";

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string;
          errors?: Record<string, string[]>;
        }
      | undefined;

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (data?.errors && typeof data.errors === "object") {
      const first = Object.values(data.errors)[0];
      if (Array.isArray(first) && first.length > 0) {
        return first[0];
      }
    }
  }

  return "Unable to delete selected categories. Please try again.";
}

export function BulkDeleteCategoryDialog({
  centerId,
  open,
  onOpenChange,
  categories,
  onSuccess,
}: BulkDeleteCategoryDialogProps) {
  const { t } = useTranslation();

  const mutation = useBulkDeleteCategories(centerId);
  const [confirmationText, setConfirmationText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<BulkDeleteCategoriesResult | null>(null);

  useEffect(() => {
    if (open) {
      setConfirmationText("");
      setErrorMessage(null);
      setResult(null);
    }
  }, [open]);

  const isConfirmMatch = confirmationText === CONFIRM_TEXT;

  const handleDelete = () => {
    if (categories.length === 0) {
      setErrorMessage("No categories selected.");
      return;
    }

    setErrorMessage(null);
    mutation.mutate(
      {
        category_ids: categories.map((category) => category.id),
      },
      {
        onSuccess: (data) => {
          setResult(data);

          const skipped = data?.counts?.skipped ?? 0;
          const failed = data?.counts?.failed ?? 0;
          if (skipped === 0 && failed === 0) {
            onSuccess?.("Categories deleted successfully.");
            onOpenChange(false);
            return;
          }

          onSuccess?.("Bulk delete processed.");
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
        if (mutation.isPending) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6"
        aria-describedby={undefined}
      >
        <DialogHeader className="space-y-3">
          <DialogTitle className="sr-only">
            {t(
              "auto.features.categories.components.bulkdeletecategorydialog.s1",
            )}
          </DialogTitle>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86l-7.4 12.8A1.75 1.75 0 004.4 19h15.2a1.75 1.75 0 001.51-2.34l-7.4-12.8a1.75 1.75 0 00-3.02 0z"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
                {t(
                  "auto.features.categories.components.bulkdeletecategorydialog.s1",
                )}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t(
                  "auto.features.categories.components.bulkdeletecategorydialog.s2",
                )}
              </p>
            </div>
          </div>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t(
                "auto.features.categories.components.bulkdeletecategorydialog.s3",
              )}
            </AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {result?.counts ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
            <div className="flex flex-wrap gap-3">
              <span>
                {t(
                  "auto.features.categories.components.bulkdeletecategorydialog.s4",
                )}
                {result.counts.total ?? categories.length}
              </span>
              <span>
                {t(
                  "auto.features.categories.components.bulkdeletecategorydialog.s5",
                )}
                {result.counts.deleted ?? 0}
              </span>
              <span>
                {t(
                  "auto.features.categories.components.bulkdeletecategorydialog.s6",
                )}
                {result.counts.skipped ?? 0}
              </span>
              <span>
                {t(
                  "auto.features.categories.components.bulkdeletecategorydialog.s7",
                )}
                {result.counts.failed ?? 0}
              </span>
            </div>

            {result.failed && result.failed.length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-red-700 dark:text-red-300">
                {result.failed.map((item, index) => (
                  <p key={`failed-${item.category_id}-${index}`}>
                    {t(
                      "auto.features.categories.components.bulkdeletecategorydialog.s8",
                    )}
                    {item.category_id}: {item.reason ?? "Failed"}
                  </p>
                ))}
              </div>
            ) : null}

            {result.skipped && result.skipped.length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-amber-700 dark:text-amber-300">
                {result.skipped.map((item, index) => (
                  <p key={`skipped-${item.category_id}-${index}`}>
                    {t(
                      "auto.features.categories.components.bulkdeletecategorydialog.s8",
                    )}
                    {item.category_id}: {item.reason ?? "Skipped"}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
              {t(
                "auto.features.categories.components.bulkdeletecategorydialog.s9",
              )}{" "}
              <span className="font-semibold text-red-900 dark:text-red-100">
                {categories.length}{" "}
                {categories.length === 1 ? "category" : "categories"}
              </span>
              .
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Type {CONFIRM_TEXT}{" "}
                {t(
                  "auto.features.categories.components.bulkdeletecategorydialog.s10",
                )}
              </label>
              <Input
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                disabled={mutation.isPending}
              />
            </div>
          </>
        )}

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button
              type="button"
              onClick={handleDelete}
              disabled={mutation.isPending || !isConfirmMatch}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {mutation.isPending ? "Deleting..." : "Delete Categories"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
