import axios from "axios";
import { apiBaseUrl, defaultApiKey } from "@/lib/runtime-config";
import type { LandingPageResolveResource } from "@/features/landing-page/types/landing-page-resolve";

export type ResolveLandingPageParams = {
  slug: string;
  previewToken?: string;
  locale?: string;
};

type RawLandingPageResolveResponse = {
  data?: LandingPageResolveResource;
  landing_page?: LandingPageResolveResource;
} & Record<string, unknown>;

type LandingPageResolveResponseContainer =
  | RawLandingPageResolveResponse
  | LandingPageResolveResource;

function normalizeLandingPageResponse(
  raw?: LandingPageResolveResponseContainer | null,
): LandingPageResolveResource {
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

  return payload as LandingPageResolveResource;
}

export async function resolveLandingPage({
  slug,
  previewToken,
  locale,
}: ResolveLandingPageParams): Promise<LandingPageResolveResource> {
  const url = `${apiBaseUrl}/api/v1/resolve/landing-page/${slug}`;
  const params = previewToken ? { preview_token: previewToken } : undefined;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Api-Key": defaultApiKey,
  };
  if (locale) {
    headers["X-Locale"] = locale;
  }

  const { data } = await axios.get<LandingPageResolveResponseContainer>(url, {
    params,
    headers,
  });

  return normalizeLandingPageResponse(data);
}
