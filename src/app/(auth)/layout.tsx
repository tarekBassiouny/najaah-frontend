import type { PropsWithChildren } from "react";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-2 px-4 py-10 dark:bg-[#020d1a]">
      {children}
    </div>
  );
}
