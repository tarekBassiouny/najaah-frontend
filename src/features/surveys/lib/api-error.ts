import { getAdminApiErrorMessage } from "@/lib/admin-response";

export function getSurveyApiErrorMessage(error: unknown, fallback: string) {
  return getAdminApiErrorMessage(error, fallback);
}
