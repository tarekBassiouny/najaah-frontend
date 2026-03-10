"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/features/localization";
import type { HTMLAttributes, ReactNode } from "react";

type BreadcrumbItem = {
  label: string;
  labelKey?: string;
  href?: string;
};

type PageHeaderProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  title: ReactNode;
  titleKey?: string;
  description?: string;
  descriptionKey?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
};

export function PageHeader({
  title,
  titleKey,
  description,
  descriptionKey,
  actions,
  breadcrumbs,
  className,
  ...props
}: PageHeaderProps) {
  const { t } = useTranslation();

  const displayTitle = titleKey ? t(titleKey) : title;
  const displayDescription = descriptionKey
    ? t(descriptionKey)
    : description;

  return (
    <div className={cn("space-y-4", className)} {...props}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-x-1 text-sm text-gray-500 rtl:flex-row-reverse dark:text-gray-400">
          {breadcrumbs.map((crumb, index) => {
            const crumbLabel = crumb.labelKey
              ? t(crumb.labelKey)
              : crumb.label;

            return (
              <span key={index} className="flex items-center">
                {index > 0 && (
                  <svg
                    className="mx-1 h-4 w-4 rtl:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {crumbLabel}
                  </a>
                ) : (
                  <span className="text-gray-900 dark:text-white">
                    {crumbLabel}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {displayTitle}
          </h1>
          {displayDescription && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {displayDescription}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
