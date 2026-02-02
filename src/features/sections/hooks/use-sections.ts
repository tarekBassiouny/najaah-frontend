import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  attachSectionPdf,
  attachSectionVideo,
  createSection,
  createSectionWithStructure,
  deleteSection,
  deleteSectionWithStructure,
  detachSectionPdf,
  detachSectionVideo,
  getSection,
  getSectionPdf,
  getSectionVideo,
  listSectionPdfs,
  listSectionVideos,
  listSections,
  publishSection,
  reorderSections,
  restoreSection,
  toggleSectionVisibility,
  unpublishSection,
  updateSection,
  updateSectionWithStructure,
} from "@/features/sections/services/sections.service";
import type {
  ListSectionsParams,
  ReorderSectionsPayload,
  Section,
  SectionMediaItem,
  SectionPayload,
  SectionStructurePayload,
  SectionsResponse,
} from "@/features/sections/types/section";

type UseSectionsOptions = Omit<
  UseQueryOptions<SectionsResponse>,
  "queryKey" | "queryFn"
>;

type UseSectionOptions = Omit<UseQueryOptions<Section>, "queryKey" | "queryFn">;

type UseSectionMediaOptions = Omit<
  UseQueryOptions<SectionMediaItem[]>,
  "queryKey" | "queryFn"
>;

type UseSectionMediaItemOptions = Omit<
  UseQueryOptions<SectionMediaItem>,
  "queryKey" | "queryFn"
>;

export function useSections(
  centerId: string | number | undefined,
  courseId: string | number | undefined,
  params: ListSectionsParams = {},
  options?: UseSectionsOptions,
) {
  return useQuery({
    queryKey: ["sections", centerId, courseId, params],
    queryFn: () => listSections(centerId!, courseId!, params),
    enabled: !!centerId && !!courseId,
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useSection(
  centerId: string | number | undefined,
  courseId: string | number | undefined,
  sectionId: string | number | undefined,
  options?: UseSectionOptions,
) {
  return useQuery({
    queryKey: ["section", centerId, courseId, sectionId],
    queryFn: () => getSection(centerId!, courseId!, sectionId!),
    enabled: !!centerId && !!courseId && !!sectionId,
    ...options,
  });
}

export function useCreateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      payload,
    }: {
      centerId: string | number;
      courseId: string | number;
      payload: SectionPayload;
    }) => createSection(centerId, courseId, payload),
    onSuccess: (_, { centerId, courseId }) => {
      queryClient.invalidateQueries({
        queryKey: ["sections", centerId, courseId],
      });
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      sectionId,
      payload,
    }: {
      centerId: string | number;
      courseId: string | number;
      sectionId: string | number;
      payload: SectionPayload;
    }) => updateSection(centerId, courseId, sectionId, payload),
    onSuccess: (_, { centerId, courseId, sectionId }) => {
      queryClient.invalidateQueries({
        queryKey: ["sections", centerId, courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["section", centerId, courseId, sectionId],
      });
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      sectionId,
    }: {
      centerId: string | number;
      courseId: string | number;
      sectionId: string | number;
    }) => deleteSection(centerId, courseId, sectionId),
    onSuccess: (_, { centerId, courseId }) => {
      queryClient.invalidateQueries({
        queryKey: ["sections", centerId, courseId],
      });
    },
  });
}

export function useRestoreSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      sectionId,
    }: {
      centerId: string | number;
      courseId: string | number;
      sectionId: string | number;
    }) => restoreSection(centerId, courseId, sectionId),
    onSuccess: (_, { centerId, courseId, sectionId }) => {
      queryClient.invalidateQueries({
        queryKey: ["sections", centerId, courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["section", centerId, courseId, sectionId],
      });
    },
  });
}

export function useToggleSectionVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      sectionId,
    }: {
      centerId: string | number;
      courseId: string | number;
      sectionId: string | number;
    }) => toggleSectionVisibility(centerId, courseId, sectionId),
    onSuccess: (_, { centerId, courseId, sectionId }) => {
      queryClient.invalidateQueries({
        queryKey: ["sections", centerId, courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["section", centerId, courseId, sectionId],
      });
    },
  });
}

export function useReorderSections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      payload,
    }: {
      centerId: string | number;
      courseId: string | number;
      payload: ReorderSectionsPayload;
    }) => reorderSections(centerId, courseId, payload),
    onSuccess: (_, { centerId, courseId }) => {
      queryClient.invalidateQueries({
        queryKey: ["sections", centerId, courseId],
      });
    },
  });
}

export function useCreateSectionWithStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      payload,
    }: {
      centerId: string | number;
      courseId: string | number;
      payload: SectionStructurePayload;
    }) => createSectionWithStructure(centerId, courseId, payload),
    onSuccess: (_, { centerId, courseId }) => {
      queryClient.invalidateQueries({
        queryKey: ["sections", centerId, courseId],
      });
    },
  });
}

