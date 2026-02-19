import { notFound } from "next/navigation";
import { StudentRequestsPage } from "@/features/student-requests/components/StudentRequestsPage";
import { isStudentRequestType } from "@/lib/student-requests";

type PageProps = {
  params: Promise<{ type: string }>;
};

export default async function StudentRequestsTypePage({ params }: PageProps) {
  const { type } = await params;

  if (!isStudentRequestType(type)) {
    notFound();
  }

  return <StudentRequestsPage type={type} />;
}
