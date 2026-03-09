import axios from "axios";
import { apiBaseUrl, defaultApiKey } from "@/lib/runtime-config";
import type { LandingPageResolveResponse } from "@/features/landing-page/types/landing-page-resolve";

type LandingPageResponseWithData = {
  data?: LandingPageResolveResponse;
};

function unwrap(payload: unknown): LandingPageResolveResponse | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if ("data" in payload) {
    return ((payload as LandingPageResponseWithData).data ??
      null) as LandingPageResolveResponse | null;
  }

  return payload as LandingPageResolveResponse;
}

export async function resolveLandingPage(
  slug: string,
  options?: { locale?: string; previewToken?: string },
) {
  const url = `${apiBaseUrl}/api/v1/resolve/landing-page/${slug}`;
  const response = await axios.get<unknown>(url, {
    headers: {
      "X-Api-Key": defaultApiKey,
      "X-Locale": options?.locale ?? "en",
      "Accept-Language": options?.locale,
    },
    params: options?.previewToken
      ? { preview_token: options.previewToken }
      : undefined,
  });

  return unwrap(response.data);
}
