import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  generateLandingPagePreviewToken,
  getLandingPage,
  publishLandingPage,
  unpublishLandingPage,
  updateLandingPageAbout,
  updateLandingPageContact,
  updateLandingPageHero,
  updateLandingPageMeta,
  updateLandingPageSocial,
  updateLandingPageStyling,
  updateLandingPageVisibility,
  uploadLandingPageAboutImage,
  uploadLandingPageHeroBackground,
  uploadTestimonialImage,
  createTestimonial,
  deleteTestimonial,
  listTestimonials,
  reorderTestimonials,
  updateTestimonial,
} from "@/features/centers/services/landing-page.service";
import type {
  LandingPageResource,
  LandingPageSection,
  LandingPageSectionPayload,
  LandingPageTestimonialPayload,
} from "@/features/centers/types/landing-page";

const landingPageKey = (centerId: string | number) => [
  "landing-page",
  centerId,
];

type UseLandingPageOptions = Omit<
  UseQueryOptions<LandingPageResource, unknown, LandingPageResource>,
  "queryKey" | "queryFn"
>;

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
      return getLandingPage(centerId);
    },
    enabled: Boolean(centerId),
    ...options,
  });
}

const sectionMutators: Record<
  LandingPageSection,
  (
    _centerId: string | number,
    _payload: LandingPageSectionPayload,
  ) => Promise<LandingPageResource>
> = {
  meta: updateLandingPageMeta,
  hero: updateLandingPageHero,
  about: updateLandingPageAbout,
  contact: updateLandingPageContact,
  social: updateLandingPageSocial,
  styling: updateLandingPageStyling,
  visibility: updateLandingPageVisibility,
};

function syncLandingPageCache(
  queryClient: ReturnType<typeof useQueryClient>,
  centerId: string | number,
  payload: LandingPageResource,
) {
  queryClient.setQueryData(landingPageKey(centerId), payload);
}

export function useLandingPageSectionMutation(
  centerId: string | number | undefined,
  section: LandingPageSection,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LandingPageSectionPayload) => {
      if (!centerId) {
        throw new Error("Center ID is required to update landing page section");
      }
      return sectionMutators[section](centerId, payload);
    },
    onSuccess: (data) => {
      if (!centerId) return;
      syncLandingPageCache(queryClient, centerId, data);
    },
  });
}

export function useLandingPagePublish(centerId: string | number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!centerId) {
        throw new Error("Center ID is required to publish landing page");
      }
      return publishLandingPage(centerId);
    },
    onSuccess: (data) => {
      if (!centerId) return;
      syncLandingPageCache(queryClient, centerId, data);
    },
  });
}

export function useLandingPageUnpublish(centerId: string | number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!centerId) {
        throw new Error("Center ID is required to unpublish landing page");
      }
      return unpublishLandingPage(centerId);
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
        throw new Error(
          "Center ID is required to generate landing page preview token",
        );
      }
      return generateLandingPagePreviewToken(centerId);
    },
  });
}

export function useLandingPageHeroBackgroundUpload(
  centerId: string | number | undefined,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      if (!centerId) {
        throw new Error("Center ID is required to upload hero background");
      }
      return uploadLandingPageHeroBackground(centerId, file);
    },
    onSuccess: (data) => {
      if (!centerId) return;
      syncLandingPageCache(queryClient, centerId, data);
    },
  });
}

export function useLandingPageAboutImageUpload(
  centerId: string | number | undefined,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      if (!centerId) {
        throw new Error("Center ID is required to upload about image");
      }
      return uploadLandingPageAboutImage(centerId, file);
    },
    onSuccess: (data) => {
      if (!centerId) return;
      syncLandingPageCache(queryClient, centerId, data);
    },
  });
}

export function useLandingPageTestimonialImageUpload(
  centerId: string | number | undefined,
) {
  return useMutation({
    mutationFn: (file: File) => {
      if (!centerId) {
        throw new Error("Center ID is required to upload testimonial image");
      }
      return uploadTestimonialImage(centerId, file);
    },
  });
}

export function useLandingPageTestimonials(
  centerId: string | number | undefined,
) {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (payload: LandingPageTestimonialPayload) => {
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
      payload: LandingPageTestimonialPayload;
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

  const list = useMutation({
    mutationFn: () => {
      if (!centerId) {
        throw new Error("Center ID is required to list testimonials");
      }
      return listTestimonials(centerId);
    },
  });

  return {
    create,
    update,
    remove,
    reorder,
    list,
  };
}
