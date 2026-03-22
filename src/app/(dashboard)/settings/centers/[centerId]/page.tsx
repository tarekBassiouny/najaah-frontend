import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default async function SettingsCenterPage({ params }: PageProps) {
  const { centerId } = await params;

  redirect(`/manage/centers/${centerId}/settings`);
}
