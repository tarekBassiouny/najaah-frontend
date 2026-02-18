import { http, HttpResponse } from "msw";

const loginRoute = "/api/v1/admin/auth/login";
const meRoute = "/api/v1/admin/auth/me";
const centersRoute = "/api/v1/admin/centers";
const centersOptionsRoute = "/api/v1/admin/centers/options";
const centersCoursesRoute = "/api/v1/admin/centers/:centerId/courses";
const studentsRoute = "/api/v1/admin/students";
const agentsExecutionsRoute = "/api/v1/admin/agents/executions";
const agentsAvailableRoute = "/api/v1/admin/agents/available";
const agentsExecuteRoute = "/api/v1/admin/agents/execute";
const notificationsRoute = "/api/v1/admin/notifications";
const notificationsCountRoute = "/api/v1/admin/notifications/count";
const notificationsReadAllRoute = "/api/v1/admin/notifications/read-all";

type MockNotification = {
  id: number;
  type: number;
  type_label: string;
  type_label_translations: { en: string; ar: string };
  type_icon: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

function createNotificationsFixture(): MockNotification[] {
  return [
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
      body: "Ahmed has requested to change their device.",
      data: {
        entity_type: "device_change_request",
        entity_id: 123,
        action_url: "/admin/device-requests/123",
      },
      is_read: false,
      read_at: null,
      created_at: "2026-02-17T10:30:00+00:00",
    },
    {
      id: 2,
      type: 3,
      type_label: "Extra View Request",
      type_label_translations: {
        en: "Extra View Request",
        ar: "طلب مشاهدات إضافية",
      },
      type_icon: "eye",
      title: "Extra views requested",
      body: "Sara requested 5 additional views.",
      data: {
        entity_type: "extra_view_request",
        entity_id: 456,
        action_url: "/admin/extra-view-requests/456",
      },
      is_read: false,
      read_at: null,
      created_at: "2026-02-17T09:00:00+00:00",
    },
    {
      id: 3,
      type: 1,
      type_label: "System Alert",
      type_label_translations: {
        en: "System Alert",
        ar: "تنبيه النظام",
      },
      type_icon: "alert-circle",
      title: "Maintenance Tonight",
      body: "Scheduled maintenance starts at 11 PM.",
      data: {
        entity_type: "custom",
      },
      is_read: true,
      read_at: "2026-02-17T08:30:00+00:00",
      created_at: "2026-02-17T08:00:00+00:00",
    },
  ];
}

let notificationRecords = createNotificationsFixture();

export function resetMswFixtures() {
  notificationRecords = createNotificationsFixture();
}

function toBooleanParam(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized === "1" || normalized === "true";
}

