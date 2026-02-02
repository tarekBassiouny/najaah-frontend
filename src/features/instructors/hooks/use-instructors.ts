import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  listInstructors,
  type ListInstructorsParams,
} from "../services/instructors.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { Instructor } from "@/features/instructors/types/instructor";

type UseInstructorsOptions = Omit<
  UseQueryOptions<PaginatedResponse<Instructor>>,
  "queryKey" | "queryFn"
>;

export function useInstructors(
  params: ListInstructorsParams,
  options?: UseInstructorsOptions,
) {
  return useQuery({
    queryKey: ["instructors", params],
    queryFn: () => listInstructors(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}
