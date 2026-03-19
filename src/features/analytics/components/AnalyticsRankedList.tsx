"use client";

type RankedListItem = {
  label: string;
  value: number;
  sublabel?: string;
};

type AnalyticsRankedListProps = {
  items: RankedListItem[];
  color?: string;
  maxItems?: number;
  emptyMessage?: string;
};

const DEFAULT_COLOR = "#3c50e0";

function formatValue(value: number) {
  return value.toLocaleString();
}

function formatShare(value: number, total: number) {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export function AnalyticsRankedList({
  items,
  color = DEFAULT_COLOR,
  maxItems = 8,
  emptyMessage = "No data available",
}: AnalyticsRankedListProps) {
  const rankedItems = [...items]
    .map((item) => ({
      ...item,
      value: Number.isFinite(item.value) ? item.value : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, maxItems);

  if (rankedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 py-10 dark:border-gray-700">
        <svg
          className="h-8 w-8 text-gray-300 dark:text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
          />
        </svg>
        <span className="text-sm text-gray-400 dark:text-gray-500">
          {emptyMessage}
        </span>
      </div>
    );
  }

  const total = rankedItems.reduce((sum, item) => sum + item.value, 0);
  const maxValue = rankedItems[0]?.value ?? 0;

  return (
    <div className="space-y-4">
      {rankedItems.length > 1 ? (
        <div className="flex h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          {rankedItems.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="h-full transition-all duration-700"
              style={{
                width: `${total > 0 ? (item.value / total) * 100 : 0}%`,
                backgroundColor: color,
                opacity: 1 - index * 0.08,
              }}
            />
          ))}
        </div>
      ) : null}

      <div className="space-y-3">
        {rankedItems.map((item, index) => {
          const width =
            maxValue > 0 ? Math.max((item.value / maxValue) * 100, 6) : 0;

          return (
            <div
              key={`${item.label}-${index}`}
              className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-900/50"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-[11px] font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {item.label}
                      </p>
                      {item.sublabel ? (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {item.sublabel}
                        </p>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatValue(item.value)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatShare(item.value, total)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white dark:bg-gray-800">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${width}%`,
                        backgroundColor: color,
                        opacity: 1 - index * 0.08,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
