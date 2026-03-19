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
import { useTranslation } from "@/features/localization";

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

function getOnboardingStatusLabel(
  status: string,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  const normalized = status.trim().toUpperCase();
  if (normalized === "ACTIVE") {
    return t("pages.centerSettings.badges.onboarding.active");
  }
  if (normalized === "FAILED") {
    return t("pages.centerSettings.badges.onboarding.failed");
  }
  if (normalized === "IN_PROGRESS") {
    return t("pages.centerSettings.badges.onboarding.inProgress");
  }
  if (normalized === "DRAFT") {
    return t("pages.centerSettings.badges.onboarding.draft");
  }
  return t("pages.centerSettings.badges.onboarding.unknown");
}

export function CenterOnboardingCard({ center }: CenterOnboardingCardProps) {
  const { t } = useTranslation();

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
            t("pages.centerSettings.cards.onboarding.errors.fallback"),
          ),
        );
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t("pages.centerSettings.cards.onboarding.title")}
        </CardTitle>
        <CardDescription>
          {t("pages.centerSettings.cards.onboarding.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {retryError ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t("pages.centerSettings.cards.onboarding.errorTitle")}
            </AlertTitle>
            <AlertDescription>{retryError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t("pages.centerSettings.cards.onboarding.currentLabel")}
          </span>
          <Badge variant={getOnboardingBadgeVariant(onboardingStatus)}>
            {getOnboardingStatusLabel(onboardingStatus, t)}
          </Badge>
        </div>

        <Button
          className="w-full"
          variant="outline"
          onClick={handleRetryOnboarding}
          disabled={retryMutation.isPending}
        >
          {retryMutation.isPending
            ? t("pages.centerSettings.cards.onboarding.actions.retrying")
            : t("pages.centerSettings.cards.onboarding.actions.retry")}
        </Button>
      </CardContent>
    </Card>
  );
}
