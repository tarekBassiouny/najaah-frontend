"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { can } from "@/lib/capabilities";
import {
  DEFAULT_STUDENT_REQUEST_TYPE,
  STUDENT_REQUEST_DEFINITIONS,
} from "@/lib/student-requests";

export default function StudentRequestsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const firstAllowedType =
      STUDENT_REQUEST_DEFINITIONS.find((item) => can(item.capability))?.type ??
      DEFAULT_STUDENT_REQUEST_TYPE;
    router.replace(`/student-requests/${firstAllowedType}`);
  }, [router]);

  return null;
}
