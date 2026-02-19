"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRetryCenterOnboarding } from "@/features/centers/hooks/use-centers";
import { getCenterApiErrorMessage } from "@/features/centers/lib/api-error";
import type { Center } from "@/features/centers/types/center";

type CenterOnboardingCardProps = {
  center: Center;
};

function getOnboardingBadgeVariant(status: string) {
  const normalized = status.trim().toUpperCase();
  if (normalized === "ACTIVE") return "success" as const;
  if (normalized === "FAILED") return "error" as const;
  if (normalized === "IN_PROGRESS") return "warning" as const;
  return "secondary" as const;
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function CenterOnboardingCard({ center }: CenterOnboardingCardProps) {
  const retryMutation = useRetryCenterOnboarding();

  const [retryError, setRetryError] = useState<string | null>(null);

  const onboardingStatus = String(center.onboarding_status ?? "DRAFT");

  const handleRetryOnboarding = () => {
    setRetryError(null);
    retryMutation.mutate(center.id, {
      onError: (error) => {
        setRetryError(
          getCenterApiErrorMessage(
            error,
            "Unable to retry onboarding. Please try again.",
          ),
        );
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboarding</CardTitle>
        <CardDescription>
          Retry onboarding operations if setup got stuck or failed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {retryError ? (
          <Alert variant="destructive">
            <AlertTitle>Retry failed</AlertTitle>
            <AlertDescription>{retryError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Current:
          </span>
          <Badge variant={getOnboardingBadgeVariant(onboardingStatus)}>
            {toTitleCase(onboardingStatus.replace(/_/g, " "))}
          </Badge>
        </div>

        <Button
          className="w-full"
          variant="outline"
          onClick={handleRetryOnboarding}
          disabled={retryMutation.isPending}
        >
          {retryMutation.isPending ? "Retrying..." : "Retry Onboarding"}
        </Button>
      </CardContent>
    </Card>
  );
}
