import { isAxiosError } from "axios";

type RecordValue = Record<string, unknown>;

export type AdminErrorDetails = Record<string, unknown>;

export type AdminActionResult<T = unknown> = {
  success: boolean;
  message: string;
  data: T | null;
  code?: string;
  errors?: AdminErrorDetails;
  error?: {
    code?: string;
    message?: string;
    details?: AdminErrorDetails;
  };
  _response_message?: string;
};

function asRecord(value: unknown): RecordValue | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as RecordValue;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function extractFirstMessage(node: unknown): string | null {
  const direct = readString(node);
  if (direct) return direct;

  if (Array.isArray(node)) {
    for (const item of node) {
      const message = extractFirstMessage(item);
      if (message) return message;
    }
    return null;
  }

  const record = asRecord(node);
  if (!record) return null;

  for (const value of Object.values(record)) {
    const message = extractFirstMessage(value);
    if (message) return message;
  }

  return null;
}

export function getAdminResponseMessage(
  payload: unknown,
  fallback = "",
): string {
  const record = asRecord(payload);
  if (!record) return fallback;

  const direct =
    readString(record._response_message) ??
    readString(record.response_message) ??
    readString(record.message);
  if (direct) return direct;

  const nestedData = asRecord(record.data);
  const nestedMessage = readString(nestedData?.message);
  if (nestedMessage) return nestedMessage;

  return fallback;
}

export function withResponseMessage<T>(resource: T, payload: unknown): T {
  const rawRecord = asRecord(payload);
  const message = getAdminResponseMessage(payload);

  if (!resource || typeof resource !== "object" || Array.isArray(resource)) {
    return resource;
  }

  const resourceRecord = resource as Record<string, unknown>;
  const next: Record<string, unknown> = { ...resourceRecord };

  if (message) {
    next._response_message = message;
  }

  if (rawRecord && Object.prototype.hasOwnProperty.call(rawRecord, "success")) {
    next.success = rawRecord.success;
  }

  const responseCode = readString(rawRecord?.code);
  if (responseCode) {
    next.code = responseCode;
  }

  const responseErrors = asRecord(rawRecord?.errors);
  if (responseErrors) {
    next.errors = responseErrors;
  }

  return next as T;
}

export function unwrapAdminData<T>(payload: unknown, fallback?: T): T {
  const record = asRecord(payload);
  if (!record) {
    return (payload as T) ?? (fallback as T);
  }

  if (Object.prototype.hasOwnProperty.call(record, "data")) {
    return ((record.data as T | undefined) ?? fallback) as T;
  }

  return (record as unknown as T) ?? (fallback as T);
}

export function normalizeAdminActionResult<T = unknown>(
  payload: unknown,
): AdminActionResult<T> {
  const record = asRecord(payload);
  if (!record) {
    return {
      success: true,
      message: "",
      data: (payload as T) ?? null,
    };
  }

  const legacyErrorNode = asRecord(record.error);
  const message =
    readString(record.message) ?? readString(legacyErrorNode?.message) ?? "";
  const code =
    readString(record.code) ?? readString(legacyErrorNode?.code) ?? undefined;
  const errors =
    asRecord(record.errors) ??
    asRecord(legacyErrorNode?.details) ??
    asRecord(legacyErrorNode?.errors) ??
    undefined;
  const hasDataField = Object.prototype.hasOwnProperty.call(record, "data");
  const dataNode = hasDataField ? (record.data as T | null | undefined) : null;

  return {
    success: record.success === false ? false : true,
    message,
    code,
    errors,
    error: legacyErrorNode
      ? {
          code: readString(legacyErrorNode.code) ?? undefined,
          message: readString(legacyErrorNode.message) ?? undefined,
          details: asRecord(legacyErrorNode.details) ?? undefined,
        }
      : undefined,
    data: dataNode ?? null,
    _response_message: message || undefined,
  };
}

export function isAdminRequestSuccessful(payload: unknown): boolean {
  const record = asRecord(payload);
  if (!record) return true;

  if (Object.prototype.hasOwnProperty.call(record, "success")) {
    return record.success === true;
  }

  return true;
}

export function getAdminApiErrorCode(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;
  const data = asRecord(error.response?.data);
  if (!data) return undefined;

  const legacyErrorNode = asRecord(data.error);
  return (
    readString(data.code) ?? readString(legacyErrorNode?.code) ?? undefined
  );
}

export function getAdminApiFieldErrors(
  error: unknown,
): AdminErrorDetails | undefined {
  if (!isAxiosError(error)) return undefined;
  const data = asRecord(error.response?.data);
  if (!data) return undefined;

  const legacyErrorNode = asRecord(data.error);
  return (
    asRecord(data.errors) ??
    asRecord(legacyErrorNode?.details) ??
    asRecord(legacyErrorNode?.errors) ??
    undefined
  );
}

export function getAdminApiFirstFieldError(error: unknown): string | null {
  return extractFirstMessage(getAdminApiFieldErrors(error));
}

export function getAdminApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!isAxiosError(error)) return fallback;
  const data = asRecord(error.response?.data);
  if (!data) return fallback;

  const legacyErrorNode = asRecord(data.error);

  const topLevel = readString(data.message);
  if (topLevel) return topLevel;

  const topLevelField = extractFirstMessage(data.errors);
  if (topLevelField) return topLevelField;

  const legacyMessage = readString(legacyErrorNode?.message);
  if (legacyMessage) return legacyMessage;

  const legacyField =
    extractFirstMessage(legacyErrorNode?.details) ??
    extractFirstMessage(data.details) ??
    extractFirstMessage(legacyErrorNode?.errors);
  if (legacyField) return legacyField;

  const flatError = readString(data.error);
  if (flatError) return flatError;

  return fallback;
}
