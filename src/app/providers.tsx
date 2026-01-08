"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AppBootstrapProvider } from "./app-bootstrap-provider";
import { TenantProvider } from "./tenant-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <QueryClientProvider client={queryClient}>
        <TenantProvider>
          <AppBootstrapProvider>
            {children}
          </AppBootstrapProvider>
        </TenantProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
