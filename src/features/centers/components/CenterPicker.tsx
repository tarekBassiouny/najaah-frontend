"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTenant } from "@/app/tenant-provider";
import { cn } from "@/lib/utils";
import { setTenantState } from "@/lib/tenant-store";
import { listCenterOptions } from "@/features/centers/services/centers.service";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";

const BuildingIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
    />
  </svg>
);

const GlobeIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
    />
  </svg>
);

type CenterPickerProps = {
  className?: string;
  selectClassName?: string;
  allLabel?: string;
  hideWhenCenterScoped?: boolean;
  disabled?: boolean;
  value?: string | number | null;
  onValueChange?: (
    _centerId: string | number | null,
    _center: {
      id: string | number;
      name?: string | null;
      slug?: string | null;
    } | null,
  ) => void;
};

const ALL_CENTERS_VALUE = "__all_centers__";
const CENTER_PICKER_PAGE_SIZE = 20;
const CENTER_PICKER_SEARCH_DEBOUNCE_MS = 300;

export function CenterPicker({
  className,
  selectClassName,
  allLabel = "All Centers",
  hideWhenCenterScoped = true,
  disabled = false,
  value,
  onValueChange,
}: CenterPickerProps) {
  const { centerSlug, centerId, centerName } = useTenant();
  const isPlatformAdmin = !centerSlug;
  const isControlled = typeof onValueChange === "function";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const cachedCentersRef = useRef<
    Map<
      string,
      { id: string | number; name?: string | null; slug?: string | null }
    >
  >(new Map());

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, CENTER_PICKER_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [search]);

  const {
    data: centersData,
    isLoading,
    isFetchingNextPage: isLoadingMore,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["center-picker-centers", debouncedSearch],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listCenterOptions({
        page: pageParam,
        per_page: CENTER_PICKER_PAGE_SIZE,
        search: debouncedSearch || undefined,
      }),
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.meta?.page ?? 1);
      const perPage = Number(
        lastPage.meta?.per_page ?? CENTER_PICKER_PAGE_SIZE,
      );
      const total = Number(lastPage.meta?.total ?? 0);
      if (total > 0) {
        return page * perPage < total ? page + 1 : undefined;
      }

      return lastPage.items.length >= perPage ? page + 1 : undefined;
    },
    enabled: isPlatformAdmin,
    staleTime: 60_000,
  });

  const centers = useMemo(
    () =>
      (centersData?.pages ?? [])
        .flatMap((page) => page.items)
        .filter(
          (center, index, array) =>
            array.findIndex((item) => String(item.id) === String(center.id)) ===
            index,
        ),
    [centersData?.pages],
  );

  useEffect(() => {
    centers.forEach((center) => {
      cachedCentersRef.current.set(String(center.id), {
        id: center.id,
        name: center.name ?? null,
        slug: center.slug ?? null,
      });
    });
  }, [centers]);

  const shouldHide = hideWhenCenterScoped && !isPlatformAdmin;
  const selectedCenterId = isControlled ? (value ?? null) : centerId;
  const selectedCenterIdString =
    selectedCenterId != null ? String(selectedCenterId) : null;

  // Build options for the searchable select
  const options: SearchableSelectOption<string>[] = useMemo(() => {
    const allCentersOption: SearchableSelectOption<string> = {
      value: ALL_CENTERS_VALUE,
      label: allLabel,
      icon: <GlobeIcon />,
    };

    const centerOptions: SearchableSelectOption<string>[] = centers.map(
      (center) => ({
        value: String(center.id),
        label: center.name ?? `Center ${center.id}`,
        icon: <BuildingIcon />,
        description: center.slug ?? undefined,
      }),
    );

    if (
      selectedCenterIdString &&
      !centerOptions.some((option) => option.value === selectedCenterIdString)
    ) {
      const selectedCenter = cachedCentersRef.current.get(
        selectedCenterIdString,
      );
      centerOptions.unshift({
        value: selectedCenterIdString,
        label:
          selectedCenter?.name ??
          (String(centerId ?? "") === selectedCenterIdString
            ? centerName
            : null) ??
          `Center ${selectedCenterIdString}`,
        icon: <BuildingIcon />,
        description: selectedCenter?.slug ?? undefined,
      });
    }

    return [allCentersOption, ...centerOptions];
  }, [allLabel, centerId, centerName, centers, selectedCenterIdString]);

  // Current value for the select
  const currentValue = useMemo(() => {
    if (selectedCenterId == null) return ALL_CENTERS_VALUE;
    return String(selectedCenterId);
  }, [selectedCenterId]);

  // Handle value change
  const handleValueChange = (selectedId: string | null) => {
    if (disabled) return;

    if (!selectedId || selectedId === ALL_CENTERS_VALUE) {
      if (isControlled) {
        onValueChange?.(null, null);
      } else {
        setTenantState({ centerId: null, centerName: null });
      }
      return;
    }

    const selected =
      centers.find((center) => String(center.id) === selectedId) ??
      cachedCentersRef.current.get(selectedId);

    if (isControlled) {
      const nextId = selected?.id ?? selectedId;
      onValueChange?.(nextId, selected ?? null);
      return;
    }

    setTenantState({
      centerId: selected?.id ?? selectedId,
      centerName:
        selected?.name ??
        (String(centerId ?? "") === selectedId ? (centerName ?? null) : null),
    });
  };

  if (shouldHide) {
    return null;
  }

  return (
    <div className={cn("min-w-[13rem]", className)}>
      <label className="sr-only">Center</label>
      <SearchableSelect
        value={currentValue}
        onValueChange={handleValueChange}
        options={options}
        searchValue={search}
        onSearchValueChange={setSearch}
        placeholder={centerName ?? allLabel}
        searchPlaceholder="Search centers..."
        emptyMessage="No centers found"
        emptyIcon={<span className="text-2xl">🏢</span>}
        icon={<BuildingIcon />}
        isLoading={isLoading}
        disabled={disabled}
        filterOptions={false}
        hasMore={Boolean(hasNextPage)}
        isLoadingMore={isLoadingMore}
        onReachEnd={() => {
          if (hasNextPage) {
            void fetchNextPage();
          }
        }}
        triggerClassName={cn(
          "bg-gradient-to-r from-white to-gray-50/80 dark:from-gray-900 dark:to-gray-800/80",
          selectClassName,
        )}
        showSearch={isPlatformAdmin}
      />
    </div>
  );
}
