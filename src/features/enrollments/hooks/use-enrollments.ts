import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  BulkEnrollmentsPayload,
  BulkEnrollmentResult,
  BulkEnrollmentStatusPayload,
  CreateCenterEnrollmentPayload,
  Enrollment,
  ListEnrollmentsParams,
  CreateEnrollmentPayload,
  UpdateEnrollmentPayload,
} from "@/features/enrollments/types/enrollment";
import {
  bulkEnrollments,
  bulkUpdateEnrollmentStatus,
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
  params: ListEnrollmentsParams & { centerScopeId?: string | number | null },
  options?: UseEnrollmentsOptions,
) {
  const { centerScopeId, ...queryParams } = params;
  return useQuery({
    queryKey: ["enrollments", params],
    queryFn: () => listEnrollments(queryParams, centerScopeId),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useEnrollment(
  enrollmentId: string | number | undefined,
  centerId?: string | number | null,
  options?: UseEnrollmentOptions,
) {
  return useQuery({
    queryKey: ["enrollment", centerId ?? null, enrollmentId],
    queryFn: () => getEnrollment(enrollmentId!, centerId),
    enabled: !!enrollmentId,
    ...options,
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      centerId,
    }: {
      payload: CreateEnrollmentPayload;
      centerId?: string | number | null;
    }) => createEnrollment(payload, centerId),
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
      centerId,
    }: {
      enrollmentId: string | number;
      payload: UpdateEnrollmentPayload;
      centerId?: string | number | null;
    }) => updateEnrollment(enrollmentId, payload, centerId),
    onSuccess: (_, { enrollmentId }) => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["enrollment", enrollmentId] });
    },
  });
}

export function useDeleteEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      enrollmentId,
      centerId,
    }: {
      enrollmentId: string | number;
      centerId?: string | number | null;
    }) => deleteEnrollment(enrollmentId, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}

export function useBulkEnrollments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      centerId,
    }: {
      payload: BulkEnrollmentsPayload;
      centerId?: string | number | null;
    }) => bulkEnrollments(payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}

export function useBulkUpdateEnrollmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      centerId,
    }: {
      payload: BulkEnrollmentStatusPayload;
      centerId?: string | number | null;
    }): Promise<BulkEnrollmentResult> =>
      bulkUpdateEnrollmentStatus(payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}
