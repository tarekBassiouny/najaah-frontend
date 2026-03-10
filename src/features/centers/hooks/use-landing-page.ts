import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createTestimonial,
  deleteTestimonial,
  fetchLandingPage,
  reorderTestimonials,
  requestLandingPagePreviewToken,
  updateLandingPageSection,
  updateTestimonial,
} from "@/features/centers/services/landing-page.service";
import type {
  LandingPagePayload,
  LandingPageTestimonial,
} from "@/features/centers/types/landing-page";

const landingPageKey = (centerId: string | number) => [
  "landing-page",
  centerId,
];

type LandingPageSection =
  | "meta"
  | "hero"
  | "about"
  | "contact"
  | "social"
  | "styling"
  | "visibility";

type SectionPayload = Partial<LandingPagePayload>;

type UseLandingPageOptions = Omit<
  UseQueryOptions<
    LandingPagePayload | null,
    unknown,
    LandingPagePayload | null
  >,
  "queryKey" | "queryFn"
>;

function syncLandingPageCache(
  queryClient: ReturnType<typeof useQueryClient>,
  centerId: string | number,
  payload: LandingPagePayload | null,
) {
  if (!payload) return;
  queryClient.setQueryData(landingPageKey(centerId), payload);
}

export function useLandingPage(
  centerId: string | number | undefined,
  options?: UseLandingPageOptions,
) {
  return useQuery({
    queryKey: centerId ? landingPageKey(centerId) : ["landing-page", null],
    queryFn: () => {
      if (!centerId) {
        throw new Error("Center ID is required for landing page query");
      }
      return fetchLandingPage(centerId);
    },
    enabled: Boolean(centerId),
    ...options,
  });
}

export function useLandingPageSectionMutation(
  centerId: string | number | undefined,
  section: LandingPageSection,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SectionPayload) => {
      if (!centerId) {
        throw new Error("Center ID is required to update landing page section");
      }
      return updateLandingPageSection(centerId, section, payload);
    },
    onSuccess: (data) => {
      if (!centerId) return;
      syncLandingPageCache(queryClient, centerId, data);
    },
  });
}

export function useLandingPagePreviewToken(
  centerId: string | number | undefined,
) {
  return useMutation({
    mutationFn: () => {
      if (!centerId) {
        throw new Error("Center ID is required to request preview token");
      }
      return requestLandingPagePreviewToken(centerId);
    },
  });
}

export function useLandingPageTestimonials(
  centerId: string | number | undefined,
) {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (payload: LandingPageTestimonial) => {
      if (!centerId) {
        throw new Error("Center ID is required to create testimonial");
      }
      return createTestimonial(centerId, payload);
    },
    onSuccess: (data) => {
      if (!centerId) return;
      syncLandingPageCache(queryClient, centerId, data);
    },
  });

  const update = useMutation({
    mutationFn: ({
      testimonialId,
      payload,
    }: {
      testimonialId: number;
      payload: LandingPageTestimonial;
    }) => {
      if (!centerId) {
        throw new Error("Center ID is required to update testimonial");
      }
      return updateTestimonial(centerId, testimonialId, payload);
    },
    onSuccess: (data) => {
      if (!centerId) return;
      syncLandingPageCache(queryClient, centerId, data);
    },
  });

  const remove = useMutation({
    mutationFn: (testimonialId: number) => {
      if (!centerId) {
        throw new Error("Center ID is required to delete testimonial");
      }
      return deleteTestimonial(centerId, testimonialId);
    },
    onSuccess: (data) => {
      if (!centerId) return;
      syncLandingPageCache(queryClient, centerId, data);
    },
  });

  const reorder = useMutation({
    mutationFn: (testimonialIds: number[]) => {
      if (!centerId) {
        throw new Error("Center ID is required to reorder testimonials");
      }
      return reorderTestimonials(centerId, testimonialIds);
    },
    onSuccess: (data) => {
      if (!centerId) return;
      syncLandingPageCache(queryClient, centerId, data);
    },
  });

  return {
    create,
    update,
    remove,
    reorder,
  };
}
