import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createStudent,
  deleteStudent,
  exportStudents,
  getStudent,
  importStudents,
  listStudents,
  resetStudentDevice,
  updateStudent,
  updateStudentStatus,
} from "@/features/students/services/students.service";
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

describe("students.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists students and applies pagination fallback", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: { data: [{ id: 1 }], meta: {} },
    });

    const result = await listStudents({ page: 4, per_page: 25, search: "" });

    expect(mockedHttp.get).toHaveBeenCalledWith("/api/v1/admin/students", {
      params: {
        page: 4,
        per_page: 25,
        search: undefined,
        center_id: undefined,
        status: undefined,
        course_id: undefined,
      },
    });
    expect(result).toEqual({
      items: [{ id: 1 }],
      meta: { page: 4, per_page: 25, total: 0 },
    });
  });

  it("gets student and returns null when missing", async () => {
    mockedHttp.get.mockResolvedValueOnce({ data: { data: { id: 2 } } });
    mockedHttp.get.mockResolvedValueOnce({ data: {} });

    await expect(getStudent(2)).resolves.toEqual({ id: 2 });
    await expect(getStudent(999)).resolves.toBeNull();
  });

  it("creates, updates, changes status, resets device and deletes", async () => {
    mockedHttp.post.mockResolvedValueOnce({ data: { data: { id: 3 } } });
    mockedHttp.put.mockResolvedValueOnce({ data: { data: { id: 3 } } });
    mockedHttp.put.mockResolvedValueOnce({ data: { data: { id: 3 } } });
    mockedHttp.post.mockResolvedValueOnce({ data: { data: { id: 3 } } });
    mockedHttp.delete.mockResolvedValueOnce({});

    await expect(
      createStudent({ name: "S", email: "s@test.com" }),
    ).resolves.toEqual({ id: 3 });
    await expect(updateStudent(3, { status: "active" })).resolves.toEqual({
      id: 3,
    });
    await expect(
      updateStudentStatus(3, { status: "blocked", reason: "policy" }),
    ).resolves.toEqual({ id: 3 });
    await expect(resetStudentDevice(3)).resolves.toEqual({ id: 3 });
    await deleteStudent(3);

    expect(mockedHttp.delete).toHaveBeenCalledWith("/api/v1/admin/students/3");
  });

  it("imports students with multipart payload", async () => {
    const file = new File(["a,b"], "students.csv", { type: "text/csv" });
    mockedHttp.post.mockResolvedValueOnce({
      data: { data: { imported_count: 1 } },
    });

    const result = await importStudents(10, file);

    const [, body, config] = mockedHttp.post.mock.calls[0];
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("file")).toBeTruthy();
    expect(body.get("center_id")).toBe("10");
    expect(config).toEqual({
      headers: { "Content-Type": "multipart/form-data" },
    });
    expect(result).toEqual({ imported_count: 1 });
  });

  it("exports students as blob", async () => {
    const blob = new Blob(["x"], { type: "text/csv" });
    mockedHttp.get.mockResolvedValueOnce({ data: blob });

    const result = await exportStudents({
      center_id: 5,
      status: "active",
      search: "a",
    });

    expect(mockedHttp.get).toHaveBeenCalledWith(
      "/api/v1/admin/students/export",
      {
        params: {
          center_id: 5,
          status: "active",
          search: "a",
        },
        responseType: "blob",
      },
    );
    expect(result).toBe(blob);
  });
});
