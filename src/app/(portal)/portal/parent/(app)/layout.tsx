import type { ReactNode } from "react";
import { ParentPortalShell } from "@/features/portal/components/layout/ParentPortalShell";

type Props = {
  children: ReactNode;
};

export default function ParentAppLayout({ children }: Props) {
  return <ParentPortalShell>{children}</ParentPortalShell>;
}
