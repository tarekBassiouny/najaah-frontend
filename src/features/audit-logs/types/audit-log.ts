export type AuditLogUser = {
  id: number | string;
  name?: string | null;
  [key: string]: unknown;
};

export type AuditLog = {
  id: number | string;
  user_id?: number | string | null;
  center_id?: number | string | null;
  user?: AuditLogUser | null;
  action?: string | null;
  entity_type?: string | null;
  entity_id?: number | string | null;
  entity_label?: string | number | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  [key: string]: unknown;
};
