import axios from "axios";
import { apiBaseUrl, defaultApiKey, getApiLocale } from "@/lib/runtime-config";

type ResolveCenterResponse = {
  id?: string | number;
  slug?: string;
  name?: string;
  api_key?: string;
  center_id?: string | number;
  center_slug?: string;
  branding?: {
    logo_url?: string | null;
    primary_color?: string | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type ResolveCenterResult = {
  apiKey?: string;
  centerId?: string | number | null;
  centerSlug?: string | null;
  centerName?: string | null;
  branding?: {
    logoUrl?: string | null;
    primaryColor?: string | null;
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
    centerId: payload.center_id ?? payload.id ?? null,
    centerSlug: payload.center_slug ?? payload.slug ?? null,
    centerName: payload.name ?? null,
    branding,
  };
}
