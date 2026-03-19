"use client";

type AnalyticsSectionHeaderProps = {
  title: string;
  description?: string;
};

export function AnalyticsSectionHeader({
  title,
  description,
}: AnalyticsSectionHeaderProps) {
  return (
    <div className="flex items-center gap-4 pt-2">
      <div className="flex-shrink-0">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            {description}
          </p>
        )}
      </div>
      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
    </div>
  );
}
