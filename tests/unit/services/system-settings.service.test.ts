import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSystemSetting,
  deleteSystemSetting,
  getSystemSetting,
  getSystemSettingsPreview,
  listSystemSettings,
  updateSystemSetting,
} from "@/features/system-settings/services/system-settings.service";
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

describe("system-settings.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists settings with request params and pagination fallback", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        data: [{ id: 1, key: "student.default_country_code" }],
      },
    });

    const result = await listSystemSettings({
      page: 2,
      per_page: 20,
      search: "student",
      is_public: true,
    });

    expect(mockedHttp.get).toHaveBeenCalledWith("/api/v1/admin/settings", {
      params: {
        page: 2,
        per_page: 20,
        search: "student",
        is_public: 1,
      },
    });
    expect(result).toEqual({
      items: [{ id: 1, key: "student.default_country_code" }],
      meta: { page: 2, per_page: 20, total: 1 },
    });
  });

  it("normalizes list from nested data/meta payload", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        data: {
          data: [{ id: 9, key: "feature.flag" }],
          meta: { current_page: 3, per_page: 15, total: 31 },
        },
      },
    });

    const result = await listSystemSettings({
      page: 1,
      per_page: 10,
      is_public: false,
    });

    expect(mockedHttp.get).toHaveBeenCalledWith("/api/v1/admin/settings", {
      params: {
        page: 1,
        per_page: 10,
        search: undefined,
        is_public: 0,
      },
    });
    expect(result).toEqual({
      items: [{ id: 9, key: "feature.flag" }],
      meta: { page: 3, per_page: 15, total: 31 },
    });
  });

  it("gets a setting by id", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        data: {
          id: 4,
          key: "student.default_country_code",
          value: { code: "+20" },
          is_public: true,
        },
      },
    });

    await expect(getSystemSetting(4)).resolves.toEqual({
      id: 4,
      key: "student.default_country_code",
      value: { code: "+20" },
      is_public: true,
    });
    expect(mockedHttp.get).toHaveBeenCalledWith("/api/v1/admin/settings/4");
  });

  it("creates and updates a setting", async () => {
    mockedHttp.post.mockResolvedValueOnce({
      data: {
        data: {
          id: 8,
          key: "student.default_country_code",
          value: { code: "+20" },
          is_public: true,
        },
      },
    });
    mockedHttp.put.mockResolvedValueOnce({
      data: {
        data: {
          id: 8,
          key: "student.default_country_code",
          value: { code: "+966" },
          is_public: false,
        },
      },
    });

    await expect(
      createSystemSetting({
        key: "student.default_country_code",
        value: { code: "+20" },
        is_public: true,
      }),
    ).resolves.toEqual({
      id: 8,
      key: "student.default_country_code",
      value: { code: "+20" },
      is_public: true,
    });

    await expect(
      updateSystemSetting(8, {
        value: { code: "+966" },
        is_public: false,
      }),
    ).resolves.toEqual({
      id: 8,
      key: "student.default_country_code",
      value: { code: "+966" },
      is_public: false,
    });
  });

  it("deletes a setting", async () => {
    mockedHttp.delete.mockResolvedValueOnce({});

    await deleteSystemSetting(12);

    expect(mockedHttp.delete).toHaveBeenCalledWith("/api/v1/admin/settings/12");
  });

  it("normalizes preview response from data envelope", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          student: {
            default_country_code: { code: "+20" },
          },
        },
      },
    });

    await expect(getSystemSettingsPreview()).resolves.toEqual({
      student: {
        default_country_code: { code: "+20" },
      },
    });
  });
});
