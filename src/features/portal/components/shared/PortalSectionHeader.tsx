import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PortalSectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function PortalSectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: PortalSectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        {eyebrow ? (
          <div className="flex items-center gap-2">
            <span className="h-6 w-1 rounded-full bg-teal-500" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              {eyebrow}
            </p>
          </div>
        ) : null}
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}
