import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LoginPage from "@/app/(auth)/login/page";

vi.mock("@/features/auth/components/LoginForm", () => ({
  LoginForm: () => <div>LoginFormMock</div>,
}));

describe("LoginPage", () => {
  it("renders login form", () => {
    render(<LoginPage />);

    expect(screen.getByText("LoginFormMock")).toBeInTheDocument();
  });
});
