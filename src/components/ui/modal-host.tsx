"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { isAxiosError } from "axios";
import { useModal } from "@/components/ui/modal-store";
import { useSyncAdminUserRoles } from "@/features/admin-users/hooks/use-admin-users";
import { AdminUserFormDialog } from "@/features/admin-users/components/AdminUserFormDialog";
import { SyncAdminUserRolesDialog } from "@/features/admin-users/components/SyncAdminUserRolesDialog";
import { cn } from "@/lib/utils";
const dangerousModals = new Set(["confirmRoleChange"]);

function getFocusableElements(container: HTMLElement) {
  const selectors =
    "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
  return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
    (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"),
  );
}

type ConfirmRoleChangeProps = {
  userName?: string;
  email?: string;
  addedRoles?: string[];
  removedRoles?: string[];
  roleIds?: Array<string | number>;
  userId?: string | number;
  onConfirm?: () => Promise<void> | void;
  errorMessage?: string | null;
};

function ConfirmRoleChangeModal({
  userName,
  email,
  addedRoles,
  removedRoles,
  onConfirm,
  errorMessage,
}: ConfirmRoleChangeProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { closeModal, setModalFlags } = useModal();

  useEffect(() => {
    setModalFlags({ disableEscapeClose: isSubmitting });
  }, [isSubmitting, setModalFlags]);

  const handleConfirm = async () => {
    if (!isChecked || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm?.();
      closeModal();
    } catch {
      // Errors are handled by the container.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
        <span className="text-yellow-500">⚠️</span>
        Confirm Role Changes
      </h2>

      <div className="mt-4 rounded-lg bg-gray-50 p-4">
        <p className="font-medium text-gray-900">{userName ?? "—"}</p>
        <p className="text-sm text-gray-500">{email ?? "—"}</p>
      </div>

      <p className="text-sm text-gray-600">
        This will update this admin’s access across the system.
      </p>

      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : null}

      <div className="mt-6">
        <p className="text-sm font-semibold text-green-600">
          Roles to be added
        </p>
        <ul className="mt-2 space-y-1">
          {(addedRoles?.length ? addedRoles : ["—"]).map((role) => (
            <li key={role} className="text-sm text-gray-800">
              {role.startsWith("+") ? role : `+ ${role}`}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-red-600">
          Roles to be removed
        </p>
        <ul className="mt-2 space-y-1">
          {(removedRoles?.length ? removedRoles : ["—"]).map((role) => (
            <li key={role} className="text-sm text-gray-800">
              {role.startsWith("−") || role.startsWith("-")
                ? role
                : `− ${role}`}
            </li>
          ))}
        </ul>
      </div>

      <label className="mt-6 flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="rounded border-gray-300"
          checked={isChecked}
          onChange={(event) => setIsChecked(event.target.checked)}
        />
        I understand this will change access permissions
      </label>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
        <button
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          onClick={closeModal}
        >
          Cancel
        </button>
        <button
          disabled={!isChecked || isSubmitting}
          onClick={handleConfirm}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Confirming..." : "Confirm & Apply"}
        </button>
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }

  return "Unable to sync roles. Please try again.";
}

function ConfirmRoleChangeContainer(props: ConfirmRoleChangeProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const syncMutation = useSyncAdminUserRoles();
  const handleConfirm = async () => {
    if (!props.userId) return;
    setErrorMessage(null);
    await syncMutation.mutateAsync({
      userId: props.userId,
      roleIds: props.roleIds ?? [],
    });
  };

  useEffect(() => {
    if (syncMutation.error) {
      setErrorMessage(getErrorMessage(syncMutation.error));
    }
  }, [syncMutation.error]);

  return (
    <ConfirmRoleChangeModal
      {...props}
      errorMessage={errorMessage}
      onConfirm={handleConfirm}
    />
  );
}

export function ModalHost() {
  const { modalType, modalProps, modalFlags, toast, closeModal, clearToast } =
    useModal();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!modalType) return;
    previousActiveElement.current =
      document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (modalFlags.disableEscapeClose) return;
        closeModal();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;
      const focusable = getFocusableElements(modalRef.current);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [modalType, closeModal, modalFlags.disableEscapeClose]);

  useEffect(() => {
    if (!modalType || !modalRef.current) return;
    const focusable = getFocusableElements(modalRef.current);
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      modalRef.current.focus();
    }
  }, [modalType]);

  const content = useMemo(() => {
    if (!modalType) return null;

    switch (modalType) {
      case "editAdmin":
        return (
          <AdminUserFormDialog
            user={(modalProps as { user?: unknown })?.user as any}
            onSuccess={
              (modalProps as { onSuccess?: (_value: string) => void })
                ?.onSuccess
            }
            onClose={closeModal}
            onCreated={
              (modalProps as { onCreated?: (_user: unknown) => void })
                ?.onCreated
            }
          />
        );
      case "assignRoles":
        return (
          <SyncAdminUserRolesDialog
            user={(modalProps as { user?: unknown })?.user as any}
            initialRoleIds={
              (modalProps as { initialRoleIds?: string[] })?.initialRoleIds
            }
            onContinue={
              (
                modalProps as {
                  onContinue?: (_value: {
                    selectedRoleIds: string[];
                    addedRoles: string[];
                    removedRoles: string[];
                  }) => void;
                }
              )?.onContinue
            }
            onClose={closeModal}
          />
        );
      case "confirmRoleChange":
        return (
          <ConfirmRoleChangeContainer
            userName={(modalProps as { userName?: string })?.userName}
            email={(modalProps as { email?: string })?.email}
            addedRoles={(modalProps as { addedRoles?: string[] })?.addedRoles}
            removedRoles={
              (modalProps as { removedRoles?: string[] })?.removedRoles
            }
            roleIds={
              (modalProps as { roleIds?: Array<string | number> })?.roleIds
            }
            userId={(modalProps as { userId?: string | number })?.userId}
          />
        );
      default:
        return null;
    }
  }, [modalType, modalProps, closeModal]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => {
      clearToast();
    }, 2500);
    return () => clearTimeout(timeout);
  }, [toast, clearToast]);

  if (!mounted) return null;

  const modalPortal =
    modalType && content
      ? createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-6"
            onClick={() => {
              if (dangerousModals.has(modalType)) return;
              closeModal();
            }}
          >
            <div
              className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:max-h-[calc(100dvh-4rem)] sm:p-6"
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
              onClick={(event) => event.stopPropagation()}
            >
              {content}
            </div>
          </div>,
          document.body,
        )
      : null;

  const toastPortal = toast
    ? createPortal(
        <div
          className={cn(
            "fixed right-4 top-4 z-[60] max-w-sm rounded-md border px-4 py-2 text-sm shadow-lg sm:right-6 sm:top-6",
            toast.variant === "error"
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-200",
          )}
        >
          {toast.message}
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {modalPortal}
      {toastPortal}
    </>
  );
}
