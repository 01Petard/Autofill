import type { FormField, GeneratedValue, GeneratedValues } from "../form/types";

function parseJsonObject(text: string): Record<string, unknown> {
  const normalized = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    const value = JSON.parse(normalized) as unknown;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  } catch {
    const start = normalized.indexOf("{");
    const end = normalized.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        const value = JSON.parse(normalized.slice(start, end + 1)) as unknown;
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          return value as Record<string, unknown>;
        }
      } catch {
        // Fall through to the stable public error below
      }
    }
  }
  throw new Error("Model did not return valid JSON");
}

function compatibleValue(field: FormField, value: unknown): GeneratedValue | null {
  if (field.kind === "checkbox") return typeof value === "boolean" ? value : null;
  if (field.kind === "radio") return typeof value === "string" ? value : null;
  if (field.kind === "select" && Array.isArray(value)) {
    return value.every((item) => typeof item === "string") ? value : null;
  }
  return typeof value === "string" ? value : null;
}

export function parseGeneratedValues(text: string, fields: FormField[]): GeneratedValues {
  const parsed = parseJsonObject(text);
  const fieldMap = new Map(fields.map((field) => [field.id, field]));
  const result: GeneratedValues = {};

  for (const [id, value] of Object.entries(parsed)) {
    const field = fieldMap.get(id);
    if (!field) continue;
    const compatible = compatibleValue(field, value);
    if (compatible !== null) result[id] = compatible;
  }
  return result;
}
