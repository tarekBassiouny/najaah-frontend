import { redirect } from "next/navigation";
import { DEFAULT_STUDENT_REQUEST_TYPE } from "@/lib/student-requests";

export default function StudentRequestsIndexPage() {
  redirect(`/student-requests/${DEFAULT_STUDENT_REQUEST_TYPE}`);
}
