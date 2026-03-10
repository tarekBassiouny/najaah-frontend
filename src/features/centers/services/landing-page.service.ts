import { http } from "@/lib/http";
import type {
  LandingPageMeta,
  LandingPageHero,
  LandingPageAbout,
  LandingPageContact,
  LandingPagePayload,
  LandingPageSocial,
  LandingPageStyling,
  LandingPageTestimonial,
  LandingPageVisibility,
} from "@/features/centers/types/landing-page";
import { normalizeLandingPagePayload } from "@/features/landing-page/lib/landing-page-normalizers";

const baseLandingPagePath = (centerId: string | number) =>
  `/api/v1/admin/centers/${centerId}/landing-page`;

type LandingPageResponse<T> = T | { data: T };

type LandingPageRequestConfig = {
  headers?: {
    "X-Api-Key": string;
  };
};

export type LandingPageMediaUploadPayload = {
  file: File | Blob;
  filename?: string;
};

export type LandingPageMediaUploadResult = {
  url?: string | null;
  landingPage?: LandingPagePayload | null;
};

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

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

function unwrapMediaUpload(payload: unknown): LandingPageMediaUploadResult {
  const root =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null;
  const data =
    root?.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;

  return {
    url: readString(data?.url),
    landingPage: normalizeLandingPagePayload(data?.landing_page),
  };
}

function withTenantApiKey(
  apiKey?: string,
): LandingPageRequestConfig | undefined {
  if (!apiKey) {
    return undefined;
  }

  return {
    headers: {
      "X-Api-Key": apiKey,
    },
  };
}

export async function fetchLandingPage(
  centerId: string | number,
  apiKey?: string,
) {
  const url = baseLandingPagePath(centerId);
  const response = await http.get<LandingPageResponse<LandingPagePayload>>(
    url,
    withTenantApiKey(apiKey),
  );
  return normalizeLandingPagePayload(unwrap<LandingPagePayload>(response.data));
}

export async function updateLandingPageSection(
  centerId: string | number,
  section:
    | "meta"
    | "hero"
    | "about"
    | "contact"
    | "social"
    | "styling"
    | "visibility"
    | string,
  payload: Partial<
    LandingPageMeta &
      LandingPageHero &
      LandingPageAbout &
      LandingPageContact &
      LandingPageSocial &
      LandingPageStyling &
      LandingPageVisibility &
      LandingPagePayload
  >,
  apiKey?: string,
) {
  const url = `${baseLandingPagePath(centerId)}/sections/${section}`;
  const response = await http.patch<LandingPageResponse<LandingPagePayload>>(
    url,
    payload,
    withTenantApiKey(apiKey),
  );
  return normalizeLandingPagePayload(unwrap<LandingPagePayload>(response.data));
}

const landingPageTestimonialsPath = (centerId: string | number) =>
  `${baseLandingPagePath(centerId)}/testimonials`;

export async function createTestimonial(
  centerId: string | number,
  payload: Partial<LandingPageTestimonial>,
  apiKey?: string,
) {
  const url = landingPageTestimonialsPath(centerId);
  const response = await http.post<LandingPageResponse<LandingPagePayload>>(
    url,
    payload,
    withTenantApiKey(apiKey),
  );
  return normalizeLandingPagePayload(unwrap<LandingPagePayload>(response.data));
}

export async function updateTestimonial(
  centerId: string | number,
  testimonialId: number,
  payload: Partial<LandingPageTestimonial>,
  apiKey?: string,
) {
  const url = `${landingPageTestimonialsPath(centerId)}/${testimonialId}`;
  const response = await http.put<LandingPageResponse<LandingPagePayload>>(
    url,
    payload,
    withTenantApiKey(apiKey),
  );
  return normalizeLandingPagePayload(unwrap<LandingPagePayload>(response.data));
}

export async function deleteTestimonial(
  centerId: string | number,
  testimonialId: number,
  apiKey?: string,
) {
  const url = `${landingPageTestimonialsPath(centerId)}/${testimonialId}`;
  const response = await http.delete<LandingPageResponse<LandingPagePayload>>(
    url,
    withTenantApiKey(apiKey),
  );
  return normalizeLandingPagePayload(unwrap<LandingPagePayload>(response.data));
}

export async function reorderTestimonials(
  centerId: string | number,
  testimonialIds: number[],
  apiKey?: string,
) {
  const url = `${landingPageTestimonialsPath(centerId)}/reorder`;
  const response = await http.post<LandingPageResponse<LandingPagePayload>>(
    url,
    {
      testimonial_ids: testimonialIds,
    },
    withTenantApiKey(apiKey),
  );
  return normalizeLandingPagePayload(unwrap<LandingPagePayload>(response.data));
}

export type LandingPagePreviewResponse = {
  token?: string;
  preview_url?: string;
  expires_in_minutes?: number;
};

export async function publishLandingPage(
  centerId: string | number,
  apiKey?: string,
) {
  const url = `${baseLandingPagePath(centerId)}/publish`;
  const response = await http.post<LandingPageResponse<LandingPagePayload>>(
    url,
    undefined,
    withTenantApiKey(apiKey),
  );
  return normalizeLandingPagePayload(unwrap<LandingPagePayload>(response.data));
}

export async function unpublishLandingPage(
  centerId: string | number,
  apiKey?: string,
) {
  const url = `${baseLandingPagePath(centerId)}/unpublish`;
  const response = await http.post<LandingPageResponse<LandingPagePayload>>(
    url,
    undefined,
    withTenantApiKey(apiKey),
  );
  return normalizeLandingPagePayload(unwrap<LandingPagePayload>(response.data));
}

async function uploadLandingPageImage(
  centerId: string | number,
  endpoint: string,
  payload: LandingPageMediaUploadPayload,
  apiKey?: string,
) {
  const formData = new FormData();
  if (payload.filename) {
    formData.append("image", payload.file, payload.filename);
  } else {
    formData.append("image", payload.file);
  }

  const response = await http.post(
    `${baseLandingPagePath(centerId)}/media/${endpoint}`,
    formData,
    {
      ...withTenantApiKey(apiKey),
      headers: {
        ...withTenantApiKey(apiKey)?.headers,
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return unwrapMediaUpload(response.data);
}

export async function uploadHeroBackground(
  centerId: string | number,
  payload: LandingPageMediaUploadPayload,
  apiKey?: string,
) {
  return uploadLandingPageImage(centerId, "hero-background", payload, apiKey);
}

export async function uploadAboutImage(
  centerId: string | number,
  payload: LandingPageMediaUploadPayload,
  apiKey?: string,
) {
  return uploadLandingPageImage(centerId, "about-image", payload, apiKey);
}

export async function uploadTestimonialImage(
  centerId: string | number,
  payload: LandingPageMediaUploadPayload,
  apiKey?: string,
) {
  return uploadLandingPageImage(centerId, "testimonial-image", payload, apiKey);
}

export async function requestLandingPagePreviewToken(
  centerId: string | number,
  apiKey?: string,
) {
  const url = `${baseLandingPagePath(centerId)}/preview-token`;
  const response = await http.post<
    LandingPageResponse<LandingPagePreviewResponse>
  >(url, undefined, withTenantApiKey(apiKey));
  return unwrap<LandingPagePreviewResponse>(response.data);
}
