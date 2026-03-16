import type { AIContentJob } from "@/features/ai/types/ai";

export type EditablePayload = Record<string, unknown>;

function toRecord(value: unknown): EditablePayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as EditablePayload;
}

function deepClonePayload(payload: EditablePayload): EditablePayload {
  if (typeof structuredClone === "function") {
    return structuredClone(payload);
  }

  try {
    return JSON.parse(JSON.stringify(payload)) as EditablePayload;
  } catch {
    return { ...payload };
  }
}

export function getEditablePayload(job: AIContentJob | null): EditablePayload {
  if (!job) return {};

  const reviewed = toRecord(job.reviewed_payload);
  if (Object.keys(reviewed).length > 0) {
    return reviewed;
  }

  const generated = toRecord(job.generated_payload);
  if (Object.keys(generated).length > 0) {
    return generated;
  }

  return {};
}

export function toPrettyJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

function hasPath(payload: EditablePayload, path: string[]): boolean {
  let current: unknown = payload;

  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return false;
    }

    if (!Object.prototype.hasOwnProperty.call(current, key)) {
      return false;
    }

    current = (current as EditablePayload)[key];
  }

  return true;
}

export function readPath(payload: EditablePayload, path: string[]): unknown {
  let current: unknown = payload;

  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }

    current = (current as EditablePayload)[key];
  }

  return current;
}

export function writePath(
  payload: EditablePayload,
  path: string[],
  value: unknown,
): EditablePayload {
  const next = deepClonePayload(payload);

  if (path.length === 0) {
    return next;
  }

  let cursor: EditablePayload = next;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    const currentNode = cursor[key];

    if (
      !currentNode ||
      typeof currentNode !== "object" ||
      Array.isArray(currentNode)
    ) {
      cursor[key] = {};
    }

    cursor = cursor[key] as EditablePayload;
  }

  cursor[path[path.length - 1]] = value;
  return next;
}

export function readStringFromPaths(
  payload: EditablePayload,
  paths: string[][],
): string {
  for (const path of paths) {
    const value = readPath(payload, path);
    if (typeof value === "string") {
      return value;
    }
  }

  return "";
}

export function readNumberFromPaths(
  payload: EditablePayload,
  paths: string[][],
): number | null {
  for (const path of paths) {
    const value = readPath(payload, path);

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

export function readArrayFromPaths(
  payload: EditablePayload,
  paths: string[][],
): unknown[] {
  for (const path of paths) {
    const value = readPath(payload, path);
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

export function getFirstExistingPath(
  payload: EditablePayload,
  paths: string[][],
): string[] {
  for (const path of paths) {
    if (hasPath(payload, path)) {
      return path;
    }
  }

  return paths[0] ?? [];
}
