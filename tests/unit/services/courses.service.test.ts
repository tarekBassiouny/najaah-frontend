import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assignCoursePdf,
  assignCourseVideo,
  cloneCourse,
  cloneCourseWithOptions,
  createCourse,
  deleteCourse,
  getCourse,
  listCenterCourses,
  listCourses,
  publishCourse,
  removeCoursePdf,
  removeCourseVideo,
  updateCourse,
} from "@/features/courses/services/courses.service";
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

describe("courses.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes listCourses from nested data/meta shape", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        data: {
          data: [{ id: 1 }],
          meta: { current_page: 2, per_page: 25, total: 40, last_page: 3 },
        },
      },
    });

    const result = await listCourses({ page: 1, per_page: 10, search: "" });

    expect(result).toEqual({
      items: [{ id: 1 }],
      page: 2,
      perPage: 25,
      total: 40,
      lastPage: 3,
    });
  });

  it("falls back to request pagination when metadata is missing", async () => {
    mockedHttp.get.mockResolvedValueOnce({ data: { data: [{ id: 5 }] } });

    const result = await listCourses({ page: 3, per_page: 20 });

    expect(result.page).toBe(3);
    expect(result.perPage).toBe(20);
    expect(result.total).toBe(1);
    expect(result.lastPage).toBe(1);
  });

  it("lists center courses with scoped endpoint", async () => {
    mockedHttp.get.mockResolvedValueOnce({ data: { data: [] } });

    await listCenterCourses({ center_id: 9, page: 1, per_page: 10 });

    expect(mockedHttp.get).toHaveBeenCalledWith(
      "/api/v1/admin/centers/9/courses",
      expect.any(Object),
    );
  });

  it("gets, creates, updates, publishes and deletes course", async () => {
    mockedHttp.get.mockResolvedValueOnce({ data: { data: { id: 2 } } });
    mockedHttp.post.mockResolvedValueOnce({ data: { data: { id: 3 } } });
    mockedHttp.put.mockResolvedValueOnce({ data: { data: { id: 3 } } });
    mockedHttp.post.mockResolvedValueOnce({ data: { data: { id: 3 } } });
    mockedHttp.delete.mockResolvedValueOnce({});

    await expect(getCourse(2)).resolves.toEqual({ id: 2 });
    await expect(createCourse({ title: "Course" })).resolves.toEqual({ id: 3 });
    await expect(updateCourse(3, { status: "draft" })).resolves.toEqual({
      id: 3,
    });
    await expect(publishCourse(3)).resolves.toEqual({ id: 3 });
    await deleteCourse(3);

    expect(mockedHttp.delete).toHaveBeenCalledWith("/api/v1/admin/courses/3");
  });

  it("assigns and removes media", async () => {
    mockedHttp.post.mockResolvedValueOnce({ data: { assigned: true } });
    mockedHttp.delete.mockResolvedValueOnce({ data: { removed: true } });
    mockedHttp.post.mockResolvedValueOnce({ data: { assigned: true } });
    mockedHttp.delete.mockResolvedValueOnce({ data: { removed: true } });

    await expect(assignCourseVideo(1, 2, { video_id: 33 })).resolves.toEqual({
      assigned: true,
    });
    await expect(removeCourseVideo(1, 2, 33)).resolves.toEqual({
      removed: true,
    });
    await expect(assignCoursePdf(1, 2, { pdf_id: 55 })).resolves.toEqual({
      assigned: true,
    });
    await expect(removeCoursePdf(1, 2, 55)).resolves.toEqual({ removed: true });
  });

  it("clones course with and without options", async () => {
    mockedHttp.post.mockResolvedValueOnce({ data: { data: { id: 10 } } });
    mockedHttp.post.mockResolvedValueOnce({ data: { data: { id: 11 } } });

    await expect(cloneCourse(7)).resolves.toEqual({ id: 10 });
    await expect(
      cloneCourseWithOptions(8, {
        include_sections: true,
        include_videos: false,
      }),
    ).resolves.toEqual({ id: 11 });

    expect(mockedHttp.post).toHaveBeenLastCalledWith(
      "/api/v1/admin/courses/8/clone",
      { options: { include_sections: true, include_videos: false } },
    );
  });
});
