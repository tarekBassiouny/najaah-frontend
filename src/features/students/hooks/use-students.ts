import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  bulkEnrollStudents,
  bulkUpdateStudentStatus,
  createStudent,
  deleteStudent,
  getStudentProfile,
  listStudents,
  updateStudent,
  type CreateStudentPayload,
  type BulkEnrollStudentsPayload,
  type ListStudentsParams,
  type UpdateStudentPayload,
  type BulkStudentStatusPayload,
  type StudentsApiScopeContext,
} from "../services/students.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { Student, StudentProfile } from "@/features/students/types/student";

export const studentKeys = {
  all: ["students"] as const,
  list: (params: ListStudentsParams, context?: StudentsApiScopeContext) =>
    [...studentKeys.all, params, context?.centerId ?? null] as const,
  profile: (
    studentId: string | number,
    context?: StudentsApiScopeContext,
  ) =>
    [
      ...studentKeys.all,
      "profile",
      studentId,
      context?.centerId ?? null,
    ] as const,
};

type UseStudentsOptions = Omit<
  UseQueryOptions<PaginatedResponse<Student>>,
  "queryKey" | "queryFn"
>;

export function useStudents(
  params: ListStudentsParams,
  context?: StudentsApiScopeContext,
  options?: UseStudentsOptions,
) {
  return useQuery({
    queryKey: studentKeys.list(params, context),
    queryFn: () => listStudents(params, context),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useCreateStudent(context?: StudentsApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStudentPayload) =>
      createStudent(payload, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
    },
  });
}

export function useUpdateStudent(context?: StudentsApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      payload,
    }: {
      studentId: string | number;
      payload: UpdateStudentPayload;
    }) => updateStudent(studentId, payload, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
    },
  });
}

export function useDeleteStudent(context?: StudentsApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string | number) =>
      deleteStudent(studentId, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
    },
  });
}

export function useBulkEnrollStudents() {
  return useMutation({
    mutationFn: (payload: BulkEnrollStudentsPayload) =>
      bulkEnrollStudents(payload),
  });
}

export function useBulkUpdateStudentStatus(context?: StudentsApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkStudentStatusPayload) =>
      bulkUpdateStudentStatus(payload, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
    },
  });
}

type UseStudentProfileOptions = Omit<
  UseQueryOptions<StudentProfile | null>,
  "queryKey" | "queryFn"
>;

export function useStudentProfile(
  studentId: string | number,
  context?: StudentsApiScopeContext,
  options?: UseStudentProfileOptions,
) {
  return useQuery({
    queryKey: studentKeys.profile(studentId, context),
    queryFn: () => getStudentProfile(studentId, context),
    ...options,
  });
}
