import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createCenter,
  deleteCenter,
  getCenter,
  listCenters,
  restoreCenter,
  retryCenterOnboarding,
  updateCenter,
  uploadCenterLogo,
  type CreateCenterPayload,
  type ListCentersParams,
  type UpdateCenterPayload,
  type UploadCenterLogoPayload,
} from "../services/centers.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { Center } from "@/features/centers/types/center";

type UseCentersOptions = Omit<
  UseQueryOptions<PaginatedResponse<Center>>,
  "queryKey" | "queryFn"
>;

export function useCenters(
  params: ListCentersParams,
  options?: UseCentersOptions,
) {
  return useQuery({
    queryKey: ["centers", params],
    queryFn: () => listCenters(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}

type UseCenterOptions = Omit<
  UseQueryOptions<Center | null>,
  "queryKey" | "queryFn"
>;

export function useCenter(
  centerIdOrSlug: string | number | undefined,
  options?: UseCenterOptions,
) {
  return useQuery({
    queryKey: ["center", centerIdOrSlug],
    queryFn: () => getCenter(centerIdOrSlug!),
    enabled: !!centerIdOrSlug,
    ...options,
  });
}

export function useCreateCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCenterPayload) => createCenter(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
    },
  });
}

export function useUpdateCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number;
      payload: UpdateCenterPayload;
    }) => updateCenter(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      queryClient.invalidateQueries({ queryKey: ["center", id] });
    },
  });
}

export function useDeleteCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteCenter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
    },
  });
}

export function useRestoreCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => restoreCenter(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      queryClient.invalidateQueries({ queryKey: ["center", id] });
    },
  });
}

export function useRetryCenterOnboarding() {
  return useMutation({
    mutationFn: (id: string | number) => retryCenterOnboarding(id),
  });
}

export function useUploadCenterLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number;
      payload: UploadCenterLogoPayload;
    }) => uploadCenterLogo(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["center", id] });
    },
  });
}
