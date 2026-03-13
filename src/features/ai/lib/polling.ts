import { shouldPollAIJob } from "@/features/ai/lib/job-status";

export function startAIJobPolling(opts: {
  getStatus: () => number;
  poll: () => Promise<void>;
  intervalMs?: number;
}): () => void {
  const intervalMs = opts.intervalMs ?? 4000;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;
  let inFlight = false;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const scheduleNext = () => {
    clearTimer();
    if (disposed) return;
    timer = setTimeout(() => {
      void tick();
    }, intervalMs);
  };

  const tick = async () => {
    if (disposed) return;

    if (
      typeof document !== "undefined" &&
      document.visibilityState === "hidden"
    ) {
      scheduleNext();
      return;
    }

    if (!shouldPollAIJob(opts.getStatus())) {
      scheduleNext();
      return;
    }

    if (inFlight) {
      scheduleNext();
      return;
    }

    inFlight = true;
    try {
      await opts.poll();
    } finally {
      inFlight = false;
      scheduleNext();
    }
  };

  const onVisibilityChange = () => {
    if (disposed || typeof document === "undefined") return;

    if (document.visibilityState !== "visible") return;
    if (!shouldPollAIJob(opts.getStatus())) return;
    if (inFlight) return;

    void opts.poll();
  };

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  void tick();

  return () => {
    disposed = true;
    clearTimer();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  };
}
