import { getAdminApiErrorMessage } from "@/lib/admin-response";

export function getStudentRequestApiErrorMessage(
  error: unknown,
  fallback: string,
) {
  return getAdminApiErrorMessage(error, fallback);
}
