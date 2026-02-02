import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminRouteGuard } from "@/features/auth/components/AdminRouteGuard";

const replaceMock = vi.fn();
const clearMock = vi.fn();
const canMock = vi.fn();
const getRouteCapabilitiesMock = vi.fn();

let hasToken = true;
let adminMeState: {
  data: { id: number; email: string; name: string } | null;
  isLoading: boolean;
  isError: boolean;
} = {
  data: { id: 1, email: "admin@example.com", name: "Admin" },
  isLoading: false,
  isError: false,
};
let tenantState = { isResolved: true, centerSlug: null as string | null };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/dashboard",
}));

vi.mock("@/features/auth/hooks/use-admin-me", () => ({
  useAdminMe: () => adminMeState,
}));

vi.mock("@/lib/token-storage", () => ({
  tokenStorage: {
    getAccessToken: () => (hasToken ? "token" : null),
    clear: () => clearMock(),
  },
}));

vi.mock("@/app/tenant-provider", () => ({
  useTenant: () => tenantState,
}));

vi.mock("@/lib/capabilities", () => ({
  can: (capability: string) => canMock(capability),
}));

vi.mock("@/components/Layouts/sidebar/data", () => ({
  getRouteCapabilities: (...args: unknown[]) =>
    getRouteCapabilitiesMock(...args),
}));

const renderGuard = () =>
  render(
    <AdminRouteGuard>
      <div>Protected Content</div>
    </AdminRouteGuard>,
  );

beforeEach(() => {
  replaceMock.mockReset();
  clearMock.mockReset();
  canMock.mockReset();
  getRouteCapabilitiesMock.mockReset();

  hasToken = true;
  adminMeState = {
    data: { id: 1, email: "admin@example.com", name: "Admin" },
    isLoading: false,
    isError: false,
  };
  tenantState = { isResolved: true, centerSlug: null };
});

describe("AdminRouteGuard", () => {
  it("renders fallback when tenant is not resolved", () => {
    tenantState = { isResolved: false, centerSlug: null };

    renderGuard();

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("redirects to login when missing token", async () => {
    hasToken = false;

    renderGuard();

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
  });

  it("clears tokens and redirects when auth query fails", async () => {
    adminMeState = {
      data: null,
      isLoading: false,
      isError: true,
    };

    renderGuard();

    await waitFor(() => {
      expect(clearMock).toHaveBeenCalled();
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
  });

  it("redirects to dashboard when route capabilities are null", async () => {
    getRouteCapabilitiesMock.mockReturnValueOnce(null);

    renderGuard();

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("redirects to dashboard when user lacks required capability", async () => {
    getRouteCapabilitiesMock.mockReturnValueOnce(["admin.read"]);
    canMock.mockReturnValueOnce(false);

    renderGuard();

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("renders children when access is granted", () => {
    getRouteCapabilitiesMock.mockReturnValueOnce(["admin.read"]);
    canMock.mockReturnValueOnce(true);

    renderGuard();

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
