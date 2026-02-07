import "../../setup/integration";
import { describe, expect, it, beforeEach } from "vitest";
import { renderWithQueryProvider } from "../../unit/setupHelpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgentExecutionsTable } from "@/features/agents/components/AgentExecutionsTable";
import { AgentExecutionDetails } from "@/features/agents/components/AgentExecutionDetails";
import { setAuthPermissions } from "@/lib/auth-state";
import { setTenantState } from "@/lib/tenant-store";

describe("agents components (integration with MSW)", () => {
  beforeEach(() => {
    setAuthPermissions(["agent.view", "agent.execute"]);
    setTenantState({ centerId: 1, centerName: "Center A" });
  });

  it("renders executions list and can execute a new agent", async () => {
    const user = userEvent.setup();
    renderWithQueryProvider(<AgentExecutionsTable />);

    await waitFor(() => {
      expect(screen.getByText("Course")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Run Agent" }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Run Agent" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText("Execution ID")).toHaveValue("99");
  });

  it("renders execution details page data", async () => {
    renderWithQueryProvider(<AgentExecutionDetails executionId={1} />);

    await waitFor(() => {
      expect(screen.getByText("Execution Steps")).toBeInTheDocument();
    });

    expect(screen.getByText("Execution #1")).toBeInTheDocument();
    expect(screen.getByText("Execution Steps")).toBeInTheDocument();
    expect(screen.getByText("Context")).toBeInTheDocument();
    expect(screen.getByText("Result")).toBeInTheDocument();
  });
});
