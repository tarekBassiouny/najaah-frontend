import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import {
  createPdfUploadSession,
  deletePdf,
  finalizePdfUploadSession,
  listPdfs,
  uploadPdfToStorage,
} from "@/features/pdfs/services/pdfs.service";
import { http } from "@/lib/http";

vi.mock("axios", () => ({
  default: {
    put: vi.fn(),
  },
}));

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

const mockedAxios = axios as unknown as {
  put: ReturnType<typeof vi.fn>;
};

describe("pdfs.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists PDFs with supported filters including course_id", async () => {
    mockedHttp.get.mockResolvedValueOnce({
      data: {
        data: [{ id: 1 }],
        meta: { page: 2, per_page: 15, total: 30 },
      },
    });

    const result = await listPdfs({
      centerId: 4,
      page: 1,
      per_page: 15,
      search: "notes",
      course_id: 9,
    });

    expect(mockedHttp.get).toHaveBeenCalledWith(
      "/api/v1/admin/centers/4/pdfs",
      {
        params: {
          page: 1,
          per_page: 15,
          search: "notes",
          course_id: 9,
        },
      },
    );
    expect(result).toEqual({
      items: [{ id: 1 }],
      meta: { page: 2, per_page: 15, total: 30 },
    });
  });

  it("creates upload session with contract fields", async () => {
    mockedHttp.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: "Upload session created",
        data: {
          upload_session_id: 77,
          upload_endpoint: "https://storage.example/upload",
          required_headers: { "Content-Type": "application/pdf" },
          expires_at: "2026-02-25T12:00:00Z",
        },
      },
    });

    const session = await createPdfUploadSession(4, {
      original_filename: "lesson-1.pdf",
      file_size_kb: 2048,
    });

    expect(mockedHttp.post).toHaveBeenCalledWith(
      "/api/v1/admin/centers/4/pdfs/upload-sessions",
      {
        original_filename: "lesson-1.pdf",
        file_size_kb: 2048,
      },
    );
    expect(session).toMatchObject({
      upload_session_id: 77,
      upload_endpoint: "https://storage.example/upload",
      _response_message: "Upload session created",
    });
  });

  it("finalizes upload session with metadata payload", async () => {
    mockedHttp.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: "Upload finalized",
        data: {
          upload_session_id: 77,
          upload_status: 2,
        },
      },
    });

    const result = await finalizePdfUploadSession(4, 77, {
      title_translations: { en: "Lesson Notes" },
      description_translations: { en: "Week 1 notes" },
    });

    expect(mockedHttp.post).toHaveBeenCalledWith(
      "/api/v1/admin/centers/4/pdfs/upload-sessions/77/finalize",
      {
        title_translations: { en: "Lesson Notes" },
        description_translations: { en: "Week 1 notes" },
      },
    );
    expect(result).toMatchObject({
      upload_session_id: 77,
      upload_status: 2,
      _response_message: "Upload finalized",
    });
  });

  it("uploads PDF bytes to storage endpoint with required headers", async () => {
    mockedAxios.put.mockResolvedValueOnce({});

    const file = new Blob(["%PDF-1.4"], {
      type: "application/pdf",
    });

    await uploadPdfToStorage("https://storage.example/upload", file, {
      "Content-Type": "application/pdf",
      "x-amz-acl": "private",
    });

    expect(mockedAxios.put).toHaveBeenCalledWith(
      "https://storage.example/upload",
      file,
      {
        headers: {
          "Content-Type": "application/pdf",
          "x-amz-acl": "private",
        },
        withCredentials: false,
      },
    );
  });

  it("normalizes delete response using admin action contract", async () => {
    mockedHttp.delete.mockResolvedValueOnce({
      data: {
        success: true,
        message: "PDF deleted successfully",
        data: null,
      },
    });

    const result = await deletePdf(4, 12);

    expect(mockedHttp.delete).toHaveBeenCalledWith(
      "/api/v1/admin/centers/4/pdfs/12",
    );
    expect(result).toEqual({
      success: true,
      message: "PDF deleted successfully",
      code: undefined,
      errors: undefined,
      error: undefined,
      data: null,
      _response_message: "PDF deleted successfully",
    });
  });
});
