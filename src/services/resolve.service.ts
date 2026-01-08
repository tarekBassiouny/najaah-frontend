import axios from "axios";
import { apiBaseUrl, defaultApiKey, getApiLocale } from "@/lib/runtime-config";

type ResolveCenterResponse = {
  api_key?: string;
  center_id?: string | number;
  center_slug?: string;
  branding?: {
    logo_url?: string;
    primary_color?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type ResolveCenterResult = {
  apiKey?: string;
  centerId?: string | number | null;
  centerSlug?: string | null;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    [key: string]: unknown;
  } | null;
};

export async function resolveCenter(
  slug: string,
): Promise<ResolveCenterResult | null> {
  const url = `${apiBaseUrl}/api/v1/resolve/centers/${slug}`;
  const { data } = await axios.get<ResolveCenterResponse>(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Api-Key": defaultApiKey,
      "X-Locale": getApiLocale(),
    },
  });

  const rawPayload =
    data && typeof data === "object" ? (data as ResolveCenterResponse) : {};
  const payload =
    rawPayload && typeof rawPayload.data === "object"
      ? (rawPayload.data as ResolveCenterResponse)
      : rawPayload;

  const branding = payload.branding
    ? {
        logoUrl: payload.branding.logo_url,
        primaryColor: payload.branding.primary_color,
        ...payload.branding,
      }
    : null;

  return {
    apiKey: payload.api_key,
    centerId: payload.center_id ?? null,
    centerSlug: payload.center_slug ?? null,
    branding,
  };
}
