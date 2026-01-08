import { describe, expect, it, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { renderWithQueryProvider } from "../setupHelpers";

let isPending = false;
const mutateMock = vi.fn();

vi.mock("@/features/auth/hooks/useLogin", () => ({
  useLogin: () => ({
    mutate: mutateMock,
    isPending,
  }),
}));

beforeEach(() => {
  isPending = false;
  mutateMock.mockReset();
});

describe("LoginForm component", () => {
  it("shows validation errors when fields are empty", async () => {
    renderWithQueryProvider(<LoginForm />);

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeVisible();
    expect(await screen.findByText(/password is required/i)).toBeVisible();
  });

  it("disables submit button while submitting", async () => {
    isPending = true;
    renderWithQueryProvider(<LoginForm />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });
});
