"use client";

import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateAdminUserStatus } from "@/features/admin-users/hooks/use-admin-users";
import type { AdminUser } from "@/features/admin-users/types/admin-user";

type UpdateAdminUserStatusDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  user?: AdminUser | null;
  onSuccess?: (_message: string) => void;
};

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string;
          errors?: Record<string, string[]>;
        }
      | undefined;

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (data?.errors && typeof data.errors === "object") {
      const first = Object.values(data.errors)[0];
      if (Array.isArray(first) && first.length > 0) {
        return first[0];
      }
    }
  }

  return "Unable to update admin user status. Please try again.";
}

function getInitialStatus(user?: AdminUser | null): "0" | "1" | "2" {
  if (user?.status != null) {
    const value = String(user.status).trim();
    if (value === "0" || value === "1" || value === "2") {
      return value;
    }
  }

  const statusKey = String(user?.status_key ?? "")
    .trim()
    .toLowerCase();

  if (statusKey === "inactive") return "0";
  if (statusKey === "banned") return "2";

  return "1";
}

export function UpdateAdminUserStatusDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UpdateAdminUserStatusDialogProps) {
  const mutation = useUpdateAdminUserStatus();
  const [status, setStatus] = useState<"0" | "1" | "2">("1");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      return;
    }

    setErrorMessage(null);
    setStatus(getInitialStatus(user));
  }, [open, user]);

  const handleUpdate = () => {
    if (!user) {
      setErrorMessage("Admin user not found.");
      return;
    }

    setErrorMessage(null);
    mutation.mutate(
      {
        userId: user.id,
        payload: { status: Number(status) },
      },
      {
        onSuccess: () => {
          onSuccess?.("Admin user status updated successfully.");
          onOpenChange(false);
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error));
        },
      },
    );
  };

  const userName = user?.name ?? user?.email ?? `User #${user?.id ?? ""}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (mutation.isPending) return;
        if (!nextOpen) setErrorMessage(null);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>Change Status</DialogTitle>
          <DialogDescription>
            Update account status for{" "}
            <span className="font-medium">{userName}</span>.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to update</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select the new status for this admin user.
          </p>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as "0" | "1" | "2")}
          >
            <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Active</SelectItem>
              <SelectItem value="0">Inactive</SelectItem>
              <SelectItem value="2">Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={mutation.isPending}>
            {mutation.isPending ? "Updating..." : "Update Status"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
