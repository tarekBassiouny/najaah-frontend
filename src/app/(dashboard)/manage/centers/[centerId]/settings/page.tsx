"use client";

import { use } from "react";
import { SystemAdminCenterSettingsPage } from "@/features/settings/components";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function ManageCenterSettingsPage({ params }: PageProps) {
  const { centerId } = use(params);

  return <SystemAdminCenterSettingsPage centerId={centerId} />;
}
