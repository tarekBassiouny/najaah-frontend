export type AuditLog = {
  id: number | string;
  action?: string | null;
  actor_id?: number | string | null;
  center_id?: number | string | null;
  description?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};
