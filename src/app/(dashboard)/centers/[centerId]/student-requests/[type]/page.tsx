import { notFound } from "next/navigation";
import { StudentRequestsPage } from "@/features/student-requests/components/StudentRequestsPage";
import { isStudentRequestType } from "@/lib/student-requests";

type PageProps = {
  params: Promise<{ centerId: string; type: string }>;
};

export default async function CenterStudentRequestsTypePage({
  params,
}: PageProps) {
  const { centerId, type } = await params;

  if (!isStudentRequestType(type)) {
    notFound();
  }

  return <StudentRequestsPage type={type} centerId={centerId} />;
}
