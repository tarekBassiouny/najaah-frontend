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
import type { TusUploadController } from "@/features/videos/lib/tus-upload";

export type GlobalVideoUploadPhase =
  | "creating"
  | "uploading"
  | "paused"
  | "processing"
  | "failed";

export type GlobalVideoUpload = {
  id: string;
  centerId: string | number;
  videoId: string | number;
  source: "create" | "retry";
  fileName: string;
  uploadSessionId: string | number | null;
  progress: number;
  bytesPerSecond: number | null;
  etaSeconds: number | null;
  phase: GlobalVideoUploadPhase;
  statusText: string;
};

type StartVideoUploadPayload = {
  centerId: string | number;
  videoId: string | number;
  source: "create" | "retry";
  fileName: string;
  uploadSessionId?: string | number | null;
  phase?: GlobalVideoUploadPhase;
  statusText?: string;
};

type VideoUploadContextValue = {
  uploads: GlobalVideoUpload[];
  hasActiveTransfers: boolean;
  isMinimized: boolean;
  startUpload: (_payload: StartVideoUploadPayload) => string;
  updateUpload: (
    _uploadId: string,
    _partial: Partial<GlobalVideoUpload>,
  ) => void;
  attachController: (
    _uploadId: string,
    _controller: TusUploadController | null,
  ) => void;
  pauseUpload: (_uploadId: string) => Promise<void>;
  resumeUpload: (_uploadId: string) => Promise<void>;
  stopUpload: (_uploadId: string) => Promise<void>;
  clearUpload: (_uploadId: string) => void;
  clearFinishedUploads: () => void;
  minimize: () => void;
  restore: () => void;
};

const VideoUploadContext = createContext<VideoUploadContextValue | null>(null);

function createUploadId() {
  return `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function VideoUploadProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [uploads, setUploads] = useState<GlobalVideoUpload[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const controllersRef = useRef<Map<string, TusUploadController>>(new Map());

  const hasActiveTransfers = useMemo(
    () =>
      uploads.some(
        (upload) =>
          upload.phase === "creating" ||
          upload.phase === "uploading" ||
          upload.phase === "paused",
      ),
    [uploads],
  );

  useEffect(() => {
    if (!hasActiveTransfers) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [hasActiveTransfers]);

  const clearUpload = useCallback((uploadId: string) => {
    controllersRef.current.delete(uploadId);
    setUploads((prev) => prev.filter((upload) => upload.id !== uploadId));
  }, []);

  const clearFinishedUploads = useCallback(() => {
    setUploads((prev) =>
      prev.filter(
        (upload) =>
          upload.phase === "creating" ||
          upload.phase === "uploading" ||
          upload.phase === "paused",
      ),
    );
    setIsMinimized(false);
  }, []);

  const startUpload = useCallback((payload: StartVideoUploadPayload) => {
    const uploadId = createUploadId();
    setUploads((prev) => [
      ...prev,
      {
        id: uploadId,
        centerId: payload.centerId,
        videoId: payload.videoId,
        source: payload.source,
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
    (uploadId: string, partial: Partial<GlobalVideoUpload>) => {
      setUploads((prev) =>
        prev.map((upload) =>
          upload.id === uploadId ? { ...upload, ...partial } : upload,
        ),
      );
    },
    [],
  );

  const attachController = useCallback(
    (uploadId: string, controller: TusUploadController | null) => {
      if (!controller) {
        controllersRef.current.delete(uploadId);
        return;
      }
      controllersRef.current.set(uploadId, controller);
    },
    [],
  );

  const pauseUpload = useCallback(async (uploadId: string) => {
    const controller = controllersRef.current.get(uploadId);
    if (!controller) return;
    await controller.pause();
    setUploads((prev) =>
      prev.map((upload) =>
        upload.id === uploadId
          ? {
              ...upload,
              phase: "paused",
              statusText: "Upload paused.",
              bytesPerSecond: null,
              etaSeconds: null,
            }
          : upload,
      ),
    );
  }, []);

  const resumeUpload = useCallback(async (uploadId: string) => {
    const controller = controllersRef.current.get(uploadId);
    if (!controller) return;
    await controller.resume();
    setUploads((prev) =>
      prev.map((upload) =>
        upload.id === uploadId
          ? {
              ...upload,
              phase: "uploading",
              statusText: "Uploading video...",
              bytesPerSecond: null,
              etaSeconds: null,
            }
          : upload,
      ),
    );
  }, []);

  const stopUpload = useCallback(
    async (uploadId: string) => {
      const controller = controllersRef.current.get(uploadId);
      if (controller) {
        await controller.abort();
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
      attachController,
      pauseUpload,
      resumeUpload,
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
      attachController,
      pauseUpload,
      resumeUpload,
      stopUpload,
      clearUpload,
      clearFinishedUploads,
      minimize,
      restore,
    ],
  );

  return (
    <VideoUploadContext.Provider value={value}>
      {children}
    </VideoUploadContext.Provider>
  );
}

export function useVideoUpload() {
  const context = useContext(VideoUploadContext);
  if (!context) {
    throw new Error("useVideoUpload must be used within VideoUploadProvider");
  }
  return context;
}
