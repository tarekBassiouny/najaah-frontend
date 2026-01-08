const DEFAULT_LOCALE = "en";

let apiLocale = process.env.NEXT_PUBLIC_API_LOCALE || DEFAULT_LOCALE;

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
export const defaultApiKey = process.env.NEXT_PUBLIC_DEFAULT_API_KEY || "";

export function getApiLocale() {
  return apiLocale || DEFAULT_LOCALE;
}

export function setApiLocale(locale: string) {
  apiLocale = locale || DEFAULT_LOCALE;
}
