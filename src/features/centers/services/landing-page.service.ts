import { http } from "@/lib/http";
import type {
  LandingPageResource,
  LandingPageSection,
  LandingPageSectionPayload,
  LandingPageTestimonial,
  LandingPageTestimonialPayload,
  LandingPagePreviewToken,
} from "@/features/centers/types/landing-page";

const BASE_PATH = (centerId: string | number) =>
  `/api/v1/admin/centers/${centerId}/landing-page`;

type RawLandingPageResponse = {
  data?: LandingPageResource;
  landing_page?: LandingPageResource;
} & Record<string, unknown>;

type LandingPageResponseContainer =
  | LandingPageResource
  | RawLandingPageResponse;

function normalizeLandingPageResponse(
  raw?: LandingPageResponseContainer | null,
): LandingPageResource {
  if (!raw || typeof raw !== "object") {
    throw new Error("Missing landing page payload");
  }

  const payload =
    ("landing_page" in raw && raw.landing_page) ||
    ("data" in raw && raw.data) ||
    raw;

  if (!payload) {
    throw new Error("Missing landing page payload");
  }

  return payload as LandingPageResource;
}

export async function getLandingPage(
  centerId: string | number,
): Promise<LandingPageResource> {
  const { data } = await http.get<LandingPageResponseContainer>(
    `${BASE_PATH(centerId)}`,
  );
  return normalizeLandingPageResponse(data);
}

async function patchLandingPageSection(
  centerId: string | number,
  section: LandingPageSection,
  payload: LandingPageSectionPayload,
): Promise<LandingPageResource> {
  const { data } = await http.patch<LandingPageResponseContainer>(
    `${BASE_PATH(centerId)}/sections/${section}`,
    payload,
  );

  return normalizeLandingPageResponse(data);
}

export const updateLandingPageMeta = (
  centerId: string | number,
  payload: LandingPageSectionPayload,
) => patchLandingPageSection(centerId, "meta", payload);

export const updateLandingPageHero = (
  centerId: string | number,
  payload: LandingPageSectionPayload,
) => patchLandingPageSection(centerId, "hero", payload);

export const updateLandingPageAbout = (
  centerId: string | number,
  payload: LandingPageSectionPayload,
) => patchLandingPageSection(centerId, "about", payload);

export const updateLandingPageContact = (
  centerId: string | number,
  payload: LandingPageSectionPayload,
) => patchLandingPageSection(centerId, "contact", payload);

export const updateLandingPageSocial = (
  centerId: string | number,
  payload: LandingPageSectionPayload,
) => patchLandingPageSection(centerId, "social", payload);

export const updateLandingPageStyling = (
  centerId: string | number,
  payload: LandingPageSectionPayload,
) => patchLandingPageSection(centerId, "styling", payload);

export const updateLandingPageVisibility = (
  centerId: string | number,
  payload: LandingPageSectionPayload,
) => patchLandingPageSection(centerId, "visibility", payload);

export async function publishLandingPage(
  centerId: string | number,
): Promise<LandingPageResource> {
  const { data } = await http.post<LandingPageResponseContainer>(
    `${BASE_PATH(centerId)}/publish`,
  );
  return normalizeLandingPageResponse(data);
}

export async function unpublishLandingPage(
  centerId: string | number,
): Promise<LandingPageResource> {
  const { data } = await http.post<LandingPageResponseContainer>(
    `${BASE_PATH(centerId)}/unpublish`,
  );
  return normalizeLandingPageResponse(data);
}

export async function generateLandingPagePreviewToken(
  centerId: string | number,
): Promise<LandingPagePreviewToken> {
  const { data } = await http.post<LandingPagePreviewToken>(
    `${BASE_PATH(centerId)}/preview-token`,
  );
  return data;
}

export async function uploadLandingPageHeroBackground(
  centerId: string | number,
  file: File,
): Promise<LandingPageResource> {
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await http.post<LandingPageResponseContainer>(
    `${BASE_PATH(centerId)}/media/hero-background`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return normalizeLandingPageResponse(data);
}

export async function uploadLandingPageAboutImage(
  centerId: string | number,
  file: File,
): Promise<LandingPageResource> {
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await http.post<LandingPageResponseContainer>(
    `${BASE_PATH(centerId)}/media/about-image`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return normalizeLandingPageResponse(data);
}

export async function uploadTestimonialImage(
  centerId: string | number,
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await http.post<Record<string, unknown>>(
    `${BASE_PATH(centerId)}/media/testimonial-image`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  if (typeof data === "object" && data !== null) {
    if (typeof data.url === "string") {
      return data.url;
    }
    if (typeof data.data === "object" && data.data !== null) {
      const nested = data.data as Record<string, unknown>;
      if (typeof nested.url === "string") {
        return nested.url;
      }
    }
  }

  throw new Error("Failed to upload testimonial image");
}

export async function listTestimonials(
  centerId: string | number,
): Promise<LandingPageTestimonial[]> {
  const { data } = await http.get<Record<string, unknown>>(
    `${BASE_PATH(centerId)}/testimonials`,
  );

  if (Array.isArray(data?.data)) {
    return data.data as LandingPageTestimonial[];
  }

  if (Array.isArray(data?.testimonials)) {
    return data.testimonials as LandingPageTestimonial[];
  }

  return [];
}

export async function createTestimonial(
  centerId: string | number,
  payload: LandingPageTestimonialPayload,
): Promise<LandingPageResource> {
  const { data } = await http.post<LandingPageResponseContainer>(
    `${BASE_PATH(centerId)}/testimonials`,
    payload,
  );
  return normalizeLandingPageResponse(data);
}

export async function updateTestimonial(
  centerId: string | number,
  testimonialId: number,
  payload: LandingPageTestimonialPayload,
): Promise<LandingPageResource> {
  const { data } = await http.put<LandingPageResponseContainer>(
    `${BASE_PATH(centerId)}/testimonials/${testimonialId}`,
    payload,
  );
  return normalizeLandingPageResponse(data);
}

export async function deleteTestimonial(
  centerId: string | number,
  testimonialId: number,
): Promise<LandingPageResource> {
  const { data } = await http.delete<LandingPageResponseContainer>(
    `${BASE_PATH(centerId)}/testimonials/${testimonialId}`,
  );
  return normalizeLandingPageResponse(data);
}

export async function reorderTestimonials(
  centerId: string | number,
  testimonialIds: number[],
): Promise<LandingPageResource> {
  const { data } = await http.post<LandingPageResponseContainer>(
    `${BASE_PATH(centerId)}/testimonials/reorder`,
    { testimonial_ids: testimonialIds },
  );
  return normalizeLandingPageResponse(data);
}
