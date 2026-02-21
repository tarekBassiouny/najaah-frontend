import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createInstructor,
  deleteInstructor,
  listInstructors,
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
};

type UseInstructorsOptions = Omit<
  UseQueryOptions<PaginatedResponse<Instructor>>,
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

export function useCreateInstructor(context?: InstructorsApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInstructorPayload) =>
      createInstructor(payload, context),
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
