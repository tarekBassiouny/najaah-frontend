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
];
