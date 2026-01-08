export type Instructor = {
  id: number | string;
  name?: string | null;
  email?: string | null;
  status?: string | null;
  center_id?: number | string | null;
  created_at?: string | null;
  [key: string]: unknown;
};
