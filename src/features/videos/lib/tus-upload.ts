import * as tus from "tus-js-client";
import type { Video } from "@/features/videos/types/video";

export const VIDEO_TUS_CHUNK_SIZE = 3 * 1024 * 1024;
export const VIDEO_TUS_RETRY_DELAYS = [0, 3000, 5000, 10000, 20000];

export type TusUploadProgressPayload = {
  bytesUploaded: number;
  bytesTotal: number;
  percentage: number;
  bytesPerSecond: number | null;
  etaSeconds: number | null;
};

export type CreateTusUploadControllerOptions = {
  file: File;
  uploadEndpoint: string;
  fingerprintKey?: string | number | null;
  presignedHeaders?: Record<string, unknown> | null;
  metadata?: Record<string, string>;
  chunkSize?: number;
  retryDelays?: number[];
  onProgress?: (_payload: TusUploadProgressPayload) => void;
  onError?: (_error: Error) => void;
  onSuccess?: () => void;
};

export type TusUploadController = {
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  abort: () => Promise<void>;
};

export type PollVideoUntilTerminalOptions = {
  centerId: string | number;
  videoId: string | number;
  fetchVideo: (
    _centerId: string | number,
    _videoId: string | number,
  ) => Promise<Video>;
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  onTick?: (_video: Video) => void;
};

export function normalizeTusHeaders(
  headers: Record<string, unknown> | null | undefined,
): Record<string, string> {
  if (!headers || typeof headers !== "object" || Array.isArray(headers)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(headers)
      .filter(([key, value]) => Boolean(key) && value != null)
      .map(([key, value]) => [key, String(value)] as const),
  );
}

export function resolveVideoEncodingStatus(video: Video): string {
  const rawStatus =
    video.encoding_status_key ??
    video.lifecycle_status_key ??
    video.status_key ??
    video.status;

  return typeof rawStatus === "string" ? rawStatus.toLowerCase() : "";
}

function toTusError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  return new Error("Video upload failed.");
}

function hasStatusCode(error: unknown, statusCode: number) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const detailedError = error as {
    originalResponse?: {
      getStatus?: () => number;
    } | null;
  };

  const responseStatus = detailedError.originalResponse?.getStatus?.();
  return responseStatus === statusCode;
}

