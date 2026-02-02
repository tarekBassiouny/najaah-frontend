import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  listStudents,
  type ListStudentsParams,
} from "../services/students.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { Student } from "@/features/students/types/student";

type UseStudentsOptions = Omit<
  UseQueryOptions<PaginatedResponse<Student>>,
  "queryKey" | "queryFn"
>;

export function useStudents(
  params: ListStudentsParams,
  options?: UseStudentsOptions,
) {
  return useQuery({
    queryKey: ["students", params],
    queryFn: () => listStudents(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}
