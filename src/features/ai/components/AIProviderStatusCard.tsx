"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AICenterProvider } from "@/features/ai/types/ai";

type TranslateFn = (
  _key: string,
  _params?: Record<string, string | number>,
) => string;

type AIProviderStatusCardProps = {
  t: TranslateFn;
  isOptionsLoading: boolean;
  selectedProvider: AICenterProvider | null;
  availableModels: string[];
  modelKey: string;
};

export function AIProviderStatusCard({
  t,
  isOptionsLoading,
  selectedProvider,
  availableModels,
  modelKey,
}: AIProviderStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t("pages.centerAIContent.workspace.provider.title")}
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("pages.centerAIContent.workspace.provider.description")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isOptionsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : selectedProvider ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">
                {t("pages.centerAIContent.workspace.provider.enabled")}
              </Badge>
              <Badge variant="outline">{selectedProvider.label}</Badge>
              {selectedProvider.default_model ? (
                <Badge variant="secondary">
                  {t("pages.centerAIContent.workspace.provider.defaultModel", {
                    model: selectedProvider.default_model,
                  })}
                </Badge>
              ) : null}
            </div>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <p>
                {t("pages.centerAIContent.workspace.provider.limits.dailyJobs")}
                : {selectedProvider.limits.daily_job_limit}
              </p>
              <p>
                {t(
                  "pages.centerAIContent.workspace.provider.limits.monthlyJobs",
                )}
                : {selectedProvider.limits.monthly_job_limit}
              </p>
              <p>
                {t(
                  "pages.centerAIContent.workspace.provider.limits.dailyTokens",
                )}
                : {selectedProvider.limits.daily_token_limit}
              </p>
              <p>
                {t(
                  "pages.centerAIContent.workspace.provider.limits.monthlyTokens",
                )}
                : {selectedProvider.limits.monthly_token_limit}
              </p>
              <p>
                {t(
                  "pages.centerAIContent.workspace.provider.limits.maxConcurrent",
                )}
                : {selectedProvider.limits.max_concurrent_jobs}
              </p>
              <p>
                {t("pages.centerAIContent.workspace.provider.limits.maxInput")}:{" "}
                {selectedProvider.limits.max_input_chars}
              </p>
              <p>
                {t("pages.centerAIContent.workspace.provider.limits.maxOutput")}
                : {selectedProvider.limits.max_output_chars}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                {t("pages.centerAIContent.workspace.provider.models")}
              </p>
              <div className="flex flex-wrap gap-2">
                {availableModels.map((item) => (
                  <Badge
                    key={item}
                    variant={item === modelKey ? "default" : "outline"}
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("pages.centerAIContent.workspace.provider.selectPrompt")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