function isNotFoundTusError(error: unknown) {
  if (hasStatusCode(error, 404)) {
    return true;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return /404|not found/i.test(message);
}

export function createTusUploadController({
  file,
  uploadEndpoint,
  fingerprintKey,
  presignedHeaders,
  metadata,
  chunkSize = VIDEO_TUS_CHUNK_SIZE,
  retryDelays = VIDEO_TUS_RETRY_DELAYS,
  onProgress,
  onError,
  onSuccess,
}: CreateTusUploadControllerOptions): TusUploadController {
  const headers = normalizeTusHeaders(presignedHeaders);
  let isPrepared = false;
  let allowStoredResume = true;
  let resumedPreviousUpload = false;
  let recoveryAttempted = false;
  let previousUpload: tus.PreviousUpload | null = null;
  let lastProgressAtMs: number | null = null;
  let lastProgressBytes: number | null = null;
  let smoothedBytesPerSecond: number | null = null;

  const baseFingerprint = [
    "najaah-video",
    String(fingerprintKey ?? "default"),
    uploadEndpoint,
    file.name,
    file.type,
    String(file.size),
    String(file.lastModified),
  ].join(":");

  const createUpload = () =>
    new tus.Upload(file, {
      endpoint: uploadEndpoint,
      headers,
      retryDelays,
      chunkSize,
      removeFingerprintOnSuccess: true,
      fingerprint: async () => baseFingerprint,
      metadata: metadata ?? {
        filetype: file.type || "video/mp4",
        title: file.name,
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const nowMs = Date.now();
        let bytesPerSecond = smoothedBytesPerSecond;

        if (
          lastProgressAtMs != null &&
          lastProgressBytes != null &&
          bytesUploaded >= lastProgressBytes
        ) {
          const elapsedSeconds = (nowMs - lastProgressAtMs) / 1000;
          const bytesDelta = bytesUploaded - lastProgressBytes;

          if (elapsedSeconds > 0.2 && bytesDelta >= 0) {
            const instantBytesPerSecond = bytesDelta / elapsedSeconds;
            if (
              Number.isFinite(instantBytesPerSecond) &&
              instantBytesPerSecond > 0
            ) {
              bytesPerSecond =
                smoothedBytesPerSecond == null
                  ? instantBytesPerSecond
                  : smoothedBytesPerSecond * 0.7 + instantBytesPerSecond * 0.3;
              smoothedBytesPerSecond = bytesPerSecond;
            }
          }
        }

        lastProgressAtMs = nowMs;
        lastProgressBytes = bytesUploaded;

        const percentage =
          bytesTotal > 0
            ? Math.min(100, (bytesUploaded / bytesTotal) * 100)
            : 0;
        const remainingBytes = Math.max(0, bytesTotal - bytesUploaded);
        const etaSeconds =
          bytesPerSecond != null && bytesPerSecond > 0
            ? remainingBytes / bytesPerSecond
            : remainingBytes === 0
              ? 0
              : null;

        onProgress?.({
          bytesUploaded,
          bytesTotal,
          percentage,
          bytesPerSecond,
          etaSeconds,
        });
      },
      onError: (error) => {
        if (
          resumedPreviousUpload &&
          !recoveryAttempted &&
          isNotFoundTusError(error)
        ) {
          recoveryAttempted = true;
          resumedPreviousUpload = false;
          void recoverFromStaleResume();
          return;
        }
        onError?.(toTusError(error));
      },
      onSuccess: () => {
        onSuccess?.();
      },
    });

  let upload = createUpload();

  const clearPreviousUploadRecord = async () => {
    if (!previousUpload?.urlStorageKey) return;
    const urlStorage = upload.options?.urlStorage;
    if (!urlStorage) return;
    try {
      await urlStorage.removeUpload(previousUpload.urlStorageKey);
    } catch {
      // Ignore storage cleanup failures.
    } finally {
      previousUpload = null;
    }
  };

  const prepareUpload = async () => {
    if (isPrepared) return;

    if (allowStoredResume) {
      const previousUploads = await upload.findPreviousUploads();
      if (previousUploads.length > 0) {
        const latestUpload =
          previousUploads
            .slice()
            .sort(
              (a, b) =>
                new Date(b.creationTime).getTime() -
                new Date(a.creationTime).getTime(),
            )[0] ?? null;

        if (latestUpload) {
          previousUpload = latestUpload;
          resumedPreviousUpload = true;
          upload.resumeFromPreviousUpload(latestUpload);
        }
      }
    }

    isPrepared = true;
  };

  const recoverFromStaleResume = async () => {
    await clearPreviousUploadRecord();
    allowStoredResume = false;
    isPrepared = false;
    lastProgressAtMs = null;
    lastProgressBytes = null;
    smoothedBytesPerSecond = null;
    upload = createUpload();
    await prepareUpload();
    upload.start();
  };

  return {
    async start() {
      await prepareUpload();
      upload.start();
    },
    async pause() {
      await upload.abort();
    },
    async resume() {
      upload.start();
    },
    async abort() {
      await upload.abort();
    },
  };
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Polling aborted."));
      return;
    }

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);
      reject(new Error("Polling aborted."));
    };

    signal?.addEventListener("abort", onAbort);
  });
}

export async function pollVideoUntilTerminalStatus({
  centerId,
  videoId,
  fetchVideo,
  intervalMs = 2500,
  timeoutMs = 3 * 60 * 1000,
  signal,
  onTick,
}: PollVideoUntilTerminalOptions): Promise<Video> {
  const startAt = Date.now();

  while (true) {
    if (signal?.aborted) {
      throw new Error("Polling aborted.");
    }

    const video = await fetchVideo(centerId, videoId);
    onTick?.(video);
    const statusKey = resolveVideoEncodingStatus(video);

    if (statusKey === "ready" || statusKey === "failed") {
      return video;
    }

    if (Date.now() - startAt >= timeoutMs) {
      throw new Error("Video processing timed out.");
    }

    await sleep(intervalMs, signal);
  }
}
