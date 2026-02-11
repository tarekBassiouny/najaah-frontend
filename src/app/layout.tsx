import "@/css/satoshi.css";
import "@/css/style.css";
import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import NextTopLoader from "nextjs-toploader";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    template: "%s | Najaah.me",
    default: "Najaah.me",
  },
  description: "Najaah.me learning platform and admin portal.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-2 dark:bg-[#020d1a]">
        <Providers>
          <NextTopLoader color="#5750F1" showSpinner={false} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
