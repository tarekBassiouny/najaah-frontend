import { http } from "@/lib/http";
import type {
  LandingPageHero,
  LandingPageAbout,
  LandingPagePayload,
  LandingPageTestimonial,
} from "@/features/centers/types/landing-page";

const baseLandingPagePath = (centerId: string | number) =>
  `/api/v1/admin/centers/${centerId}/landing-page`;

type LandingPageResponse<T> = T | { data: T };

function unwrap<T>(
  payload: LandingPageResponse<T> | null | undefined,
): T | null {
  if (!payload) {
    return null;
  }

  if (typeof payload === "object" && "data" in payload) {
    const candidate = payload as { data: T };
    return candidate.data ?? null;
  }

  return payload as T;
}

export async function fetchLandingPage(centerId: string | number) {
  const url = baseLandingPagePath(centerId);
  const response = await http.get<LandingPageResponse<LandingPagePayload>>(url);
  return unwrap<LandingPagePayload>(response.data);
}

export async function updateLandingPageSection(
  centerId: string | number,
  section: "hero" | "about" | "contact" | string,
  payload: Partial<LandingPageHero & LandingPageAbout & LandingPagePayload>,
) {
  const url = `${baseLandingPagePath(centerId)}/sections/${section}`;
  const response = await http.patch<LandingPageResponse<LandingPagePayload>>(
    url,
    payload,
  );
  return unwrap<LandingPagePayload>(response.data);
}

const landingPageTestimonialsPath = (centerId: string | number) =>
  `${baseLandingPagePath(centerId)}/testimonials`;

export async function createTestimonial(
  centerId: string | number,
  payload: Partial<LandingPageTestimonial>,
) {
  const url = landingPageTestimonialsPath(centerId);
  const response = await http.post<LandingPageResponse<LandingPagePayload>>(
    url,
    payload,
  );
  return unwrap<LandingPagePayload>(response.data);
}

export async function updateTestimonial(
  centerId: string | number,
  testimonialId: number,
  payload: Partial<LandingPageTestimonial>,
) {
  const url = `${landingPageTestimonialsPath(centerId)}/${testimonialId}`;
  const response = await http.put<LandingPageResponse<LandingPagePayload>>(
    url,
    payload,
  );
  return unwrap<LandingPagePayload>(response.data);
}

export async function deleteTestimonial(
  centerId: string | number,
  testimonialId: number,
) {
  const url = `${landingPageTestimonialsPath(centerId)}/${testimonialId}`;
  const response =
    await http.delete<LandingPageResponse<LandingPagePayload>>(url);
  return unwrap<LandingPagePayload>(response.data);
}

export async function reorderTestimonials(
  centerId: string | number,
  testimonialIds: number[],
) {
  const url = `${landingPageTestimonialsPath(centerId)}/reorder`;
  const response = await http.post<LandingPageResponse<LandingPagePayload>>(
    url,
    {
      testimonial_ids: testimonialIds,
    },
  );
  return unwrap<LandingPagePayload>(response.data);
}

export type LandingPagePreviewResponse = {
  token?: string;
  preview_url?: string;
  expires_in_minutes?: number;
};

export async function requestLandingPagePreviewToken(
  centerId: string | number,
) {
  const url = `${baseLandingPagePath(centerId)}/preview-token`;
  const response =
    await http.post<LandingPageResponse<LandingPagePreviewResponse>>(url);
  return unwrap<LandingPagePreviewResponse>(response.data);
}
