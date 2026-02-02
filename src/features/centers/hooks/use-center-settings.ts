import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import {
  getCenterSettings,
  updateCenterSettings,
  type CenterSettingsResponse,
  type UpdateCenterSettingsPayload,
} from "@/features/centers/services/center-settings.service";

type UseCenterSettingsOptions = Omit<
  UseQueryOptions<CenterSettingsResponse>,
  "queryKey" | "queryFn"
>;

export function useCenterSettings(
  centerId: string | number | undefined,
  options?: UseCenterSettingsOptions,
) {
  return useQuery({
    queryKey: ["center-settings", centerId],
    queryFn: () => getCenterSettings(centerId!),
    enabled: !!centerId,
    ...options,
  });
}

export function useUpdateCenterSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      payload,
    }: {
      centerId: string | number;
      payload: UpdateCenterSettingsPayload;
    }) => updateCenterSettings(centerId, payload),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({ queryKey: ["center-settings", centerId] });
    },
  });
}
