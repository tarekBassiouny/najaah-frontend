"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { listInstructors } from "@/features/instructors/services/instructors.service";
import type { Instructor } from "@/features/instructors/types/instructor";

const INSTRUCTOR_OPTIONS_PAGE_SIZE = 20;
const INSTRUCTOR_OPTIONS_DEBOUNCE_MS = 300;

type UseInstructorOptionsParams = {
  centerId: string | number | undefined;
  selectedValue?: string | null;
  courseId?: string | number;
  status?: string;
  includeAllOption?: boolean;
  allOptionValue?: string;
  allOptionLabel?: string;
  enabled?: boolean;
};

function getInstructorLabel(instructor: Instructor): string {
  if (typeof instructor.name === "string" && instructor.name.trim()) {
    return instructor.name.trim();
  }

  const englishName = instructor.name_translations?.en;
  if (typeof englishName === "string" && englishName.trim()) {
    return englishName.trim();
  }

  return `Instructor #${instructor.id}`;
}

function getInstructorDescription(instructor: Instructor): string | undefined {
  if (typeof instructor.title === "string" && instructor.title.trim()) {
    return instructor.title.trim();
  }

  const englishTitle = instructor.title_translations?.en;
  if (typeof englishTitle === "string" && englishTitle.trim()) {
    return englishTitle.trim();
  }

  return undefined;
}

export function useInstructorOptions({
  centerId,
  selectedValue,
  courseId,
  status,
  includeAllOption = false,
  allOptionValue = "all",
  allOptionLabel = "All instructors",
  enabled = true,
}: UseInstructorOptionsParams) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const cachedInstructorsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, INSTRUCTOR_OPTIONS_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [search]);

  const shouldEnableQuery = enabled && Boolean(centerId);

  const query = useInfiniteQuery({
    queryKey: [
      "instructor-options",
      centerId ?? "none",
      debouncedSearch,
      courseId ?? "all-courses",
      status ?? "all-statuses",
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listInstructors(
        {
          page: Number(pageParam ?? 1),
          per_page: INSTRUCTOR_OPTIONS_PAGE_SIZE,
          search: debouncedSearch || undefined,
          course_id: courseId ?? undefined,
          status: status || undefined,
        },
        { centerId: centerId! },
      ),
    enabled: shouldEnableQuery,
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.meta?.page ?? 1);
      const perPage = Number(
        lastPage.meta?.per_page ?? INSTRUCTOR_OPTIONS_PAGE_SIZE,
      );
      const total = Number(lastPage.meta?.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    const instructors = (query.data?.pages ?? []).flatMap(
      (pageData) => pageData.items,
    );

    instructors.forEach((instructor) => {
      cachedInstructorsRef.current.set(
        String(instructor.id),
        getInstructorLabel(instructor),
      );
    });
  }, [query.data?.pages]);

  const options = useMemo<SearchableSelectOption<string>[]>(() => {
    const defaults: SearchableSelectOption<string>[] = [];
    if (includeAllOption) {
      defaults.push({ value: allOptionValue, label: allOptionLabel });
    }

    const seen = new Set(defaults.map((item) => item.value));
    const instructors = (query.data?.pages ?? [])
      .flatMap((pageData) => pageData.items)
      .filter((instructor) => {
        const key = String(instructor.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((instructor) => ({
        value: String(instructor.id),
        label: getInstructorLabel(instructor),
        description: getInstructorDescription(instructor),
      }));

    const selectedKey = selectedValue ?? null;
    const isDefaultSelected = selectedKey === allOptionValue;

    if (
      selectedKey &&
      !isDefaultSelected &&
      !instructors.some((option) => option.value === selectedKey)
    ) {
      const cachedLabel = cachedInstructorsRef.current.get(selectedKey);
      instructors.unshift({
        value: selectedKey,
        label: cachedLabel ?? `Instructor #${selectedKey}`,
        description: undefined,
      });
    }

    return [...defaults, ...instructors];
  }, [
    allOptionLabel,
    allOptionValue,
    includeAllOption,
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