export const handlers = [
  http.post(loginRoute, async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (body.password !== "admin123") {
      return HttpResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: 1,
          name: "Admin",
          email: body.email ?? "admin@example.com",
        },
        token: "mock-token",
      },
    });
  }),

  http.get(meRoute, () => {
    return HttpResponse.json({
      success: true,
      data: { user: { id: 1, name: "Admin", email: "admin@example.com" } },
    });
  }),

  http.get(centersRoute, () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: "Center A" },
        { id: 2, name: "Center B" },
      ],
    });
  }),

  http.get(centersOptionsRoute, () => {
    return HttpResponse.json({
      data: [
        { id: 1, name: "Center A", slug: "center-a" },
        { id: 2, name: "Center B", slug: "center-b" },
      ],
      meta: {
        page: 1,
        per_page: 20,
        total: 2,
        last_page: 1,
      },
    });
  }),

  http.get(centersCoursesRoute, () => {
    return HttpResponse.json({
      data: {
        data: [
          {
            id: 12,
            title: "Algebra I",
            status: "published",
            status_key: "published",
            status_label: "Published",
          },
          {
            id: 13,
            title: "Geometry Basics",
            status: "draft",
            status_key: "draft",
            status_label: "Draft",
          },
        ],
        meta: {
          current_page: 1,
          per_page: 20,
          total: 2,
          last_page: 1,
        },
      },
    });
  }),

  http.get(studentsRoute, () => {
    return HttpResponse.json({
      data: [
        {
          id: 201,
          name: "Mariam Ali",
          email: "mariam@example.com",
          phone: "1999000001",
          center_id: 1,
        },
        {
          id: 202,
          name: "Omar Hassan",
          email: "omar@example.com",
          phone: "1999000002",
          center_id: 1,
        },
      ],
      meta: {
        page: 1,
        per_page: 20,
        total: 2,
      },
    });
  }),

  http.get(agentsExecutionsRoute, () => {
    return HttpResponse.json({
      data: [
        {
          id: 1,
          agent_type: "content_publishing",
          status: 2,
          status_key: "completed",
          status_label: "Completed",
          target_type: "course",
          target_type_class: "Course",
          target_id: 12,
          target: { id: 12, type: "Course" },
          context: { dry_run: false },
          result: { success: true },
          steps_completed: ["validate_sections", "publish_course"],
          initiator: { id: 7, name: "Admin" },
          created_at: "2026-02-05T12:00:00Z",
          updated_at: "2026-02-05T12:00:05Z",
          started_at: "2026-02-05T12:00:00Z",
          completed_at: "2026-02-05T12:00:05Z",
        },
      ],
      meta: {
        page: 1,
        last_page: 1,
        per_page: 10,
        total: 1,
      },
    });
  }),

  http.get(`${agentsExecutionsRoute}/:id`, ({ params }) => {
    const id = Number(params.id);
    return HttpResponse.json({
      data: {
        id,
        agent_type: "content_publishing",
        status: 2,
        status_key: "completed",
        status_label: "Completed",
        target_type: "course",
        target_type_class: "Course",
        target_id: 12,
        target: { id: 12, type: "Course" },
        context: { dry_run: false },
        result: { success: true },
        steps_completed: ["validate_sections", "publish_course"],
        initiator: { id: 7, name: "Admin" },
        created_at: "2026-02-05T12:00:00Z",
        updated_at: "2026-02-05T12:00:05Z",
        started_at: "2026-02-05T12:00:00Z",
        completed_at: "2026-02-05T12:00:05Z",
      },
    });
  }),

  http.get(agentsAvailableRoute, () => {
    return HttpResponse.json({
      data: {
        content_publishing: {
          type: "content_publishing",
          name: "Content Publishing",
          description: "Publishes a course.",
          steps: ["validate_sections", "publish_course"],
        },
        enrollment: {
          type: "enrollment",
          name: "Enrollment",
          description: "Bulk enrolls students.",
          steps: ["parse_request", "create_enrollments"],
        },
      },
    });
  }),

  http.post(agentsExecuteRoute, async ({ request }) => {
    const body = (await request.json()) as {
      agent_type?: string;
      center_id?: string | number;
      context?: Record<string, unknown>;
    };

    return HttpResponse.json({
      data: {
        id: 99,
        agent_type: body.agent_type ?? "content_publishing",
        status: 0,
        status_key: "pending",
        status_label: "Pending",
        target_type: "course",
        target_type_class: "Course",
        target_id: 12,
        context: body.context ?? {},
        result: {},
        steps_completed: ["queued"],
        initiator: { id: 7, name: "Admin" },
        created_at: "2026-02-05T12:00:00Z",
        updated_at: "2026-02-05T12:00:00Z",
      },
    });
  }),

  http.get(notificationsRoute, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const perPage = Number(url.searchParams.get("per_page") ?? "15");
    const unreadOnly = toBooleanParam(url.searchParams.get("unread_only"));
    const type = Number(url.searchParams.get("type"));

    let filtered = [...notificationRecords];
    if (unreadOnly) {
      filtered = filtered.filter((notification) => !notification.is_read);
    }
    if (Number.isFinite(type) && type > 0) {
      filtered = filtered.filter((notification) => notification.type === type);
    }

    const start = (Math.max(page, 1) - 1) * Math.max(perPage, 1);
    const paginated = filtered.slice(start, start + Math.max(perPage, 1));
    const total = filtered.length;
    const lastPage = Math.max(1, Math.ceil(total / Math.max(perPage, 1)));

    return HttpResponse.json({
      success: true,
      data: paginated,
      meta: {
        page,
        per_page: perPage,
        total,
        last_page: lastPage,
      },
    });
  }),

  http.get(notificationsCountRoute, () => {
    const unreadCount = notificationRecords.filter(
      (notification) => !notification.is_read,
    ).length;

    return HttpResponse.json({
      success: true,
      data: {
        unread_count: unreadCount,
      },
    });
  }),

  http.put(`${notificationsRoute}/:id/read`, ({ params }) => {
    const id = Number(params.id);
    const target = notificationRecords.find(
      (notification) => notification.id === id,
    );

    if (!target) {
      return HttpResponse.json(
        {
          success: false,
          message: "Notification not found",
        },
        { status: 404 },
      );
    }

    target.is_read = true;
    target.read_at = "2026-02-17T11:00:00+00:00";

    return HttpResponse.json({
      success: true,
      message: "Notification marked as read.",
      data: target,
    });
  }),

  http.post(notificationsReadAllRoute, () => {
    const unread = notificationRecords.filter(
      (notification) => !notification.is_read,
    );
    for (const notification of unread) {
      notification.is_read = true;
      notification.read_at = "2026-02-17T11:00:00+00:00";
    }

    return HttpResponse.json({
      success: true,
      message: "All notifications marked as read.",
      data: {
        marked_count: unread.length,
      },
    });
  }),

  http.delete(`${notificationsRoute}/:id`, ({ params }) => {
    const id = Number(params.id);
    notificationRecords = notificationRecords.filter(
      (notification) => notification.id !== id,
    );
    return new HttpResponse(null, { status: 204 });
  }),
];
