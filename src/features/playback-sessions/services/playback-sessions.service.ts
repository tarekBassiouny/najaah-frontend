"use client";

import { http } from "@/lib/http";
import type {
  PlaybackSession,
  PlaybackSessionsApiResponse,
  PlaybackSessionsListParams,
} from "@/features/playback-sessions/types/playback-session";

type RawPlaybackSessionsResponse = {
  data?: PlaybackSession[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
};

function basePath(centerId: string | number) {
  return `/api/v1/admin/centers/${centerId}/playback-sessions`;
}

export async function listPlaybackSessions(
  centerId: string | number,
  params: PlaybackSessionsListParams = {},
): Promise<PlaybackSessionsApiResponse> {
  const {
    page = 1,
    per_page = 15,
    search,
    started_from,
    started_to,
    order_by,
    order_direction,
    ...flags
  } = params;

  const { data } = await http.get<RawPlaybackSessionsResponse>(
    basePath(centerId),
    {
      params: {
        page,
        per_page,
        search: search?.trim() || undefined,
        started_from: started_from || undefined,
        started_to: started_to || undefined,
        order_by,
        order_direction,
        ...Object.fromEntries(
          Object.entries(flags).flatMap(([key, value]) => {
            if (value === undefined || value === null || value === "") {
              return [];
            }
            return [[key, value]];
          }),
        ),
      },
    },
  );

  return {
    items: data?.data ?? [],
    meta: {
      page: data?.meta?.page ?? page,
      per_page: data?.meta?.per_page ?? per_page,
      total: data?.meta?.total ?? 0,
    },
  };
}
