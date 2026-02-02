import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

type FiltersBarProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function FiltersBar({ className, children, ...props }: FiltersBarProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

type FiltersGridProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function FiltersGrid({ className, children, ...props }: FiltersGridProps) {
  return (
    <div
      className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

type FilterFieldProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  children: ReactNode;
};

export function FilterField({
  label,
  className,
  children,
  ...props
}: FilterFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      {label ? (
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </p>
      ) : null}
      {children}
    </div>
  );
}

type FiltersActionsProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function FiltersActions({
  className,
  children,
  ...props
}: FiltersActionsProps) {
  return (
    <div
      className={cn("flex items-end justify-end gap-2 sm:col-span-2 lg:col-span-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}
