import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppBootstrapProvider } from "@/app/app-bootstrap-provider";

const resolveCenterMock = vi.fn();
const setTenantStateMock = vi.fn();

vi.mock("@/services/resolve.service", () => ({
  resolveCenter: (...args: unknown[]) => resolveCenterMock(...args),
}));

vi.mock("@/lib/tenant-store", () => ({
  setTenantState: (...args: unknown[]) => setTenantStateMock(...args),
}));

vi.mock("@/lib/runtime-config", () => ({
  defaultApiKey: "default-api-key",
}));

function setHost(host: string) {
  // jsdom location is replaced in test setup; assigning host here is safe
  Object.assign(window.location, { host });
}

describe("AppBootstrapProvider", () => {
  beforeEach(() => {
    resolveCenterMock.mockReset();
    setTenantStateMock.mockReset();
    document.documentElement.style.removeProperty("--brand-primary");
  });

  it("waits for center resolve before rendering children and applies returned api key", async () => {
    setHost("center-01.najaah.me");

    let resolvePromise:
      | ((
          _value: {
            apiKey?: string;
            centerId?: string | number | null;
            centerSlug?: string | null;
            centerName?: string | null;
            branding?: {
              logoUrl?: string;
              primaryColor?: string | null;
            } | null;
          } | null,
        ) => void)
      | undefined;

    resolveCenterMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
    );

    render(
      <AppBootstrapProvider>
        <div>App Content</div>
      </AppBootstrapProvider>,
    );

    expect(screen.getByText("Loading center settings...")).toBeInTheDocument();
    expect(screen.queryByText("App Content")).not.toBeInTheDocument();

    expect(resolvePromise).toBeDefined();
    resolvePromise?.({
      apiKey: "tenant-api-key",
      centerId: 225,
      centerSlug: "center-01",
      centerName: "Updated Name",
      branding: {
        logoUrl: "https://cdn/logo.png",
        primaryColor: "#112233",
      },
    });

    await waitFor(() => {
      expect(screen.getByText("App Content")).toBeInTheDocument();
    });

    expect(resolveCenterMock).toHaveBeenCalledWith("center-01");
    expect(setTenantStateMock).toHaveBeenCalledWith({ isResolved: false });
    expect(setTenantStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "tenant-api-key",
        centerId: 225,
        centerSlug: "center-01",
        centerName: "Updated Name",
        isResolved: true,
      }),
    );
    expect(
      document.documentElement.style.getPropertyValue("--brand-primary"),
    ).toBe("#112233");
  });

  it("uses default api key and resolves immediately for non-center hosts", async () => {
    setHost("admin.najaah.me");
    resolveCenterMock.mockResolvedValueOnce(null);

    render(
      <AppBootstrapProvider>
        <div>App Content</div>
      </AppBootstrapProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("App Content")).toBeInTheDocument();
    });

    expect(resolveCenterMock).not.toHaveBeenCalled();
    expect(setTenantStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "default-api-key",
        centerSlug: null,
        centerId: null,
        centerName: null,
        isResolved: true,
      }),
    );
  });
});
