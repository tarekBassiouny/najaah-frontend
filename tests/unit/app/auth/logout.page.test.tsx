import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LogoutPage from "@/app/(auth)/logout/page";

const replaceMock = vi.fn();
const mutateMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock("@/features/auth/hooks/use-admin-logout", () => ({
  useAdminLogout: (options?: { onSettled?: () => void }) => ({
    mutate: () => {
      mutateMock();
      options?.onSettled?.();
    },
  }),
}));

describe("LogoutPage", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    mutateMock.mockReset();
  });

  it("triggers logout and redirects to login", async () => {
    render(<LogoutPage />);

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalled();
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
  });
});
