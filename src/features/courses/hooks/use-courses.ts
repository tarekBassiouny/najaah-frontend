import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  listCourses,
  type CoursesResponse,
  type ListCoursesParams,
} from "../services/courses.service";

type UseCoursesOptions = Omit<
  UseQueryOptions<CoursesResponse>,
  "queryKey" | "queryFn"
>;

export function useCourses(
  params: ListCoursesParams,
  options?: UseCoursesOptions,
) {
  return useQuery({
    queryKey: ["courses", params.page, params.per_page, params.search || ""],
    queryFn: () => listCourses(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}
