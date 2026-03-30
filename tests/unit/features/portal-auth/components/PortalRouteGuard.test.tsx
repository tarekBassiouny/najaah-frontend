import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PortalRouteGuard } from "@/features/portal-auth/components/PortalRouteGuard";

const replaceMock = vi.fn();

let pathname = "/portal/parent/children/42";
let portalAuthState: {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { is_student: boolean; is_parent: boolean } | null;
} = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => pathname,
}));

vi.mock("@/features/portal-auth/context/portal-auth-context", () => ({
  usePortalAuth: () => portalAuthState,
}));

function renderGuard() {
  return render(
    <PortalRouteGuard fallback={<div>Loading access...</div>}>
      <div>Protected portal content</div>
    </PortalRouteGuard>,
  );
}

describe("PortalRouteGuard", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    pathname = "/portal/parent/children/42";
    portalAuthState = {
      isAuthenticated: false,
      isLoading: false,
      user: null,
    };
  });

  it("renders guest routes without redirecting", () => {
    pathname = "/portal/parent/login";

    renderGuard();

    expect(screen.getByText("Protected portal content")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated parent routes to the parent login with returnUrl", async () => {
    renderGuard();

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/portal/parent/login?returnUrl=%2Fportal%2Fparent%2Fchildren%2F42",
      );
    });
    expect(screen.getByText("Loading access...")).toBeInTheDocument();
  });

  it("redirects authenticated users without the required parent role", async () => {
    portalAuthState = {
      isAuthenticated: true,
      isLoading: false,
      user: { is_student: true, is_parent: false },
    };

    renderGuard();

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/portal/parent/login");
    });
    expect(screen.getByText("Loading access...")).toBeInTheDocument();
  });

  it("renders protected content when the required role is present", () => {
    portalAuthState = {
      isAuthenticated: true,
      isLoading: false,
      user: { is_student: false, is_parent: true },
    };

    renderGuard();

    expect(screen.getByText("Protected portal content")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
