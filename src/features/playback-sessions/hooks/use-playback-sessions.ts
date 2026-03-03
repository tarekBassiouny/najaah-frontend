"use client";

import { useQuery } from "@tanstack/react-query";
import type { PlaybackSessionsListParams } from "@/features/playback-sessions/types/playback-session";
import { listPlaybackSessions } from "@/features/playback-sessions/services/playback-sessions.service";

export const playbackSessionKeys = {
  all: ["playback-sessions"] as const,
  list: (
    centerId: string | number | undefined,
    params: PlaybackSessionsListParams,
  ) => [...playbackSessionKeys.all, centerId ?? "unset", params] as const,
};

export function usePlaybackSessions(
  centerId: string | number | undefined,
  params: PlaybackSessionsListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: playbackSessionKeys.list(centerId, params),
    queryFn: () => listPlaybackSessions(centerId!, params),
    enabled: enabled && Boolean(centerId),
  });
}
