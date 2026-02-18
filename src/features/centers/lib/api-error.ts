import { isAxiosError } from "axios";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function extractFirstMessage(node: unknown): string | null {
  if (typeof node === "string" && node.trim()) {
    return node.trim();
  }

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

export function getCenterApiErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return fallback;

  const data = asRecord(error.response?.data);
  if (!data) return fallback;

  const errorNode = asRecord(data.error);

  const detailsMessage =
    extractFirstMessage(errorNode?.details) ??
    extractFirstMessage(data.details);
  if (detailsMessage) return detailsMessage;

  if (typeof errorNode?.message === "string" && errorNode.message.trim()) {
    return errorNode.message.trim();
  }

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message.trim();
  }

  const validationMessage =
    extractFirstMessage(errorNode?.errors) ?? extractFirstMessage(data.errors);
  if (validationMessage) return validationMessage;

  if (typeof data.error === "string" && data.error.trim()) {
    return data.error.trim();
  }

  return fallback;
}
