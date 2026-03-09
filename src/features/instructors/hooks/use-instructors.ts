import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createInstructor,
  deleteInstructor,
  getInstructor,
  listInstructors,
  uploadInstructorAvatar,
  updateInstructor,
  type CreateInstructorPayload,
  type InstructorsApiScopeContext,
  type ListInstructorsParams,
} from "../services/instructors.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { Instructor } from "@/features/instructors/types/instructor";

export const instructorKeys = {
  all: ["instructors"] as const,
  list: (params: ListInstructorsParams, context?: InstructorsApiScopeContext) =>
    [...instructorKeys.all, params, context?.centerId ?? null] as const,
  detail: (
    instructorId: string | number | null | undefined,
    context?: InstructorsApiScopeContext,
  ) =>
    [
      ...instructorKeys.all,
      "detail",
      instructorId ?? null,
      context?.centerId ?? null,
    ] as const,
};

type UseInstructorsOptions = Omit<
  UseQueryOptions<PaginatedResponse<Instructor>>,
  "queryKey" | "queryFn"
>;

type UseInstructorOptions = Omit<
  UseQueryOptions<Instructor | null>,
  "queryKey" | "queryFn"
>;

export function useInstructors(
  params: ListInstructorsParams,
  context?: InstructorsApiScopeContext,
  options?: UseInstructorsOptions,
) {
  return useQuery({
    queryKey: instructorKeys.list(params, context),
    queryFn: () => listInstructors(params, context),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useInstructor(
  instructorId: string | number | null | undefined,
  context?: InstructorsApiScopeContext,
  options?: UseInstructorOptions,
) {
  return useQuery({
    queryKey: instructorKeys.detail(instructorId, context),
    queryFn: () => getInstructor(instructorId!, context),
    enabled:
      Boolean(instructorId) &&
      Boolean(context?.centerId) &&
      (options?.enabled ?? true),
    ...options,
  });
}

export function useCreateInstructor(context?: InstructorsApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      avatar,
    }: {
      payload: CreateInstructorPayload;
      avatar?: File | Blob;
    }) => createInstructor(payload, context, avatar),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.all });
    },
  });
}

export function useUpdateInstructor(context?: InstructorsApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      instructorId,
      payload,
    }: {
      instructorId: string | number;
      payload: CreateInstructorPayload;
    }) => updateInstructor(instructorId, payload, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.all });
    },
  });
}

export function useDeleteInstructor(context?: InstructorsApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (instructorId: string | number) =>
      deleteInstructor(instructorId, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.all });
    },
  });
}

export function useUploadInstructorAvatar(
  context?: InstructorsApiScopeContext,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      instructorId,
      avatarFile,
    }: {
      instructorId: string | number;
      avatarFile: File | Blob;
    }) => uploadInstructorAvatar(instructorId, avatarFile, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.all });
    },
  });
}
