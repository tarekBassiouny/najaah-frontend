import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  assignCoursePdf,
  assignCourseInstructor,
  assignCourseVideo,
  cloneCourse,
  createCenterCourse,
  listCourses,
  listCenterCourses,
  getCourse,
  getCenterCourse,
  createCourse,
  updateCourse,
  updateCenterCourse,
  deleteCourse,
  deleteCenterCourse,
  publishCourse,
  unpublishCourse,
  removeCoursePdf,
  removeCourseInstructor,
  removeCourseVideo,
  uploadCourseThumbnail,
  type CoursesResponse,
  type ListCoursesParams,
  type ListCenterCoursesParams,
  type CourseMediaAssignmentPayload,
  type CourseInstructorPayload,
  type CloneCourseOptions,
} from "../services/courses.service";
import type {
  Course,
  CreateCoursePayload,
  UpdateCoursePayload,
} from "@/features/courses/types/course";

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

export function useCenterCourses(
  params: ListCenterCoursesParams,
  options?: UseCoursesOptions,
) {
  return useQuery({
    queryKey: ["center-courses", params],
    queryFn: () => listCenterCourses(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}

type UseCourseOptions = Omit<UseQueryOptions<Course>, "queryKey" | "queryFn">;

export function useCourse(
  id: string | number | undefined,
  options?: UseCourseOptions,
) {
  return useQuery({
    queryKey: ["course", id],
    queryFn: () => getCourse(id!),
    enabled: !!id,
    ...options,
  });
}

export function useCenterCourse(
  centerId: string | number | undefined,
  courseId: string | number | undefined,
  options?: UseCourseOptions,
) {
  return useQuery({
    queryKey: ["center-course", centerId, courseId],
    queryFn: () => getCenterCourse(centerId!, courseId!),
    enabled: !!centerId && !!courseId,
    ...options,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCoursePayload) => createCourse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useCreateCenterCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      payload,
    }: {
      centerId: string | number;
      payload: CreateCoursePayload;
    }) => createCenterCourse(centerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["center-courses"] });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number;
      payload: UpdateCoursePayload;
    }) => updateCourse(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", variables.id] });
    },
  });
}

export function useUpdateCenterCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      payload,
    }: {
      centerId: string | number;
      courseId: string | number;
      payload: UpdateCoursePayload;
    }) => updateCenterCourse(centerId, courseId, payload),
    onSuccess: (_, { centerId, courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["center-courses"] });
      queryClient.invalidateQueries({
        queryKey: ["center-course", centerId, courseId],
      });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useDeleteCenterCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
    }: {
      centerId: string | number;
      courseId: string | number;
    }) => deleteCenterCourse(centerId, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["center-courses"] });
    },
  });
}

export function useCloneCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      options,
    }: {
      centerId: string | number;
      courseId: string | number;
      options?: CloneCourseOptions;
    }) => cloneCourse(centerId, courseId, options),
    onSuccess: (_, { centerId, courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["center-courses"] });
      queryClient.invalidateQueries({
        queryKey: ["center-course", centerId, courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    },
  });
}

export function usePublishCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
    }: {
      centerId: string | number;
      courseId: string | number;
    }) => publishCourse(centerId, courseId),
    onSuccess: (publishedCourse, { centerId, courseId }) => {
      queryClient.setQueryData(
        ["center-course", centerId, courseId],
        publishedCourse,
      );
      queryClient.setQueryData(["course", courseId], publishedCourse);

      queryClient.invalidateQueries({ queryKey: ["center-courses"] });
      queryClient.invalidateQueries({
        queryKey: ["center-course", centerId, courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    },
  });
}

export function useUnpublishCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
    }: {
      centerId: string | number;
      courseId: string | number;
    }) => unpublishCourse(centerId, courseId),
    onSuccess: (unpublishedCourse, { centerId, courseId }) => {
      queryClient.setQueryData(
        ["center-course", centerId, courseId],
        unpublishedCourse,
      );
      queryClient.setQueryData(["course", courseId], unpublishedCourse);

      queryClient.invalidateQueries({ queryKey: ["center-courses"] });
      queryClient.invalidateQueries({
        queryKey: ["center-course", centerId, courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    },
  });
}

export function useAssignCourseVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      payload,
    }: {
      centerId: string | number;
      courseId: string | number;
      payload: CourseMediaAssignmentPayload;
    }) => assignCourseVideo(centerId, courseId, payload),
    onSuccess: (_, { centerId, courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["center-courses"] });
      queryClient.invalidateQueries({
        queryKey: ["center-course", centerId, courseId],
      });
    },
  });
}

export function useRemoveCourseVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      videoId,
    }: {
      centerId: string | number;
      courseId: string | number;
      videoId: string | number;
    }) => removeCourseVideo(centerId, courseId, videoId),
    onSuccess: (_, { centerId, courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["center-courses"] });
      queryClient.invalidateQueries({
        queryKey: ["center-course", centerId, courseId],
      });
    },
  });
}

export function useAssignCoursePdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      payload,
    }: {
      centerId: string | number;
      courseId: string | number;
      payload: CourseMediaAssignmentPayload;
    }) => assignCoursePdf(centerId, courseId, payload),
    onSuccess: (_, { centerId, courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["center-courses"] });
      queryClient.invalidateQueries({
        queryKey: ["center-course", centerId, courseId],
      });
    },
  });
}

export function useRemoveCoursePdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      pdfId,
    }: {
      centerId: string | number;
      courseId: string | number;
      pdfId: string | number;
    }) => removeCoursePdf(centerId, courseId, pdfId),
    onSuccess: (_, { centerId, courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["center-courses"] });
      queryClient.invalidateQueries({
        queryKey: ["center-course", centerId, courseId],
      });
    },
  });
}

export function useAssignCourseInstructor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      payload,
    }: {
      centerId: string | number;
      courseId: string | number;
      payload: CourseInstructorPayload;
    }) => assignCourseInstructor(centerId, courseId, payload),
    onSuccess: (updatedCourse, { centerId, courseId }) => {
      queryClient.setQueryData(
        ["center-course", centerId, courseId],
        updatedCourse,
      );
      queryClient.invalidateQueries({ queryKey: ["center-courses"] });
      queryClient.invalidateQueries({
        queryKey: ["center-course", centerId, courseId],
      });
    },
  });
}

export function useRemoveCourseInstructor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      instructorId,
    }: {
      centerId: string | number;
      courseId: string | number;
      instructorId: string | number;
    }) => removeCourseInstructor(centerId, courseId, instructorId),
    onSuccess: (updatedCourse, { centerId, courseId }) => {
      queryClient.setQueryData(
        ["center-course", centerId, courseId],
        updatedCourse,
      );
      queryClient.invalidateQueries({ queryKey: ["center-courses"] });
      queryClient.invalidateQueries({
        queryKey: ["center-course", centerId, courseId],
      });
    },
  });
}

export function useUploadCourseThumbnail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      thumbnailFile,
    }: {
      centerId: string | number;
      courseId: string | number;
      thumbnailFile: File | Blob;
    }) => uploadCourseThumbnail(centerId, courseId, thumbnailFile),
    onSuccess: (_, { centerId, courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["center-courses"] });
      queryClient.invalidateQueries({
        queryKey: ["center-course", centerId, courseId],
      });
    },
  });
}
