export type StudentDevice = {
  id?: string | null;
  model?: string | null;
  os_version?: string | null;
  registered_at?: string | null;
  [key: string]: unknown;
};

export type Student = {
  id: number | string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  center_id?: number | string | null;
  device?: StudentDevice | null;
  enrollments_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type StudentImportResult = {
  total?: number;
  success?: number;
  failed?: number;
  errors?: Array<{
    row?: number;
    message?: string;
  }>;
  [key: string]: unknown;
};
