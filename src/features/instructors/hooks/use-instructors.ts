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
  type ListInstructorsParams,
} from "../services/instructors.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { Instructor } from "@/features/instructors/types/instructor";

export const instructorKeys = {
  all: ["instructors"] as const,
  list: (params: ListInstructorsParams) =>
    [...instructorKeys.all, params] as const,
};

type UseInstructorsOptions = Omit<
  UseQueryOptions<PaginatedResponse<Instructor>>,
  "queryKey" | "queryFn"
>;

export function useInstructors(
  params: ListInstructorsParams,
  options?: UseInstructorsOptions,
) {
  return useQuery({
    queryKey: instructorKeys.list(params),
    queryFn: () => listInstructors(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useCreateInstructor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInstructorPayload) => createInstructor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.all });
    },
  });
}

export function useUpdateInstructor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      instructorId,
      payload,
    }: {
      instructorId: string | number;
      payload: CreateInstructorPayload;
    }) => updateInstructor(instructorId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.all });
    },
  });
}

export function useDeleteInstructor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (instructorId: string | number) =>
      deleteInstructor(instructorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instructorKeys.all });
    },
  });
}
