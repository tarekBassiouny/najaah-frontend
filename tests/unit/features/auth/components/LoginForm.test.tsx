import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "@/features/auth/components/LoginForm";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
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
    vi.useFakeTimers();
    pushMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows validation errors when fields are empty", async () => {
    renderWithProviders();

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeVisible();
    expect(await screen.findByText(/password is required/i)).toBeVisible();
  });

  it("submits form and redirects on success", async () => {
    renderWithProviders();

    await userEvent.type(screen.getByLabelText(/email/i), "admin@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/demo mode only/i),
    ).toBeVisible();

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });
});
