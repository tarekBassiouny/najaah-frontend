"use client";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  asRecord,
  getObjectKeys,
  inferFieldType,
  translateDynamicLabel,
  type DynamicSettingDefinition,
} from "@/features/settings/lib/dynamic-settings";
import { useTranslation } from "@/features/localization";
import { cn } from "@/lib/utils";

type DynamicSettingFieldProps = {
  fieldKey: string;
  value: unknown;
  definition?: DynamicSettingDefinition | null;
  disabled?: boolean;
  resolvedValue?: unknown;
  hint?: string | null;
  description?: string | null;
  depth?: number;
  onChange: (_value: unknown) => void;
};

function CheckboxField({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (_checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-950/40">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
      />
      <span>{label}</span>
    </label>
  );
}

function formatDisplayValueForLocale(
  value: unknown,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  if (value === null || value === undefined || value === "") {
    return t("pages.dynamicSettings.notSet");
  }

  if (typeof value === "boolean") {
    return value
      ? t("pages.dynamicSettings.enabled")
      : t("pages.dynamicSettings.disabled");
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

export function DynamicSettingField({
  fieldKey,
  value,
  definition,
  disabled = false,
  resolvedValue,
  hint,
  description,
  depth = 0,
  onChange,
}: DynamicSettingFieldProps) {
  const { t } = useTranslation();
  const type = inferFieldType(value, definition);
  const label = translateDynamicLabel(t, "fields", fieldKey);
  const objectKeys = getObjectKeys(value, definition);
  const valueRecord = asRecord(value);
  const resolvedRecord = asRecord(resolvedValue);
  const displayValue = formatDisplayValueForLocale(value, t);
  const displayResolvedValue = formatDisplayValueForLocale(resolvedValue, t);

  if (type === "object" && objectKeys.length > 0) {
    return (
      <div
        className={cn(
          "space-y-4 rounded-2xl border border-gray-200/80 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-950/30",
          depth > 0 && "rounded-xl bg-white/80 dark:bg-gray-950/50",
        )}
      >
        <div className="space-y-1">
          <Label className="text-sm font-semibold text-gray-950 dark:text-white">
            {label}
          </Label>
          {description ? (
            <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
              {description}
            </p>
          ) : null}
          {hint ? (
            <p className="text-xs leading-5 text-amber-700 dark:text-amber-300">
              {hint}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {objectKeys.map((nestedKey) => (
            <DynamicSettingField
              key={nestedKey}
              fieldKey={nestedKey}
              value={
                valueRecord?.[nestedKey] ??
                definition?.properties?.[nestedKey]?.default ??
                null
              }
              resolvedValue={resolvedRecord?.[nestedKey]}
              definition={definition?.properties?.[nestedKey] ?? null}
              disabled={disabled}
              depth={depth + 1}
              onChange={(nextValue) =>
                onChange({
                  ...(valueRecord ?? {}),
                  [nestedKey]: nextValue,
                })
              }
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-sm font-semibold text-gray-950 dark:text-white">
          {label}
        </Label>
        {description ? (
          <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
            {description}
          </p>
        ) : null}
        {hint ? (
          <p className="text-xs leading-5 text-amber-700 dark:text-amber-300">
            {hint}
          </p>
        ) : null}
        {resolvedValue !== undefined &&
        displayResolvedValue !== displayValue ? (
          <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
            {t("pages.dynamicSettings.effectiveValueLabel")}{" "}
            {displayResolvedValue}
          </p>
        ) : null}
      </div>

      {type === "boolean" ? (
        <CheckboxField
          checked={Boolean(value)}
          disabled={disabled}
          label={
            value
              ? t("pages.dynamicSettings.enabled")
              : t("pages.dynamicSettings.disabled")
          }
          onChange={onChange}
        />
      ) : null}

      {type === "integer" || type === "number" ? (
        <Input
          type="number"
          value={value === null || value === undefined ? "" : String(value)}
          disabled={disabled}
          onChange={(event) => {
            const nextValue = event.target.value.trim();
            onChange(nextValue === "" ? null : Number(nextValue));
          }}
          className="h-10 bg-white shadow-sm dark:bg-gray-950/40"
        />
      ) : null}

      {type === "string" ? (
        <Input
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 bg-white shadow-sm dark:bg-gray-950/40"
        />
      ) : null}

      {type === "array" ? (
        <Textarea
          value={JSON.stringify(value ?? [], null, 2)}
          disabled
          className="min-h-[120px] bg-white font-mono text-xs shadow-sm dark:bg-gray-950/40"
        />
      ) : null}
    </div>
  );
}
