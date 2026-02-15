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

type SystemSettingsPreviewDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
};

export function SystemSettingsPreviewDialog({
  open,
  onOpenChange,
}: SystemSettingsPreviewDialogProps) {
  const { data, isLoading, isError, refetch, isFetching } =
    useSystemSettingsPreview({
      enabled: open,
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Settings Preview</DialogTitle>
          <DialogDescription>
            Read-only merged preview from{" "}
            <code>/api/v1/admin/settings/preview</code>.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
            Loading preview...
          </div>
        ) : isError ? (
          <div className="space-y-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/30">
            <p className="text-sm text-red-700 dark:text-red-300">
              Failed to load preview.
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
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
