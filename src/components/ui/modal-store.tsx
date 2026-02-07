"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AdminUser } from "@/features/admin-users/types/admin-user";

export type ModalType =
  | "editAdmin"
  | "assignRoles"
  | "confirmRoleChange"
  | null;

type EditAdminProps = {
  user?: AdminUser | null;
  onSuccess?: (_value: string) => void;
  onCreated?: (_user: AdminUser) => void;
};

type AssignRolesProps = {
  user?: AdminUser | null;
  initialRoleIds?: string[];
  onSuccess?: (_value: string) => void;
  onContinue?: (_value: {
    selectedRoleIds: string[];
    addedRoles: string[];
    removedRoles: string[];
  }) => void;
};

type ConfirmRoleChangeProps = {
  userName?: string;
  email?: string;
  addedRoles?: string[];
  removedRoles?: string[];
  roleIds?: Array<string | number>;
  userId?: string | number;
  onConfirm?: () => Promise<void> | void;
};

export type ModalProps =
  | EditAdminProps
  | AssignRolesProps
  | ConfirmRoleChangeProps
  | Record<string, never>;

type ModalState = {
  modalType: ModalType;
  modalProps: ModalProps | null;
  modalFlags: {
    disableEscapeClose?: boolean;
  };
  toast?: { message: string; variant?: "success" | "error" } | null;
};

type OpenModal = {
  (_type: "editAdmin", _props?: EditAdminProps): void;
  (_type: "assignRoles", _props?: AssignRolesProps): void;
  (_type: "confirmRoleChange", _props?: ConfirmRoleChangeProps): void;
  (_type: Exclude<ModalType, null>, _props?: ModalProps): void;
};

type ModalContextValue = ModalState & {
  openModal: OpenModal;
  closeModal: () => void;
  setModalFlags: (_flags: ModalState["modalFlags"]) => void;
  showToast: (_message: string, _variant?: "success" | "error") => void;
  clearToast: () => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ModalState>({
    modalType: null,
    modalProps: null,
    modalFlags: {},
    toast: null,
  });
  const queuedModal = useRef<ModalState | null>(null);

  const closeModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modalType: null,
      modalProps: null,
      modalFlags: {},
    }));
  }, []);

  const openModal: OpenModal = useCallback(
    (type: Exclude<ModalType, null>, props?: ModalProps) => {
      setState((prev) => {
        if (prev.modalType) {
          queuedModal.current = {
            modalType: type,
            modalProps: props ?? {},
            modalFlags: {},
            toast: prev.toast ?? null,
          };
          return {
            ...prev,
            modalType: null,
            modalProps: null,
            modalFlags: {},
          };
        }
        return {
          ...prev,
          modalType: type,
          modalProps: props ?? {},
          modalFlags: {},
        };
      });
    },
    [],
  );

  useEffect(() => {
    if (state.modalType === null && queuedModal.current) {
      const nextModal = queuedModal.current;
      queuedModal.current = null;
      setState((prev) => ({
        ...prev,
        modalType: nextModal.modalType,
        modalProps: nextModal.modalProps,
        modalFlags: nextModal.modalFlags ?? {},
      }));
    }
  }, [state.modalType]);

  const setModalFlags = useCallback((flags: ModalState["modalFlags"]) => {
    setState((prev) => ({
      ...prev,
      modalFlags: { ...prev.modalFlags, ...flags },
    }));
  }, []);

  const showToast = useCallback(
    (message: string, variant?: "success" | "error") => {
      setState((prev) => ({
        ...prev,
        toast: { message, variant },
      }));
    },
    [],
  );

  const clearToast = useCallback(() => {
    setState((prev) => ({ ...prev, toast: null }));
  }, []);

  const value = useMemo(
    () => ({
      modalType: state.modalType,
      modalProps: state.modalProps,
      modalFlags: state.modalFlags,
      toast: state.toast,
      openModal,
      closeModal,
      setModalFlags,
      showToast,
      clearToast,
    }),
    [
      state.modalProps,
      state.modalType,
      state.modalFlags,
      state.toast,
      openModal,
      closeModal,
      setModalFlags,
      showToast,
      clearToast,
    ],
  );

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return context;
}
