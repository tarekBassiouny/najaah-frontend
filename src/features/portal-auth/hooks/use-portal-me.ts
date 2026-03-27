import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { portalTokenStorage } from "@/lib/portal-token-storage";
import { useTenant } from "@/app/tenant-provider";
import {
  fetchParentProfile,
  fetchStudentProfile,
} from "../services/portal-auth.service";
import type {
  ParentProfile,
  PortalRole,
  StudentProfile,
} from "../types/portal-auth";

type UsePortalMeOptions = Omit<
  UseQueryOptions<StudentProfile | ParentProfile | null>,
  "queryKey" | "queryFn"
>;

export function getPortalMeQueryKey(role: PortalRole) {
  return ["portal", "me", role] as const;
}

export function usePortalMe(options?: UsePortalMeOptions) {
  const hasToken = Boolean(portalTokenStorage.getAccessToken());
  const { isResolved } = useTenant();
  const activeRole = portalTokenStorage.getActiveRole();

  return useQuery({
    queryKey: getPortalMeQueryKey(activeRole),
    queryFn: activeRole === "parent" ? fetchParentProfile : fetchStudentProfile,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 401) {
        return false;
      }
      return failureCount < 1;
    },
    enabled: hasToken && isResolved,
    ...options,
  });
}
