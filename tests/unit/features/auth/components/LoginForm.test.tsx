import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "@/features/auth/components/LoginForm";

const mutateMock = vi.fn();
let isPending = false;

vi.mock("@/features/auth/hooks/use-admin-login", () => ({
  useAdminLogin: () => ({
    mutate: mutateMock,
    isPending,
  }),
}));

const renderWithProviders = () => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <LoginForm />
    </QueryClientProvider>,
  );
};

describe("LoginForm", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    isPending = false;
  });

  it("shows validation errors when fields are empty", async () => {
    renderWithProviders();

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeVisible();
    expect(await screen.findByText(/password is required/i)).toBeVisible();
  });

  it("disables submit button while submitting", () => {
    isPending = true;
    renderWithProviders();

    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
  });

  it("submits form with entered credentials", async () => {
    renderWithProviders();

    await userEvent.type(screen.getByLabelText(/email/i), "admin@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(mutateMock).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "password123",
    });
  });
});
