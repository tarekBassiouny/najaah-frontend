import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ centerId: string; videoId: string }>;
};

export default async function CenterVideoEditPage({ params }: PageProps) {
  const { centerId } = await params;
  redirect(`/centers/${centerId}/videos`);
}