export function useUpdateSectionWithStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      sectionId,
      payload,
    }: {
      centerId: string | number;
      courseId: string | number;
      sectionId: string | number;
      payload: SectionStructurePayload;
    }) => updateSectionWithStructure(centerId, courseId, sectionId, payload),
    onSuccess: (_, { centerId, courseId, sectionId }) => {
      queryClient.invalidateQueries({
        queryKey: ["sections", centerId, courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["section", centerId, courseId, sectionId],
      });
    },
  });
}

export function useDeleteSectionWithStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      sectionId,
    }: {
      centerId: string | number;
      courseId: string | number;
      sectionId: string | number;
    }) => deleteSectionWithStructure(centerId, courseId, sectionId),
    onSuccess: (_, { centerId, courseId, sectionId }) => {
      queryClient.invalidateQueries({
        queryKey: ["sections", centerId, courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["section", centerId, courseId, sectionId],
      });
    },
  });
}

export function useSectionVideos(
  centerId: string | number | undefined,
  courseId: string | number | undefined,
  sectionId: string | number | undefined,
  options?: UseSectionMediaOptions,
) {
  return useQuery({
    queryKey: ["section-videos", centerId, courseId, sectionId],
    queryFn: () => listSectionVideos(centerId!, courseId!, sectionId!),
    enabled: !!centerId && !!courseId && !!sectionId,
    ...options,
  });
}

export function useSectionVideo(
  centerId: string | number | undefined,
  courseId: string | number | undefined,
  sectionId: string | number | undefined,
  videoId: string | number | undefined,
  options?: UseSectionMediaItemOptions,
) {
  return useQuery({
    queryKey: ["section-video", centerId, courseId, sectionId, videoId],
    queryFn: () => getSectionVideo(centerId!, courseId!, sectionId!, videoId!),
    enabled: !!centerId && !!courseId && !!sectionId && !!videoId,
    ...options,
  });
}

export function useAttachSectionVideo() {
  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      sectionId,
      payload,
    }: {
      centerId: string | number;
      courseId: string | number;
      sectionId: string | number;
      payload: { video_id: string | number; [key: string]: unknown };
    }) => attachSectionVideo(centerId, courseId, sectionId, payload),
  });
}

export function useDetachSectionVideo() {
  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      sectionId,
      videoId,
    }: {
      centerId: string | number;
      courseId: string | number;
      sectionId: string | number;
      videoId: string | number;
    }) => detachSectionVideo(centerId, courseId, sectionId, videoId),
  });
}

export function useSectionPdfs(
  centerId: string | number | undefined,
  courseId: string | number | undefined,
  sectionId: string | number | undefined,
  options?: UseSectionMediaOptions,
) {
  return useQuery({
    queryKey: ["section-pdfs", centerId, courseId, sectionId],
    queryFn: () => listSectionPdfs(centerId!, courseId!, sectionId!),
    enabled: !!centerId && !!courseId && !!sectionId,
    ...options,
  });
}

export function useSectionPdf(
  centerId: string | number | undefined,
  courseId: string | number | undefined,
  sectionId: string | number | undefined,
  pdfId: string | number | undefined,
  options?: UseSectionMediaItemOptions,
) {
  return useQuery({
    queryKey: ["section-pdf", centerId, courseId, sectionId, pdfId],
    queryFn: () => getSectionPdf(centerId!, courseId!, sectionId!, pdfId!),
    enabled: !!centerId && !!courseId && !!sectionId && !!pdfId,
    ...options,
  });
}

export function useAttachSectionPdf() {
  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      sectionId,
      payload,
    }: {
      centerId: string | number;
      courseId: string | number;
      sectionId: string | number;
      payload: { pdf_id: string | number; [key: string]: unknown };
    }) => attachSectionPdf(centerId, courseId, sectionId, payload),
  });
}

export function useDetachSectionPdf() {
  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      sectionId,
      pdfId,
    }: {
      centerId: string | number;
      courseId: string | number;
      sectionId: string | number;
      pdfId: string | number;
    }) => detachSectionPdf(centerId, courseId, sectionId, pdfId),
  });
}

export function usePublishSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      sectionId,
    }: {
      centerId: string | number;
      courseId: string | number;
      sectionId: string | number;
    }) => publishSection(centerId, courseId, sectionId),
    onSuccess: (_, { centerId, courseId, sectionId }) => {
      queryClient.invalidateQueries({
        queryKey: ["sections", centerId, courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["section", centerId, courseId, sectionId],
      });
    },
  });
}

export function useUnpublishSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      sectionId,
    }: {
      centerId: string | number;
      courseId: string | number;
      sectionId: string | number;
    }) => unpublishSection(centerId, courseId, sectionId),
    onSuccess: (_, { centerId, courseId, sectionId }) => {
      queryClient.invalidateQueries({
        queryKey: ["sections", centerId, courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["section", centerId, courseId, sectionId],
      });
    },
  });
}
