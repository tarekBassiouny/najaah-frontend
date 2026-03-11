"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSystemSettingsPreview } from "@/features/system-settings/hooks/use-system-settings";
import { useTranslation } from "@/features/localization";

type SystemSettingsPreviewDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
};

export function SystemSettingsPreviewDialog({
  open,
  onOpenChange,
}: SystemSettingsPreviewDialogProps) {
  const { t } = useTranslation();

  const { data, isLoading, isError, refetch, isFetching } =
    useSystemSettingsPreview({
      enabled: open,
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {t(
              "auto.features.system_settings.components.systemsettingspreviewdialog.s1",
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "auto.features.system_settings.components.systemsettingspreviewdialog.s2",
            )}{" "}
            <code>/api/v1/admin/settings/preview</code>.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
            {t(
              "auto.features.system_settings.components.systemsettingspreviewdialog.s3",
            )}
          </div>
        ) : isError ? (
          <div className="space-y-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/30">
            <p className="text-sm text-red-700 dark:text-red-300">
              {t(
                "auto.features.system_settings.components.systemsettingspreviewdialog.s4",
              )}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? "Retrying..." : "Retry"}
            </Button>
          </div>
        ) : (
          <div className="max-h-[65vh] overflow-auto rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
            <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-gray-700 dark:text-gray-200">
              {JSON.stringify(data ?? {}, null, 2)}
            </pre>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t(
              "auto.features.system_settings.components.systemsettingspreviewdialog.s5",
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
