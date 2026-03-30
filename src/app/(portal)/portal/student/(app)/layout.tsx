import type { ReactNode } from "react";
import { StudentPortalShell } from "@/features/portal/components/layout/StudentPortalShell";

type Props = {
  children: ReactNode;
};

export default function StudentAppLayout({ children }: Props) {
  return <StudentPortalShell>{children}</StudentPortalShell>;
}
