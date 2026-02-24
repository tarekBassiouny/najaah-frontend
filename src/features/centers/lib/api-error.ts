import { getAdminApiErrorMessage } from "@/lib/admin-response";

export function getCenterApiErrorMessage(error: unknown, fallback: string) {
  return getAdminApiErrorMessage(error, fallback);
}
