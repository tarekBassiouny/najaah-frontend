"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type NotFoundAction = {
  href: string;
  label: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
};

type AppNotFoundStateProps = {
  title?: string;
  description?: string;
  scopeLabel?: string;
  backLabel?: string;
  primaryAction?: NotFoundAction;
  secondaryAction?: NotFoundAction;
  showBackButton?: boolean;
  className?: string;
};

export function AppNotFoundState({
  title = "Page not found",
  description = "The page you requested does not exist or is no longer available.",
  scopeLabel,
  backLabel = "Go Back",
  primaryAction,
  secondaryAction,
  showBackButton = true,
  className,
}: AppNotFoundStateProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      console.warn("[app:not-found]", {
        pathname,
        scopeLabel: scopeLabel ?? null,
        title,
      });
    }
  }, [pathname, scopeLabel, title]);

  return (
    <div
      className={cn(
        "flex min-h-[420px] items-center justify-center px-4 py-10",
        className,
      )}
    >
      <Card className="w-full max-w-2xl border-gray-200 shadow-sm dark:border-gray-800">
        <CardContent className="space-y-6 p-8 text-center sm:p-10">
          <div className="space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-xl font-semibold text-primary">
              404
            </div>
            {scopeLabel ? (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                {scopeLabel}
              </p>
            ) : null}
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {title}
              </h1>
              <p className="mx-auto max-w-xl text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {showBackButton ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.history.back();
                  }
                }}
              >
                {backLabel}
              </Button>
            ) : null}
            {primaryAction ? (
              <Link href={primaryAction.href}>
                <Button variant={primaryAction.variant ?? "default"}>
                  {primaryAction.label}
                </Button>
              </Link>
            ) : null}
            {secondaryAction ? (
              <Link href={secondaryAction.href}>
                <Button variant={secondaryAction.variant ?? "outline"}>
                  {secondaryAction.label}
                </Button>
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
