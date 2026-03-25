"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { lookupColleges } from "@/features/education/services/colleges.service";
import type {
  College,
  CollegeLookupParams,
} from "@/features/education/types/education";
import { getEducationName } from "@/features/education/types/education";
import { useLocale } from "@/features/localization";

const COLLEGE_OPTIONS_DEBOUNCE_MS = 300;

type UseCollegeOptionsParams = {
  centerId: string | number | undefined;
  selectedValue?: string | null;
  selectedValues?: string[];
  isActive?: boolean;
  includeAllOption?: boolean;
  allOptionValue?: string;
  allOptionLabel?: string;
  includeNoneOption?: boolean;
  noneOptionValue?: string;
  noneOptionLabel?: string;
  enabled?: boolean;
};

function getCollegeLabel(college: College, locale?: string) {
  return getEducationName(college, "College", locale);
}

export function useCollegeOptions({
  centerId,
  selectedValue,
  selectedValues,
  isActive,
  includeAllOption = false,
  allOptionValue = "all",
  allOptionLabel = "All colleges",
  includeNoneOption = false,
  noneOptionValue = "none",
  noneOptionLabel = "No college",
  enabled = true,
}: UseCollegeOptionsParams) {
  const { locale } = useLocale();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const cachedCollegesRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, COLLEGE_OPTIONS_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [search]);

  const lookupParams = useMemo<CollegeLookupParams>(
    () => ({
      search: debouncedSearch || undefined,
      is_active: typeof isActive === "boolean" ? isActive : undefined,
    }),
    [debouncedSearch, isActive],
  );

  const query = useQuery({
    queryKey: [
      "education",
      "college-options",
      centerId ?? "none",
      lookupParams,
    ],
    queryFn: () => lookupColleges(centerId!, lookupParams),
    enabled: enabled && Boolean(centerId),
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    (query.data ?? []).forEach((college) => {
      cachedCollegesRef.current.set(
        String(college.id),
        getCollegeLabel(college, locale),
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

    const items = (query.data ?? []).map((college) => ({
      value: String(college.id),
      label: getCollegeLabel(college, locale),
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

      const cachedLabel = cachedCollegesRef.current.get(selectedKey);
      items.unshift({
        value: selectedKey,
        label: cachedLabel ?? `College #${selectedKey}`,
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
