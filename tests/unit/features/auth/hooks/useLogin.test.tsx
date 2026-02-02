import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { useAdminLogin } from "@/features/auth/hooks/use-admin-login";
import { fetchAdminProfile, loginAdmin } from "@/services/admin-auth.service";

vi.mock("@/services/admin-auth.service", () => ({
  fetchAdminProfile: vi.fn(),
  loginAdmin: vi.fn(),
}));

const mockedLogin = loginAdmin as unknown as ReturnType<typeof vi.fn>;
const mockedFetchProfile = fetchAdminProfile as unknown as ReturnType<typeof vi.fn>;

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useAdminLogin", () => {
  it("executes login mutation successfully", async () => {
    const user = { id: 1, email: "admin@example.com", name: "Admin" };
    mockedLogin.mockResolvedValueOnce({
      tokens: { access_token: "token" },
      user,
    });
    mockedFetchProfile.mockResolvedValueOnce(user);
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useAdminLogin({ onSuccess }),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({
        email: "admin@example.com",
        password: "admin123",
      });
    });

    expect(mockedLogin).toHaveBeenCalled();
    const [variables] = mockedLogin.mock.calls[0] ?? [];
    expect(variables).toEqual({
      email: "admin@example.com",
      password: "admin123",
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    const [resultValue, successVariables] = onSuccess.mock.calls[0];
    expect(resultValue.user).toEqual(user);
    expect(successVariables).toEqual({
      email: "admin@example.com",
      password: "admin123",
    });
  });

  it("triggers onError on failure", async () => {
    const error = new Error("Invalid credentials");
    mockedLogin.mockRejectedValueOnce(error);
    const onError = vi.fn();

    const { result } = renderHook(
      () => useAdminLogin({ onError }),
      { wrapper },
    );

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          email: "admin@example.com",
          password: "wrong",
        }),
      ).rejects.toThrow("Invalid credentials");
    });

    expect(onError).toHaveBeenCalled();
  });
});
