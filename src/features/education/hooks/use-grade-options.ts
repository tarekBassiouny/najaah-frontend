"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { lookupGrades } from "@/features/education/services/grades.service";
import type {
  Grade,
  GradeLookupParams,
} from "@/features/education/types/education";
import { getEducationName } from "@/features/education/types/education";

const GRADE_OPTIONS_DEBOUNCE_MS = 300;

type UseGradeOptionsParams = {
  centerId: string | number | undefined;
  selectedValue?: string | null;
  selectedValues?: string[];
  stage?: number | string;
  isActive?: boolean;
  includeAllOption?: boolean;
  allOptionValue?: string;
  allOptionLabel?: string;
  includeNoneOption?: boolean;
  noneOptionValue?: string;
  noneOptionLabel?: string;
  enabled?: boolean;
};

function getGradeLabel(grade: Grade) {
  return getEducationName(grade, "Grade");
}

export function useGradeOptions({
  centerId,
  selectedValue,
  selectedValues,
  stage,
  isActive,
  includeAllOption = false,
  allOptionValue = "all",
  allOptionLabel = "All grades",
  includeNoneOption = false,
  noneOptionValue = "none",
  noneOptionLabel = "No grade",
  enabled = true,
}: UseGradeOptionsParams) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const cachedGradesRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, GRADE_OPTIONS_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [search]);

  const lookupParams = useMemo<GradeLookupParams>(
    () => ({
      search: debouncedSearch || undefined,
      stage: stage ?? undefined,
      is_active: typeof isActive === "boolean" ? isActive : undefined,
    }),
    [debouncedSearch, isActive, stage],
  );

  const query = useQuery({
    queryKey: ["education", "grade-options", centerId ?? "none", lookupParams],
    queryFn: () => lookupGrades(centerId!, lookupParams),
    enabled: enabled && Boolean(centerId),
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    (query.data ?? []).forEach((grade) => {
      cachedGradesRef.current.set(String(grade.id), getGradeLabel(grade));
    });
  }, [query.data]);

  const options = useMemo<SearchableSelectOption<string>[]>(() => {
    const defaults: SearchableSelectOption<string>[] = [];
    if (includeAllOption) {
      defaults.push({ value: allOptionValue, label: allOptionLabel });
    }
    if (includeNoneOption) {
      defaults.push({ value: noneOptionValue, label: noneOptionLabel });
    }

    const items = (query.data ?? []).map((grade) => ({
      value: String(grade.id),
      label: getGradeLabel(grade),
      description: grade.stage_label ?? undefined,
    }));

    const selectedKeys = Array.from(
      new Set(
        [
          ...(selectedValue ? [selectedValue] : []),
          ...(Array.isArray(selectedValues) ? selectedValues : []),
        ]
          .map((value) => String(value).trim())
          .filter(Boolean),
      ),
    );

    selectedKeys.forEach((selectedKey) => {
      const isDefaultSelected =
        selectedKey === allOptionValue || selectedKey === noneOptionValue;
      if (isDefaultSelected) return;
      if (items.some((item) => item.value === selectedKey)) return;

      const cachedLabel = cachedGradesRef.current.get(selectedKey);
      items.unshift({
        value: selectedKey,
        label: cachedLabel ?? `Grade #${selectedKey}`,
        description: undefined,
      });
    });

    return [...defaults, ...items];
  }, [
    allOptionLabel,
    allOptionValue,
    includeAllOption,
    includeNoneOption,
    noneOptionLabel,
    noneOptionValue,
    query.data,
    selectedValue,
    selectedValues,
  ]);

  return {
    options,
    search,
    setSearch,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
