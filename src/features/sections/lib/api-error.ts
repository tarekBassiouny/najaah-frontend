import { getAdminApiErrorMessage } from "@/lib/admin-response";

export function getSectionApiErrorMessage(error: unknown, fallback: string) {
  return getAdminApiErrorMessage(error, fallback);
}
