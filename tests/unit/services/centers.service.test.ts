import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCenter,
  deleteCenter,
  getCenter,
  listCenters,
  restoreCenter,
  retryCenterOnboarding,
  updateCenter,
  uploadCenterLogo,
} from "@/features/centers/services/centers.service";
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

describe("centers.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists centers with normalized pagination fallback", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        data: [{ id: 1, name: "Center A" }],
      },
    });

    const result = await listCenters({ page: 3, per_page: 50, search: "" });

    expect(mockedHttp.get).toHaveBeenCalledWith("/api/v1/admin/centers", {
      params: {
        page: 3,
        per_page: 50,
        search: undefined,
        slug: undefined,
        type: undefined,
        tier: undefined,
        is_featured: undefined,
        status: undefined,
        is_demo: undefined,
        onboarding_status: undefined,
        created_from: undefined,
        created_to: undefined,
        updated_from: undefined,
        updated_to: undefined,
        deleted: undefined,
        sort_by: undefined,
        sort_dir: undefined,
      },
    });
    expect(result).toEqual({
      items: [{ id: 1, name: "Center A" }],
      meta: { page: 3, per_page: 50, total: 0 },
    });
  });

  it("gets center by id or slug", async () => {
    mockedHttp.get.mockResolvedValueOnce({ data: { data: { id: 1 } } });

    await expect(getCenter("alpha")).resolves.toEqual({ id: 1 });
    expect(mockedHttp.get).toHaveBeenCalledWith("/api/v1/admin/centers/alpha");
  });

  it("returns null when center payload is empty", async () => {
    mockedHttp.get.mockResolvedValueOnce({ data: {} });
    await expect(getCenter(99)).resolves.toBeNull();
  });

  it("creates, updates, and restores centers", async () => {
    mockedHttp.post.mockResolvedValueOnce({ data: { data: { id: 11 } } });
    mockedHttp.put.mockResolvedValueOnce({ data: { data: { id: 11 } } });
    mockedHttp.post.mockResolvedValueOnce({ data: { data: { id: 11 } } });

    await expect(
      createCenter({
        name: "Center A",
        slug: "center-a",
        type: "unbranded",
        admin: { name: "Admin A", email: "admin@example.com" },
      }),
    ).resolves.toEqual({ id: 11 });
    await expect(updateCenter(11, { status: "active" })).resolves.toEqual({
      id: 11,
    });
    await expect(restoreCenter(11)).resolves.toEqual({ id: 11 });
  });

  it("deletes center", async () => {
    mockedHttp.delete.mockResolvedValueOnce({});

    await deleteCenter(12);

    expect(mockedHttp.delete).toHaveBeenCalledWith("/api/v1/admin/centers/12");
  });

  it("retries onboarding and returns raw response", async () => {
    mockedHttp.post.mockResolvedValueOnce({ data: { ok: true } });

    await expect(retryCenterOnboarding(7)).resolves.toEqual({ ok: true });
    expect(mockedHttp.post).toHaveBeenCalledWith(
      "/api/v1/admin/centers/7/onboarding/retry",
    );
  });

  it("uploads logo as multipart form-data", async () => {
    const file = new File(["logo"], "logo.png", { type: "image/png" });
    mockedHttp.post.mockResolvedValueOnce({ data: { uploaded: true } });

    const result = await uploadCenterLogo(7, { file, filename: "logo.png" });

    const [, body, config] = mockedHttp.post.mock.calls[0];
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("logo")).toBeTruthy();
    expect(config).toEqual({
      headers: { "Content-Type": "multipart/form-data" },
    });
    expect(result).toEqual({ uploaded: true });
  });
});
