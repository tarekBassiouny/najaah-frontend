import { redirect } from "next/navigation";
import { DEFAULT_STUDENT_REQUEST_TYPE } from "@/lib/student-requests";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default async function CenterStudentRequestsIndexPage({
  params,
}: PageProps) {
  const { centerId } = await params;
  redirect(
    `/centers/${centerId}/student-requests/${DEFAULT_STUDENT_REQUEST_TYPE}`,
  );
}
