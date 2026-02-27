import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default async function CenterPdfDetailPage({ params }: PageProps) {
  const { centerId } = await params;
  redirect(`/centers/${centerId}/pdfs`);
}
