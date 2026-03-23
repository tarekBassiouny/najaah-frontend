"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type FeatureGroupCardProps = {
  title: string;
  description?: string | null;
  settingCount: number;
  settingCountLabel: string;
  icon?: React.ReactNode;
  variant?: "default" | "muted";
  onClick?: () => void;
};

export function FeatureGroupCard({
  title,
  description,
  settingCount,
  settingCountLabel,
  icon,
  variant = "default",
  onClick,
}: FeatureGroupCardProps) {
  const isClickable = typeof onClick === "function";

  return (
    <Card
      className={cn(
        "overflow-hidden border-gray-200/80 shadow-sm transition-all dark:border-gray-800",
        isClickable && "cursor-pointer hover:border-primary/30 hover:shadow-md",
        variant === "muted" && "opacity-70",
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? (
              <CardDescription className="text-xs leading-5">
                {description}
              </CardDescription>
            ) : null}
          </div>
          {icon ? (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200/80 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
              {icon}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Badge variant="secondary" className="text-xs font-normal">
          {settingCount} {settingCountLabel}
        </Badge>
      </CardContent>
    </Card>
  );
}
