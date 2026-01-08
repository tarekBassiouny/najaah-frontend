export type ExtraViewRequest = {
  id: number | string;
  status?: string | null;
  user_id?: number | string | null;
  center_id?: number | string | null;
  created_at?: string | null;
  [key: string]: unknown;
};
