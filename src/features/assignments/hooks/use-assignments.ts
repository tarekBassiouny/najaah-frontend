import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createCourseAssignment,
  deleteCenterAssignment,
  listCourseAssignments,
} from "@/features/assignments/services/assignments.service";
import type {
  CourseAssignmentsResponse,
  CreateCourseAssignmentPayload,
  ListCourseAssignmentsParams,
} from "@/features/assignments/types/assignment";

type UseCourseAssignmentsOptions = Omit<
  UseQueryOptions<CourseAssignmentsResponse>,
  "queryKey" | "queryFn"
>;

export function useCourseAssignments(
  params: ListCourseAssignmentsParams,
  options?: UseCourseAssignmentsOptions,
) {
  return useQuery({
    queryKey: ["course-assignments", params],
    queryFn: () => listCourseAssignments(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useCreateCourseAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      payload,
    }: {
      centerId: string | number;
      courseId: string | number;
      payload: CreateCourseAssignmentPayload;
    }) => createCourseAssignment(centerId, courseId, payload),
    onSuccess: (_, { centerId, courseId }) => {
      queryClient.invalidateQueries({
        queryKey: ["course-assignments", { centerId, courseId }],
      });
      queryClient.invalidateQueries({ queryKey: ["course-assignments"] });
      queryClient.invalidateQueries({
        queryKey: ["center-course", centerId, courseId],
      });
    },
  });
}

export function useDeleteCenterAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      assignmentId,
    }: {
      centerId: string | number;
      assignmentId: string | number;
    }) => deleteCenterAssignment(centerId, assignmentId),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({
        queryKey: ["course-assignments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["center-course", centerId],
      });
    },
  });
}
