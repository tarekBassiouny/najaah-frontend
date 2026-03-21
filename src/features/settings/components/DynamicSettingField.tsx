"use client";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  asRecord,
  formatDisplayValue,
  getObjectKeys,
  humanizeKey,
  inferFieldType,
  type DynamicSettingDefinition,
} from "@/features/settings/lib/dynamic-settings";
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
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (_checked: boolean) => void;
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
      <span>{checked ? "Enabled" : "Disabled"}</span>
    </label>
  );
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
  const type = inferFieldType(value, definition);
  const label = humanizeKey(fieldKey);
  const objectKeys = getObjectKeys(value, definition);
  const valueRecord = asRecord(value);
  const resolvedRecord = asRecord(resolvedValue);

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
        formatDisplayValue(resolvedValue) !== formatDisplayValue(value) ? (
          <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
            Effective value: {formatDisplayValue(resolvedValue)}
          </p>
        ) : null}
      </div>

      {type === "boolean" ? (
        <CheckboxField
          checked={Boolean(value)}
          disabled={disabled}
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
