"use client";

import { Button } from "@/components/ui/button";
import { useAdminLogout } from "@/features/auth/hooks/use-admin-logout";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type LogoutButtonProps = {
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
  className?: string;
};

export function LogoutButton({
  children = "Logout",
  variant = "outline",
  size = "sm",
  className,
}: LogoutButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const logoutMutation = useAdminLogout({
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["admin"] });
      router.push("/login");
    },
  });

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={logoutMutation.isPending}
      onClick={() => logoutMutation.mutate()}
    >
      {logoutMutation.isPending ? "Logging out..." : children}
    </Button>
  );
}
