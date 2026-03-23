"use client";

import { useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { FeatureGroupCard } from "@/features/settings/components/FeatureGroupCard";
import { useSystemSettings } from "@/features/system-settings/hooks/use-system-settings";
import {
  translateDynamicLabel,
  translateWithFallback,
  type DynamicTranslateFunction,
} from "@/features/settings/lib/dynamic-settings";
import { useTranslation } from "@/features/localization";

const GROUP_ICONS: Record<string, string> = {
  general: "G",
  security: "S",
  limits: "L",
  overrides: "O",
  infrastructure: "I",
};

type GroupEntry = {
  group: string;
  keys: string[];
  title: string;
  description: string;
};

function getGroupDescription(
  t: DynamicTranslateFunction,
  group: string,
): string {
  return translateWithFallback(
    t,
    `pages.dynamicSettings.groupDescriptions.${group}`,
    t("pages.settingsFeatureGroups.defaultGroupDescription", {
      group: translateDynamicLabel(t, "groups", group),
    }),
  );
}

function GroupIconPlaceholder({ label }: { label: string }) {
  return <span className="text-sm font-semibold leading-none">{label[0]}</span>;
}

type SettingsFeatureGroupGridProps = {
  onGroupSelect?: (_group: string) => void;
};

export function SettingsFeatureGroupGrid({
  onGroupSelect,
}: SettingsFeatureGroupGridProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useSystemSettings({
    page: 1,
    per_page: 100,
  });

  const groups: GroupEntry[] = useMemo(() => {
    if (!data?.meta?.catalog_groups) return [];

    return Object.entries(data.meta.catalog_groups).map(([group, keys]) => ({
      group,
      keys,
      title: translateDynamicLabel(t, "groups", group),
      description: getGroupDescription(t, group),
    }));
  }, [data?.meta?.catalog_groups, t]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !data?.meta?.catalog_groups) {
    return (
      <Alert variant="destructive">
        <AlertTitle>
          {t("pages.settingsFeatureGroups.unavailableTitle")}
        </AlertTitle>
        <AlertDescription>
          {t("pages.settingsFeatureGroups.unavailableDescription")}
        </AlertDescription>
      </Alert>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
        {t("pages.settingsFeatureGroups.emptyMessage")}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map(({ group, keys, title, description }) => (
        <FeatureGroupCard
          key={group}
          title={title}
          description={description}
          settingCount={keys.length}
          settingCountLabel={t("pages.settingsFeatureGroups.settingsCount")}
          icon={<GroupIconPlaceholder label={GROUP_ICONS[group] ?? group} />}
          onClick={onGroupSelect ? () => onGroupSelect(group) : undefined}
        />
      ))}
    </div>
  );
}
