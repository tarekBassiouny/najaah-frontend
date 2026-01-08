"use client";

import { useAdminLogout } from "@/features/auth/hooks/use-admin-logout";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoading } from "@/components/ui/page-loading";

export default function LogoutPage() {
  const router = useRouter();
  const { mutate } = useAdminLogout({
    onSettled: () => {
      router.replace("/login");
    },
  });

  useEffect(() => {
    mutate();
  }, [mutate]);

  return <PageLoading />;
}
