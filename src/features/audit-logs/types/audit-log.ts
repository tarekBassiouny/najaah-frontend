export type AuditLogActor = {
  id: number | string;
  type?: string | null;
  name?: string | null;
  email?: string | null;
  [key: string]: unknown;
};

export type AuditLogEntity = {
  id: number | string;
  type?: string | null;
  name?: string | null;
  [key: string]: unknown;
};

export type AuditLog = {
  id: number | string;
  action?: string | null;
  actor_id?: number | string | null;
  actor_type?: string | null;
  actor_name?: string | null;
  actor?: AuditLogActor | null;
  entity_id?: number | string | null;
  entity_type?: string | null;
  entity?: AuditLogEntity | null;
  center_id?: number | string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};
