import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  attachSectionPdf,
  attachSectionVideo,
  createSection,
  deleteSection,
  detachSectionPdf,
  detachSectionVideo,
  getSection,
  getSectionPdf,
  getSectionVideo,
  listSectionPdfs,
  listSectionVideos,
  listSections,
  publishSection,
  reorderSections,
  toggleSectionVisibility,
  unpublishSection,
  updateSection,
} from "@/features/sections/services/sections.service";
import { http } from "@/lib/http";

vi.mock("@/lib/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedHttp = http as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("sections.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes list response from nested payload", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        data: {
          data: [{ id: 1 }],
          meta: { current_page: 2, per_page: 25, total: 50, last_page: 3 },
        },
      },
    });

    const result = await listSections(1, 2, {
      page: 1,
      per_page: 10,
      search: "",
    });

    expect(mockedHttp.get).toHaveBeenCalledWith(
      "/api/v1/admin/centers/1/courses/2/sections",
      {
        params: {
          page: 1,
          per_page: 10,
          search: undefined,
        },
      },
    );
    expect(result).toEqual({
      items: [{ id: 1 }],
      page: 2,
      perPage: 25,
      total: 50,
      lastPage: 3,
    });
  });

  it("falls back safely when metadata is missing", async () => {
    mockedHttp.get.mockResolvedValueOnce({ data: [{ id: 9 }] });

    const result = await listSections(1, 2, {});

    expect(result).toEqual({
      items: [{ id: 9 }],
      page: 1,
      perPage: 10,
      total: 1,
      lastPage: 1,
    });
  });

  it("gets, creates, updates and deletes section", async () => {
    mockedHttp.get.mockResolvedValueOnce({ data: { data: { id: 3 } } });
    mockedHttp.post.mockResolvedValueOnce({ data: { data: { id: 3 } } });
    mockedHttp.put.mockResolvedValueOnce({ data: { data: { id: 3 } } });
    mockedHttp.delete.mockResolvedValueOnce({});

    await expect(getSection(1, 2, 3)).resolves.toEqual({ id: 3 });
    await expect(createSection(1, 2, { title: "S1" })).resolves.toEqual({
      id: 3,
    });
    await expect(updateSection(1, 2, 3, { title: "S2" })).resolves.toEqual({
      id: 3,
    });
    await deleteSection(1, 2, 3);

    expect(mockedHttp.delete).toHaveBeenCalledWith(
      "/api/v1/admin/centers/1/courses/2/sections/3",
    );
  });

  it("toggles visibility and reorders sections", async () => {
    mockedHttp.patch.mockResolvedValueOnce({
      data: { data: { id: 3, is_visible: true } },
    });
    mockedHttp.put.mockResolvedValueOnce({ data: { ok: true } });

    await expect(toggleSectionVisibility(1, 2, 3)).resolves.toEqual({
      id: 3,
      is_visible: true,
    });
    await expect(
      reorderSections(1, 2, { ordered_ids: [3, 4] }),
    ).resolves.toEqual({
      ok: true,
    });
  });

  it("lists and gets section media", async () => {
    mockedHttp.get.mockResolvedValueOnce({ data: { data: [{ id: 10 }] } });
    mockedHttp.get.mockResolvedValueOnce({ data: { data: { id: 11 } } });
    mockedHttp.get.mockResolvedValueOnce({ data: { data: [{ id: 20 }] } });
    mockedHttp.get.mockResolvedValueOnce({ data: { data: { id: 21 } } });

    await expect(listSectionVideos(1, 2, 3)).resolves.toEqual([{ id: 10 }]);
    await expect(getSectionVideo(1, 2, 3, 11)).resolves.toEqual({ id: 11 });
    await expect(listSectionPdfs(1, 2, 3)).resolves.toEqual([{ id: 20 }]);
    await expect(getSectionPdf(1, 2, 3, 21)).resolves.toEqual({ id: 21 });
  });

  it("attaches and detaches media", async () => {
    mockedHttp.post.mockResolvedValueOnce({ data: { ok: true } });
    mockedHttp.delete.mockResolvedValueOnce({ data: { ok: true } });
    mockedHttp.post.mockResolvedValueOnce({ data: { ok: true } });
    mockedHttp.delete.mockResolvedValueOnce({ data: { ok: true } });

    await expect(attachSectionVideo(1, 2, 3, { video_id: 9 })).resolves.toEqual(
      {
        ok: true,
      },
    );
    await expect(detachSectionVideo(1, 2, 3, 9)).resolves.toEqual({ ok: true });
    await expect(attachSectionPdf(1, 2, 3, { pdf_id: 7 })).resolves.toEqual({
      ok: true,
    });
    await expect(detachSectionPdf(1, 2, 3, 7)).resolves.toEqual({ ok: true });
  });

  it("publishes and unpublishes section", async () => {
    mockedHttp.post.mockResolvedValueOnce({
      data: { data: { id: 3, status: "published" } },
    });
    mockedHttp.post.mockResolvedValueOnce({
      data: { data: { id: 3, status: "draft" } },
    });

    await expect(publishSection(1, 2, 3)).resolves.toEqual({
      id: 3,
      status: "published",
    });
    await expect(unpublishSection(1, 2, 3)).resolves.toEqual({
      id: 3,
      status: "draft",
    });
  });
});
