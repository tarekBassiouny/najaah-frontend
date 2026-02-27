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

export type GlobalPdfUploadPhase =
  | "creating"
  | "uploading"
  | "finalizing"
  | "failed"
  | "ready";

export type GlobalPdfUpload = {
  id: string;
  centerId: string | number;
  fileName: string;
  uploadSessionId: string | number | null;
  progress: number;
  bytesPerSecond: number | null;
  etaSeconds: number | null;
  phase: GlobalPdfUploadPhase;
  statusText: string;
};

type StartPdfUploadPayload = {
  centerId: string | number;
  fileName: string;
  uploadSessionId?: string | number | null;
  phase?: GlobalPdfUploadPhase;
  statusText?: string;
};

type PdfUploadContextValue = {
  uploads: GlobalPdfUpload[];
  hasActiveTransfers: boolean;
  isMinimized: boolean;
  startUpload: (_payload: StartPdfUploadPayload) => string;
  updateUpload: (_uploadId: string, _partial: Partial<GlobalPdfUpload>) => void;
  attachAbortController: (
    _uploadId: string,
    _controller: AbortController | null,
  ) => void;
  stopUpload: (_uploadId: string) => Promise<void>;
  clearUpload: (_uploadId: string) => void;
  clearFinishedUploads: () => void;
  minimize: () => void;
  restore: () => void;
};

const PdfUploadContext = createContext<PdfUploadContextValue | null>(null);

function createUploadId() {
  return `pdf-upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isTransferActive(upload: GlobalPdfUpload) {
  return (
    upload.phase === "creating" ||
    upload.phase === "uploading" ||
    upload.phase === "finalizing"
  );
}

export function PdfUploadProvider({ children }: { children: React.ReactNode }) {
  const [uploads, setUploads] = useState<GlobalPdfUpload[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const controllersRef = useRef<Map<string, AbortController>>(new Map());

  const hasActiveTransfers = useMemo(
    () => uploads.some((upload) => isTransferActive(upload)),
    [uploads],
  );

  useEffect(() => {
    if (!hasActiveTransfers) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasActiveTransfers]);

  const clearUpload = useCallback((uploadId: string) => {
    controllersRef.current.delete(uploadId);
    setUploads((previous) =>
      previous.filter((upload) => upload.id !== uploadId),
    );
  }, []);

  const clearFinishedUploads = useCallback(() => {
    setUploads((previous) =>
      previous.filter((upload) => isTransferActive(upload)),
    );
    setIsMinimized(false);
  }, []);

  const startUpload = useCallback((payload: StartPdfUploadPayload) => {
    const uploadId = createUploadId();
    setUploads((previous) => [
      ...previous,
      {
        id: uploadId,
        centerId: payload.centerId,
        fileName: payload.fileName,
        uploadSessionId: payload.uploadSessionId ?? null,
        progress: 0,
        bytesPerSecond: null,
        etaSeconds: null,
        phase: payload.phase ?? "creating",
        statusText: payload.statusText ?? "Preparing upload...",
      },
    ]);
    setIsMinimized(false);
    return uploadId;
  }, []);

  const updateUpload = useCallback(
    (uploadId: string, partial: Partial<GlobalPdfUpload>) => {
      setUploads((previous) =>
        previous.map((upload) =>
          upload.id === uploadId ? { ...upload, ...partial } : upload,
        ),
      );
    },
    [],
  );

  const attachAbortController = useCallback(
    (uploadId: string, controller: AbortController | null) => {
      if (!controller) {
        controllersRef.current.delete(uploadId);
        return;
      }
      controllersRef.current.set(uploadId, controller);
    },
    [],
  );

  const stopUpload = useCallback(
    async (uploadId: string) => {
      const controller = controllersRef.current.get(uploadId);
      if (controller) {
        controller.abort();
      }
      clearUpload(uploadId);
    },
    [clearUpload],
  );

  const minimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const restore = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const value = useMemo(
    () => ({
      uploads,
      hasActiveTransfers,
      isMinimized,
      startUpload,
      updateUpload,
      attachAbortController,
      stopUpload,
      clearUpload,
      clearFinishedUploads,
      minimize,
      restore,
    }),
    [
      uploads,
      hasActiveTransfers,
      isMinimized,
      startUpload,
      updateUpload,
      attachAbortController,
      stopUpload,
      clearUpload,
      clearFinishedUploads,
      minimize,
      restore,
    ],
  );

  return (
    <PdfUploadContext.Provider value={value}>
      {children}
    </PdfUploadContext.Provider>
  );
}

export function usePdfUpload() {
  const context = useContext(PdfUploadContext);
  if (!context) {
    throw new Error("usePdfUpload must be used within PdfUploadProvider");
  }
  return context;
}
