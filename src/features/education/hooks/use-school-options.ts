"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { lookupSchools } from "@/features/education/services/schools.service";
import type {
  School,
  SchoolLookupParams,
} from "@/features/education/types/education";
import { getEducationName } from "@/features/education/types/education";
import { useLocale } from "@/features/localization";

const SCHOOL_OPTIONS_DEBOUNCE_MS = 300;

type UseSchoolOptionsParams = {
  centerId: string | number | undefined;
  selectedValue?: string | null;
  selectedValues?: string[];
  type?: number | string;
  isActive?: boolean;
  includeAllOption?: boolean;
  allOptionValue?: string;
  allOptionLabel?: string;
  includeNoneOption?: boolean;
  noneOptionValue?: string;
  noneOptionLabel?: string;
  enabled?: boolean;
};

function getSchoolLabel(school: School, locale?: string) {
  return getEducationName(school, "School", locale);
}

export function useSchoolOptions({
  centerId,
  selectedValue,
  selectedValues,
  type,
  isActive,
  includeAllOption = false,
  allOptionValue = "all",
  allOptionLabel = "All schools",
  includeNoneOption = false,
  noneOptionValue = "none",
  noneOptionLabel = "No school",
  enabled = true,
}: UseSchoolOptionsParams) {
  const { locale } = useLocale();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const cachedSchoolsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SCHOOL_OPTIONS_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [search]);

  const lookupParams = useMemo<SchoolLookupParams>(
    () => ({
      search: debouncedSearch || undefined,
      type: type ?? undefined,
      is_active: typeof isActive === "boolean" ? isActive : undefined,
    }),
    [debouncedSearch, isActive, type],
  );

  const query = useQuery({
    queryKey: ["education", "school-options", centerId ?? "none", lookupParams],
    queryFn: () => lookupSchools(centerId!, lookupParams),
    enabled: enabled && Boolean(centerId),
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    (query.data ?? []).forEach((school) => {
      cachedSchoolsRef.current.set(
        String(school.id),
        getSchoolLabel(school, locale),
      );
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

    const items = (query.data ?? []).map((school) => ({
      value: String(school.id),
      label: getSchoolLabel(school, locale),
      description: school.type_label ?? undefined,
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

      const cachedLabel = cachedSchoolsRef.current.get(selectedKey);
      items.unshift({
        value: selectedKey,
        label: cachedLabel ?? `School #${selectedKey}`,
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
