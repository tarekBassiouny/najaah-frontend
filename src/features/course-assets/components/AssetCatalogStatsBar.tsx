import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/features/localization";

type CatalogStats = {
  sources: number;
  generating: number;
  reviewRequired: number;
  published: number;
  failed: number;
};

type AssetCatalogStatsBarProps = {
  stats: CatalogStats;
};

export function AssetCatalogStatsBar({ stats }: AssetCatalogStatsBarProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="py-4">
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("pages.courseAssets.summary.sources")}
            </p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {stats.sources}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("pages.courseAssets.summary.generating")}
            </p>
            <p className="text-base font-semibold text-blue-600 dark:text-blue-400">
              {stats.generating}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("pages.courseAssets.summary.reviewRequired")}
            </p>
            <p className="text-base font-semibold text-amber-600 dark:text-amber-400">
              {stats.reviewRequired}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("pages.courseAssets.summary.published")}
            </p>
            <p className="text-base font-semibold text-green-600 dark:text-green-400">
              {stats.published}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("pages.courseAssets.summary.failed")}
            </p>
            <p className="text-base font-semibold text-red-600 dark:text-red-400">
              {stats.failed}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
