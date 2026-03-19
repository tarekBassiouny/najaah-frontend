"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUpdateCenterStatus } from "@/features/centers/hooks/use-centers";
import { getCenterApiErrorMessage } from "@/features/centers/lib/api-error";
import type { Center } from "@/features/centers/types/center";
import { useTranslation } from "@/features/localization";

type StatusValue = "active" | "inactive";

type CenterStatusCardProps = {
  center: Center;
};

function resolveStatus(value: unknown, label?: string | null): StatusValue {
  if (Number(value) === 0) return "inactive";
  if (
    String(label ?? "")
      .trim()
      .toLowerCase() === "inactive"
  ) {
    return "inactive";
  }
  return "active";
}

export function CenterStatusCard({ center }: CenterStatusCardProps) {
  const { t } = useTranslation();

  const updateStatusMutation = useUpdateCenterStatus();

  const [status, setStatus] = useState<StatusValue>("active");
  const [statusError, setStatusError] = useState<string | null>(null);

  const statusLabel =
    center.status_label ??
    t(
      status === "active"
        ? "pages.centerSettings.badges.status.active"
        : "pages.centerSettings.badges.status.inactive",
    );

  useEffect(() => {
    setStatus(resolveStatus(center.status, center.status_label));
  }, [center.status, center.status_label]);

  const handleStatusUpdate = () => {
    setStatusError(null);
    updateStatusMutation.mutate(
      {
        id: center.id,
        payload: { status: status === "active" ? 1 : 0 },
      },
      {
        onError: (error) => {
          setStatusError(
            getCenterApiErrorMessage(
              error,
              t("pages.centerSettings.cards.status.errors.fallback"),
            ),
          );
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pages.centerSettings.cards.status.title")}</CardTitle>
        <CardDescription>
          {t("pages.centerSettings.cards.status.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {statusError ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t("pages.centerSettings.cards.status.errorTitle")}
            </AlertTitle>
            <AlertDescription>{statusError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t("pages.centerSettings.cards.status.currentLabel")}
          </span>
          <Badge variant={status === "active" ? "success" : "secondary"}>
            {statusLabel}
          </Badge>
        </div>

        <Select
          value={status}
          onValueChange={(value) => setStatus(value as StatusValue)}
        >
          <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">
              {t("pages.centerSettings.badges.status.active")}
            </SelectItem>
            <SelectItem value="inactive">
              {t("pages.centerSettings.badges.status.inactive")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          className="w-full"
          onClick={handleStatusUpdate}
          disabled={updateStatusMutation.isPending}
        >
          {updateStatusMutation.isPending
            ? t("pages.centerSettings.cards.status.actions.updating")
            : t("pages.centerSettings.cards.status.actions.update")}
        </Button>
      </CardContent>
    </Card>
  );
}
