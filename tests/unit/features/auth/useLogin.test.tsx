import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { authService } from "@/services/auth.service";

vi.mock("@/services/auth.service", () => ({
  authService: {
    login: vi.fn(),
  },
}));

const mockedAuth = authService as unknown as {
  login: ReturnType<typeof vi.fn>;
};

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useLogin hook", () => {
  it("resolves login mutation", async () => {
    const user = { id: 1, email: "admin@example.com", name: "Admin" };
    mockedAuth.login.mockResolvedValueOnce(user);
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useLogin({ onSuccess }), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        email: "admin@example.com",
        password: "admin123",
      });
    });

    expect(mockedAuth.login).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "admin123",
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("calls onError on failure", async () => {
    const error = new Error("Invalid credentials");
    mockedAuth.login.mockRejectedValueOnce(error);
    const onError = vi.fn();

    const { result } = renderHook(() => useLogin({ onError }), { wrapper });

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
