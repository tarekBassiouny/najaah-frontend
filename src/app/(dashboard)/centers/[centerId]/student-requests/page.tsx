"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { can } from "@/lib/capabilities";
import {
  DEFAULT_STUDENT_REQUEST_TYPE,
  STUDENT_REQUEST_DEFINITIONS,
} from "@/lib/student-requests";

export default function CenterStudentRequestsIndexPage() {
  const router = useRouter();
  const params = useParams<{ centerId?: string | string[] }>();
  const centerIdParam = params?.centerId;
  const centerId = Array.isArray(centerIdParam)
    ? centerIdParam[0]
    : centerIdParam;

  useEffect(() => {
    if (!centerId) return;
    const firstAllowedType =
      STUDENT_REQUEST_DEFINITIONS.find((item) => can(item.capability))?.type ??
      DEFAULT_STUDENT_REQUEST_TYPE;
    router.replace(`/centers/${centerId}/student-requests/${firstAllowedType}`);
  }, [centerId, router]);

  return null;
}
