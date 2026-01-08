export type Role = {
  id: number | string;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};
