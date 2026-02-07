import { http } from "@/lib/http";
import type { Instructor } from "@/features/instructors/types/instructor";
import type { PaginatedResponse } from "@/types/pagination";

export type ListInstructorsParams = {
  page?: number;
  per_page?: number;
  search?: string;
  center_id?: number | string;
  course_id?: number | string;
  status?: string;
};

type RawInstructorsResponse = {
  data?: Instructor[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
};

export async function listInstructors(
  params: ListInstructorsParams,
): Promise<PaginatedResponse<Instructor>> {
  const { data } = await http.get<RawInstructorsResponse>(
    "/api/v1/admin/instructors",
    {
      params: {
        page: params.page,
        per_page: params.per_page,
        search: params.search || undefined,
        center_id: params.center_id ?? undefined,
        course_id: params.course_id ?? undefined,
        status: params.status || undefined,
      },
    },
  );

  return {
    items: data?.data ?? [],
    meta: {
      page: data?.meta?.page ?? params.page ?? 1,
      per_page: data?.meta?.per_page ?? params.per_page ?? 10,
      total: data?.meta?.total ?? 0,
    },
  };
}

type RawInstructorResponse = {
  data?: Instructor;
};

export async function getInstructor(
  instructorId: string | number,
): Promise<Instructor | null> {
  const { data } = await http.get<RawInstructorResponse>(
    `/api/v1/admin/instructors/${instructorId}`,
  );
  return data?.data ?? null;
}

export type CreateInstructorPayload = {
  center_id?: string | number;
  name_translations: Record<string, string>;
  bio_translations?: Record<string, string>;
  title_translations?: Record<string, string>;
  email?: string;
  phone?: string;
  avatar_url?: string;
  social_links?: string[];
  metadata?: Record<string, unknown>;
};

function buildInstructorFormData(
  payload: CreateInstructorPayload,
  avatar?: File | Blob,
): FormData {
  const formData = new FormData();

  if (payload.center_id) {
    formData.append("center_id", String(payload.center_id));
  }

  if (payload.name_translations) {
    Object.entries(payload.name_translations).forEach(([lang, value]) => {
      formData.append(`name_translations[${lang}]`, value);
    });
  }

  if (payload.bio_translations) {
    Object.entries(payload.bio_translations).forEach(([lang, value]) => {
      formData.append(`bio_translations[${lang}]`, value);
    });
  }

  if (payload.title_translations) {
    Object.entries(payload.title_translations).forEach(([lang, value]) => {
      formData.append(`title_translations[${lang}]`, value);
    });
  }

  if (payload.email) formData.append("email", payload.email);
  if (payload.phone) formData.append("phone", payload.phone);
  if (payload.avatar_url) formData.append("avatar_url", payload.avatar_url);

  if (payload.social_links) {
    payload.social_links.forEach((link, index) => {
      formData.append(`social_links[${index}]`, link);
    });
  }

  if (payload.metadata) {
    Object.entries(payload.metadata).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          formData.append(`metadata[${key}][${index}]`, String(item));
        });
      } else {
        formData.append(`metadata[${key}]`, String(value));
      }
    });
  }

  if (avatar) {
    formData.append("avatar", avatar);
  }

  return formData;
}

export async function createInstructor(
  payload: CreateInstructorPayload,
  avatar?: File | Blob,
): Promise<Instructor> {
  const formData = buildInstructorFormData(payload, avatar);

  const { data } = await http.post<RawInstructorResponse>(
    "/api/v1/admin/instructors",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data?.data ?? (data as unknown as Instructor);
}

export async function updateInstructor(
  instructorId: string | number,
  payload: CreateInstructorPayload,
  avatar?: File | Blob,
): Promise<Instructor> {
  const formData = buildInstructorFormData(payload, avatar);
  formData.append("_method", "PUT");

  const { data } = await http.post<RawInstructorResponse>(
    `/api/v1/admin/instructors/${instructorId}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data?.data ?? (data as unknown as Instructor);
}

export async function deleteInstructor(
  instructorId: string | number,
): Promise<void> {
  await http.delete(`/api/v1/admin/instructors/${instructorId}`);
}
