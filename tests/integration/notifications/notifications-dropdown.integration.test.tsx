import "../../setup/integration";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithQueryProvider } from "../../unit/setupHelpers";
import { routerMocks } from "../../setup/unit";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminNotificationsDropdown } from "@/features/notifications/components/AdminNotificationsDropdown";

describe("admin notifications dropdown (integration with MSW)", () => {
  beforeEach(() => {
    routerMocks.push.mockReset();
    routerMocks.replace.mockReset();
    routerMocks.back.mockReset();
    routerMocks.forward.mockReset();
    routerMocks.prefetch.mockReset();
  });

  it("loads unread count and navigates using action url", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderWithQueryProvider(<AdminNotificationsDropdown />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: /View Notifications \(2 unread\)/i,
        }),
      ).toBeInTheDocument();
    });

    const trigger = screen.getByRole("button", { name: /View Notifications/i });
    await user.click(trigger);

    const menu = await screen.findByRole("menu");
    expect(
      within(menu).getByText("New Device Change Request"),
    ).toBeInTheDocument();

    await user.click(
      within(menu).getByRole("button", {
        name: /Open notification: New Device Change Request/i,
      }),
    );

    await waitFor(() => {
      expect(routerMocks.push).toHaveBeenCalledWith("/device-requests/123");
    });
  });

  it("marks all as read and can delete an item", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderWithQueryProvider(<AdminNotificationsDropdown />);

    const trigger = await screen.findByRole("button", {
      name: /View Notifications/i,
    });
    await user.click(trigger);

    const menu = await screen.findByRole("menu");
    const markAll = within(menu).getByRole("button", {
      name: /Mark all as read/i,
    });

    expect(markAll).toBeEnabled();
    await user.click(markAll);

    await waitFor(() => {
      expect(markAll).toBeDisabled();
    });

    expect(within(menu).getByText("Maintenance Tonight")).toBeInTheDocument();
    await user.click(
      within(menu).getByRole("button", {
        name: /Actions for notification 3/i,
      }),
    );
    await user.click(
      within(menu).getByRole("button", { name: /Delete notification 3/i }),
    );

    await waitFor(() => {
      expect(
        within(menu).queryByText("Maintenance Tonight"),
      ).not.toBeInTheDocument();
    });
  });
});
