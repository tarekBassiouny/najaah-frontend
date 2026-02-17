"use client";

import { ThemeProvider } from "next-themes";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import { AppBootstrapProvider } from "./app-bootstrap-provider";
import { TenantProvider } from "./tenant-provider";
import { ModalProvider } from "@/components/ui/modal-store";
import { ModalHost } from "@/components/ui/modal-host";
import { tokenStorage } from "@/lib/token-storage";
import { cancelTokenRefresh, scheduleTokenRefresh } from "@/lib/token-refresh";

function AuthChannelSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

    const channel = new BroadcastChannel("auth");

    channel.onmessage = (event) => {
      const data = event.data as { type?: string; token?: string } | null;
      if (!data || typeof data !== "object") return;

      if (data.type === "token" && data.token) {
        tokenStorage.setTokens(
          { accessToken: data.token },
          { broadcast: false },
        );
        scheduleTokenRefresh();
        queryClient.invalidateQueries({ queryKey: ["admin", "me"] });
      }

      if (data.type === "logout") {
        tokenStorage.clear({ broadcast: false });
        cancelTokenRefresh();
        queryClient.setQueryData(["admin", "me"], null);
      }
    };

    return () => channel.close();
  }, [queryClient]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (isAxiosError(error) && error.response?.status === 401) {
                return false;
              }
              return failureCount < 1;
            },
          },
        },
      }),
  );

  useEffect(() => {
    if (!tokenStorage.getAccessToken()) {
      return;
    }

    scheduleTokenRefresh();

    return () => {
      cancelTokenRefresh();
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <QueryClientProvider client={queryClient}>
        <AuthChannelSync />
        <TenantProvider>
          <AppBootstrapProvider>
            <ModalProvider>
              {children}
              <ModalHost />
            </ModalProvider>
          </AppBootstrapProvider>
        </TenantProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
