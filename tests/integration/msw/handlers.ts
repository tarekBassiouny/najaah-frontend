import { http, HttpResponse } from "msw";

const loginRoute = "/api/v1/admin/auth/login";
const meRoute = "/api/v1/admin/auth/me";
const centersRoute = "/api/v1/admin/centers";

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
];
