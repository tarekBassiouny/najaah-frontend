import type { QueryClient } from "@tanstack/react-query";

const PORTAL_SESSION_QUERY_KEYS = [
  ["portal", "me"],
  ["portal", "student"],
  ["portal", "parent"],
] as const;

export function clearPortalSessionQueries(queryClient: QueryClient) {
  for (const queryKey of PORTAL_SESSION_QUERY_KEYS) {
    queryClient.removeQueries({ queryKey });
  }
}
