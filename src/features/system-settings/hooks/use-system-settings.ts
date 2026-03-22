import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type {
  SystemSetting,
  SystemSettingsListResponse,
} from "@/features/system-settings/types/system-setting";
import {
  createSystemSetting,
  deleteSystemSetting,
  findSystemSettingsByKeys,
  getSystemSetting,
  getSystemSettingsPreview,
  listSystemSettings,
  updateSystemSetting,
  type CreateSystemSettingPayload,
  type ListSystemSettingsParams,
  type SystemSettingsByKey,
  type SystemSettingsPreviewResponse,
  type UpdateSystemSettingPayload,
} from "@/features/system-settings/services/system-settings.service";

type UseSystemSettingsOptions = Omit<
  UseQueryOptions<SystemSettingsListResponse>,
  "queryKey" | "queryFn"
>;

type UseSystemSettingOptions = Omit<
  UseQueryOptions<SystemSetting>,
  "queryKey" | "queryFn"
>;

type UseSystemSettingsPreviewOptions = Omit<
  UseQueryOptions<SystemSettingsPreviewResponse>,
  "queryKey" | "queryFn"
>;

type UseSystemSettingsByKeysOptions = Omit<
  UseQueryOptions<SystemSettingsByKey>,
  "queryKey" | "queryFn"
>;

export function useSystemSettings(
  params: ListSystemSettingsParams,
  options?: UseSystemSettingsOptions,
) {
  return useQuery({
    queryKey: ["system-settings", params],
    queryFn: () => listSystemSettings(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useSystemSetting(
  id: string | number | undefined,
  options?: UseSystemSettingOptions,
) {
  return useQuery({
    queryKey: ["system-setting", id],
    queryFn: () => getSystemSetting(id!),
    enabled: !!id,
    ...options,
  });
}

export function useSystemSettingsPreview(
  options?: UseSystemSettingsPreviewOptions,
) {
  return useQuery({
    queryKey: ["system-settings-preview"],
    queryFn: getSystemSettingsPreview,
    staleTime: 30_000,
    ...options,
  });
}

export function useSystemSettingsByKeys(
  keys: string[],
  options?: UseSystemSettingsByKeysOptions,
) {
  const normalizedKeys = [...keys].sort();

  return useQuery({
    queryKey: ["system-settings-by-keys", normalizedKeys],
    queryFn: () => findSystemSettingsByKeys(normalizedKeys),
    enabled: normalizedKeys.length > 0,
    ...options,
  });
}

export function useCreateSystemSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSystemSettingPayload) =>
      createSystemSetting(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      queryClient.invalidateQueries({ queryKey: ["system-settings-by-keys"] });
      queryClient.invalidateQueries({ queryKey: ["system-settings-preview"] });
    },
  });
}

export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number;
      payload: UpdateSystemSettingPayload;
    }) => updateSystemSetting(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      queryClient.invalidateQueries({ queryKey: ["system-settings-by-keys"] });
      queryClient.invalidateQueries({ queryKey: ["system-setting", id] });
      queryClient.invalidateQueries({ queryKey: ["system-settings-preview"] });
    },
  });
}

export function useDeleteSystemSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteSystemSetting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      queryClient.invalidateQueries({ queryKey: ["system-settings-by-keys"] });
      queryClient.invalidateQueries({ queryKey: ["system-settings-preview"] });
    },
  });
}
