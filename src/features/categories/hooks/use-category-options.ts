"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { listCategories } from "@/features/categories/services/categories.service";
import type { Category } from "@/features/categories/types/category";

const CATEGORY_OPTIONS_PAGE_SIZE = 20;
const CATEGORY_OPTIONS_DEBOUNCE_MS = 300;

type UseCategoryOptionsParams = {
  centerId: string | number | undefined;
  selectedValue?: string | null;
  isActive?: boolean;
  includeAllOption?: boolean;
  allOptionValue?: string;
  allOptionLabel?: string;
  includeNoneOption?: boolean;
  noneOptionValue?: string;
  noneOptionLabel?: string;
  enabled?: boolean;
};

function getCategoryLabel(category: Category): string {
  if (typeof category.title === "string" && category.title.trim()) {
    return category.title.trim();
  }

  if (typeof category.name === "string" && category.name.trim()) {
    return category.name.trim();
  }

  const englishTitle = category.title_translations?.en;
  if (typeof englishTitle === "string" && englishTitle.trim()) {
    return englishTitle.trim();
  }

  return `Category #${category.id}`;
}

export function useCategoryOptions({
  centerId,
  selectedValue,
  isActive,
  includeAllOption = false,
  allOptionValue = "all",
  allOptionLabel = "All categories",
  includeNoneOption = false,
  noneOptionValue = "none",
  noneOptionLabel = "No category",
  enabled = true,
}: UseCategoryOptionsParams) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const cachedCategoriesRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, CATEGORY_OPTIONS_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [search]);

  const shouldEnableQuery = enabled && Boolean(centerId);

  const query = useInfiniteQuery({
    queryKey: [
      "category-options",
      centerId ?? "none",
      debouncedSearch,
      typeof isActive === "boolean" ? String(isActive) : "all",
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listCategories(centerId!, {
        page: Number(pageParam ?? 1),
        per_page: CATEGORY_OPTIONS_PAGE_SIZE,
        search: debouncedSearch || undefined,
        is_active: typeof isActive === "boolean" ? isActive : undefined,
      }),
    enabled: shouldEnableQuery,
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.meta?.page ?? 1);
      const perPage = Number(
        lastPage.meta?.per_page ?? CATEGORY_OPTIONS_PAGE_SIZE,
      );
      const total = Number(lastPage.meta?.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    const categories = (query.data?.pages ?? []).flatMap(
      (pageData) => pageData.items,
    );

    categories.forEach((category) => {
      cachedCategoriesRef.current.set(
        String(category.id),
        getCategoryLabel(category),
      );
    });
  }, [query.data?.pages]);

  const options = useMemo<SearchableSelectOption<string>[]>(() => {
    const defaults: SearchableSelectOption<string>[] = [];
    if (includeAllOption) {
      defaults.push({ value: allOptionValue, label: allOptionLabel });
    }
    if (includeNoneOption) {
      defaults.push({ value: noneOptionValue, label: noneOptionLabel });
    }

    const seen = new Set(defaults.map((item) => item.value));
    const categories = (query.data?.pages ?? [])
      .flatMap((pageData) => pageData.items)
      .filter((category) => {
        const key = String(category.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((category) => ({
        value: String(category.id),
        label: getCategoryLabel(category),
      }));

    const selectedKey = selectedValue ?? null;
    const isDefaultSelected =
      selectedKey === allOptionValue || selectedKey === noneOptionValue;

    if (
      selectedKey &&
      !isDefaultSelected &&
      !categories.some((option) => option.value === selectedKey)
    ) {
      const cachedLabel = cachedCategoriesRef.current.get(selectedKey);
      categories.unshift({
        value: selectedKey,
        label: cachedLabel ?? `Category #${selectedKey}`,
      });
    }

    return [...defaults, ...categories];
  }, [
    allOptionLabel,
    allOptionValue,
    includeAllOption,
    includeNoneOption,
    noneOptionLabel,
    noneOptionValue,
    query.data?.pages,
    selectedValue,
  ]);

  const handleReachEnd = useCallback(() => {
    if (!query.hasNextPage || query.isFetchingNextPage) return;
    void query.fetchNextPage();
  }, [query]);

  return {
    options,
    search,
    setSearch,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: Boolean(query.hasNextPage),
    onReachEnd: handleReachEnd,
  };
}
