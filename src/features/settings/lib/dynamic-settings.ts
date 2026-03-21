export type DynamicSettingDefinition = {
  scope?: string;
  managed_by?: string;
  group?: string;
  type?: string;
  storage?: string;
  default?: unknown;
  properties?: DynamicSettingsCatalog;
  feature_flag?: string;
  system_limit?: string;
  system_override?: string;
  rules?: string[];
  [key: string]: unknown;
};

export type DynamicSettingsCatalog = Record<string, DynamicSettingDefinition>;
export type DynamicSettingsGroups = Record<string, string[]>;
export type DynamicSettingsMap = Record<string, unknown>;
export type DynamicGroupedSettings = Record<string, DynamicSettingsMap>;

export type DynamicAIEditableMap = Record<string, string[]>;

export type DynamicAIProvider = {
  key?: string | null;
  label?: string | null;
  enabled?: boolean;
  configured?: boolean;
  default_model?: string | null;
  models?: string[];
  allowed_models?: string[];
  limits?: Record<string, unknown> | null;
  editable_fields?: string[];
  managed_by?: string;
  [key: string]: unknown;
};

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

export function inferFieldType(
  value: unknown,
  definition?: DynamicSettingDefinition | null,
): string {
  if (definition?.type) {
    return definition.type;
  }

  if (Array.isArray(value)) {
    return "array";
  }

  if (value === null || value === undefined) {
    return "string";
  }

  if (typeof value === "boolean") {
    return "boolean";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "number";
  }

  if (typeof value === "object") {
    return "object";
  }

  return "string";
}

export function humanizeKey(key: string): string {
  return key
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  if (typeof value === "boolean") {
    return value ? "Enabled" : "Disabled";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function normalizeKeyList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  return [];
}

export function getObjectKeys(
  value: unknown,
  definition?: DynamicSettingDefinition | null,
): string[] {
  const keys = new Set<string>();
  const definitionProperties = asRecord(definition?.properties);
  const recordValue = asRecord(value);
  const defaultValue = asRecord(definition?.default);

  Object.keys(definitionProperties ?? {}).forEach((key) => keys.add(key));
  Object.keys(defaultValue ?? {}).forEach((key) => keys.add(key));
  Object.keys(recordValue ?? {}).forEach((key) => keys.add(key));

  return Array.from(keys);
}

export function flattenGroupedSettings(
  groups: DynamicGroupedSettings | DynamicSettingsMap | undefined,
): DynamicSettingsMap {
  const record = asRecord(groups);
  if (!record) {
    return {};
  }

  const flattened: DynamicSettingsMap = {};

  Object.values(record).forEach((groupValue) => {
    const groupRecord = asRecord(groupValue);
    if (!groupRecord) {
      return;
    }

    Object.entries(groupRecord).forEach(([key, value]) => {
      flattened[key] = cloneValue(value);
    });
  });

  return flattened;
}

export function buildGroupedSettingKeys(
  preferredGroups: DynamicSettingsGroups | undefined,
  fallbackGroups: DynamicSettingsGroups | undefined,
  catalogGroups?: DynamicSettingsGroups,
): Array<{ group: string; keys: string[] }> {
  const groups = new Map<string, Set<string>>();

  const collect = (source: DynamicSettingsGroups | undefined) => {
    if (!source) return;

    Object.entries(source).forEach(([group, keys]) => {
      const bucket = groups.get(group) ?? new Set<string>();
      normalizeKeyList(keys).forEach((key) => bucket.add(key));
      groups.set(group, bucket);
    });
  };

  collect(catalogGroups);
  collect(preferredGroups);
  collect(fallbackGroups);

  return Array.from(groups.entries()).map(([group, values]) => ({
    group,
    keys: Array.from(values),
  }));
}

export function buildSystemSettingsMap<T extends { key: string }>(
  items: T[],
): Record<string, T> {
  return Object.fromEntries(items.map((item) => [String(item.key), item]));
}

export function getSystemEditorValue(
  key: string,
  storedValue: unknown,
  definition?: DynamicSettingDefinition | null,
  fallback?: unknown,
): unknown {
  const sourceValue = storedValue ?? fallback ?? definition?.default ?? null;
  const sourceRecord = asRecord(sourceValue);
  const type = inferFieldType(sourceValue, definition);

  if (
    type !== "object" &&
    sourceRecord &&
    Object.keys(sourceRecord).length === 1
  ) {
    return cloneValue(Object.values(sourceRecord)[0]);
  }

  return cloneValue(sourceValue);
}

function inferSystemWrapperKey(key: string, type: string): string {
  if (type === "boolean") {
    return "enabled";
  }

  if (type === "integer" || type === "number") {
    return "value";
  }

  const segments = key.split(/[._]/).filter(Boolean);
  return segments[segments.length - 1] ?? "value";
}

export function serializeSystemSettingValue(
  key: string,
  value: unknown,
  definition?: DynamicSettingDefinition | null,
  existingValue?: unknown,
): Record<string, unknown> | null {
  if (value === null || value === undefined) {
    return null;
  }

  const existingRecord = asRecord(existingValue);
  const type = inferFieldType(value, definition);

  if (type === "object") {
    return asRecord(value) ?? null;
  }

  if (existingRecord && Object.keys(existingRecord).length === 1) {
    return {
      [Object.keys(existingRecord)[0]]: value,
    };
  }

  return {
    [inferSystemWrapperKey(key, type)]: value,
  };
}

export function getDefinitionForKey(
  catalog: DynamicSettingsCatalog | undefined,
  key: string,
): DynamicSettingDefinition | null {
  if (!catalog) {
    return null;
  }

  return catalog[key] ?? null;
}

export function getSettingValueForRender(
  key: string,
  draftValues: DynamicSettingsMap,
  fallbackValues?: DynamicSettingsMap,
  definition?: DynamicSettingDefinition | null,
): unknown {
  if (Object.prototype.hasOwnProperty.call(draftValues, key)) {
    return draftValues[key];
  }

  if (
    fallbackValues &&
    Object.prototype.hasOwnProperty.call(fallbackValues, key)
  ) {
    return cloneValue(fallbackValues[key]);
  }

  return cloneValue(definition?.default ?? null);
}
