"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { isAxiosError } from "axios";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
} from "@/features/categories/hooks/use-categories";
import type { Category } from "@/features/categories/types/category";

const schema = z
  .object({
    titleEn: z.string().trim().optional(),
    titleAr: z.string().trim().optional(),
    descriptionEn: z.string().trim().optional(),
    descriptionAr: z.string().trim().optional(),
    parentId: z.string(),
    orderIndex: z.coerce.number().int().min(0, "Order must be 0 or more"),
    isActive: z.boolean(),
  })
  .refine((value) => Boolean(value.titleEn || value.titleAr), {
    message: "Enter at least one title (English or Arabic).",
    path: ["titleEn"],
  });

type FormValues = z.infer<typeof schema>;

type CategoryFormDialogProps = {
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
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (data?.errors && typeof data.errors === "object") {
      const firstEntry = Object.values(data.errors)[0];
      if (Array.isArray(firstEntry) && firstEntry.length > 0) {
        return firstEntry[0];
      }
    }
  }

  return "Unable to save category. Please try again.";
}

export function CategoryFormDialog({
  centerId,
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const isEditMode = Boolean(category);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const parentParams = useMemo(
    () => ({
      page: 1,
      per_page: 100,
    }),
    [],
  );
  const { data: parentData } = useCategories(centerId, parentParams);
  const parentOptions = parentData?.items ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      titleEn: "",
      titleAr: "",
      descriptionEn: "",
      descriptionAr: "",
      parentId: "none",
      orderIndex: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;

    setFormError(null);
    form.reset({
      titleEn: category?.title_translations?.en ?? "",
      titleAr: category?.title_translations?.ar ?? "",
      descriptionEn: category?.description_translations?.en ?? "",
      descriptionAr: category?.description_translations?.ar ?? "",
      parentId:
        category?.parent_id != null ? String(category.parent_id) : "none",
      orderIndex: Number(category?.order_index ?? 0),
      isActive: category?.is_active ?? true,
    });
  }, [category, form, open]);

  const onSubmit = (values: FormValues) => {
    setFormError(null);

    const titleTranslations = {
      ...(values.titleEn ? { en: values.titleEn } : {}),
      ...(values.titleAr ? { ar: values.titleAr } : {}),
    };
    const descriptionTranslations = {
      ...(values.descriptionEn ? { en: values.descriptionEn } : {}),
      ...(values.descriptionAr ? { ar: values.descriptionAr } : {}),
    };

    const payload = {
      title_translations: titleTranslations,
      description_translations: descriptionTranslations,
      parent_id: values.parentId === "none" ? null : values.parentId,
      order_index: values.orderIndex,
      is_active: values.isActive,
    };

    const onMutationSuccess = () => {
      onOpenChange(false);
      onSuccess?.(
        isEditMode
          ? "Category updated successfully."
          : "Category created successfully.",
      );
    };

    const onMutationError = (error: unknown) => {
      setFormError(getErrorMessage(error));
    };

    if (isEditMode && category) {
      updateMutation.mutate(
        {
          centerId,
          categoryId: category.id,
          payload,
        },
        {
          onSuccess: onMutationSuccess,
          onError: onMutationError,
        },
      );
      return;
    }

    createMutation.mutate(
      {
        centerId,
        payload,
      },
      {
        onSuccess: onMutationSuccess,
        onError: onMutationError,
      },
    );
  };

  const filteredParents = parentOptions.filter(
    (parent) => !category || String(parent.id) !== String(category.id),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Category" : "Create Category"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update category details and translations."
              : "Add a new category for this center."}
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <Alert variant="destructive">
            <AlertTitle>Could not save category</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 md:grid-cols-2"
          >
            <FormField
              control={form.control}
              name="titleEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (English)</FormLabel>
                  <FormControl>
                    <Input placeholder="Science" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="titleAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (Arabic)</FormLabel>
                  <FormControl>
                    <Input placeholder="العلوم" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descriptionEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (English)</FormLabel>
                  <FormControl>
                    <Input placeholder="STEM courses" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descriptionAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Arabic)</FormLabel>
                  <FormControl>
                    <Input placeholder="دورات العلوم" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Parent (Root)</SelectItem>
                        {filteredParents.map((parent) => (
                          <SelectItem key={parent.id} value={String(parent.id)}>
                            {getCategoryTitle(parent)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="orderIndex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Index</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600"
                    />
                    Active category
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="md:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
