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
  listStudents,
  updateStudent,
  type CreateStudentPayload,
  type BulkEnrollStudentsPayload,
  type ListStudentsParams,
  type UpdateStudentPayload,
  type BulkStudentStatusPayload,
} from "../services/students.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { Student } from "@/features/students/types/student";

export const studentKeys = {
  all: ["students"] as const,
  list: (params: ListStudentsParams) => [...studentKeys.all, params] as const,
};

type UseStudentsOptions = Omit<
  UseQueryOptions<PaginatedResponse<Student>>,
  "queryKey" | "queryFn"
>;

export function useStudents(
  params: ListStudentsParams,
  options?: UseStudentsOptions,
) {
  return useQuery({
    queryKey: studentKeys.list(params),
    queryFn: () => listStudents(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStudentPayload) => createStudent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      payload,
    }: {
      studentId: string | number;
      payload: UpdateStudentPayload;
    }) => updateStudent(studentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string | number) => deleteStudent(studentId),
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

export function useBulkUpdateStudentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkStudentStatusPayload) =>
      bulkUpdateStudentStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
    },
  });
}
