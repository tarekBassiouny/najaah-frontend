import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteAdminNotification,
  getAdminNotificationsUnreadCount,
  listAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
} from "@/features/notifications/services/notifications.service";
import { http } from "@/lib/http";

vi.mock("@/lib/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedHttp = http as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("notifications.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists notifications with request params and normalized payload", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            id: 1,
            type: 2,
            type_label: "Device Change Request",
            type_label_translations: {
              en: "Device Change Request",
              ar: "طلب تغيير الجهاز",
            },
            type_icon: "smartphone",
            title: "New Device Change Request",
            body: "Ahmed requested device change.",
            data: { action_url: "/admin/device-requests/1" },
            is_read: false,
            read_at: null,
            created_at: "2026-02-17T10:30:00+00:00",
          },
        ],
        meta: {
          page: 2,
          per_page: 10,
          total: 14,
          last_page: 2,
        },
      },
    });

    const result = await listAdminNotifications({
      page: 2,
      per_page: 10,
      unread_only: true,
      type: 2,
      since: 1739780000,
    });

    expect(mockedHttp.get).toHaveBeenCalledWith("/api/v1/admin/notifications", {
      params: {
        page: 2,
        per_page: 10,
        unread_only: 1,
        type: 2,
        since: 1739780000,
      },
    });

    expect(result).toEqual({
      items: [
        {
          id: 1,
          type: 2,
          typeLabel: "Device Change Request",
          typeLabelTranslations: {
            en: "Device Change Request",
            ar: "طلب تغيير الجهاز",
          },
          typeIcon: "smartphone",
          title: "New Device Change Request",
          body: "Ahmed requested device change.",
          data: { action_url: "/admin/device-requests/1" },
          isRead: false,
          readAt: null,
          createdAt: "2026-02-17T10:30:00+00:00",
        },
      ],
      meta: {
        page: 2,
        per_page: 10,
        total: 14,
        last_page: 2,
      },
    });
  });

  it("reads unread count from wrapped payload", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          unread_count: 7,
        },
      },
    });

    await expect(getAdminNotificationsUnreadCount()).resolves.toBe(7);
    expect(mockedHttp.get).toHaveBeenCalledWith(
      "/api/v1/admin/notifications/count",
    );
  });

  it("marks one notification as read", async () => {
    mockedHttp.put.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 5,
          type: 1,
          type_label: "System Alert",
          type_label_translations: { en: "System Alert" },
          type_icon: "alert-circle",
          title: "Maintenance Notice",
          body: "Maintenance window tonight.",
          data: { entity_type: "custom" },
          is_read: true,
          read_at: "2026-02-17T11:00:00+00:00",
          created_at: "2026-02-17T10:00:00+00:00",
        },
      },
    });

    await expect(markAdminNotificationAsRead(5)).resolves.toMatchObject({
      id: 5,
      isRead: true,
      readAt: "2026-02-17T11:00:00+00:00",
    });
    expect(mockedHttp.put).toHaveBeenCalledWith(
      "/api/v1/admin/notifications/5/read",
    );
  });

  it("marks all notifications as read", async () => {
    mockedHttp.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          marked_count: 4,
        },
      },
    });

    await expect(markAllAdminNotificationsAsRead()).resolves.toBe(4);
    expect(mockedHttp.post).toHaveBeenCalledWith(
      "/api/v1/admin/notifications/read-all",
    );
  });

  it("deletes notification", async () => {
    mockedHttp.delete.mockResolvedValueOnce({});

    await deleteAdminNotification(9);

    expect(mockedHttp.delete).toHaveBeenCalledWith(
      "/api/v1/admin/notifications/9",
    );
  });
});
