import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  CreateCenterEnrollmentPayload,
  Enrollment,
  ListEnrollmentsParams,
  CreateEnrollmentPayload,
  UpdateEnrollmentPayload,
} from "@/features/enrollments/types/enrollment";
import {
  createCenterEnrollment,
  createEnrollment,
  deleteEnrollment,
  getEnrollment,
  listEnrollments,
  updateEnrollment,
} from "@/features/enrollments/services/enrollments.service";

type UseEnrollmentsOptions = Omit<
  UseQueryOptions<PaginatedResponse<Enrollment>>,
  "queryKey" | "queryFn"
>;

type UseEnrollmentOptions = Omit<
  UseQueryOptions<Enrollment | null>,
  "queryKey" | "queryFn"
>;

export function useEnrollments(
  params: ListEnrollmentsParams,
  options?: UseEnrollmentsOptions,
) {
  return useQuery({
    queryKey: ["enrollments", params],
    queryFn: () => listEnrollments(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useEnrollment(
  enrollmentId: string | number | undefined,
  options?: UseEnrollmentOptions,
) {
  return useQuery({
    queryKey: ["enrollment", enrollmentId],
    queryFn: () => getEnrollment(enrollmentId!),
    enabled: !!enrollmentId,
    ...options,
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEnrollmentPayload) => createEnrollment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}

export function useCreateCenterEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      payload,
    }: {
      centerId: string | number;
      payload: CreateCenterEnrollmentPayload;
    }) => createCenterEnrollment(centerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}

export function useUpdateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      enrollmentId,
      payload,
    }: {
      enrollmentId: string | number;
      payload: UpdateEnrollmentPayload;
    }) => updateEnrollment(enrollmentId, payload),
    onSuccess: (_, { enrollmentId }) => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["enrollment", enrollmentId] });
    },
  });
}

export function useDeleteEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enrollmentId: string | number) =>
      deleteEnrollment(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}
