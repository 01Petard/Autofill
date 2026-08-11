import type { FormField, GeneratedValues } from "../form/types";
import type { PageContext } from "../model/prompt";

export interface FillPageRequest {
  type: "AUTOFILL_FILL_PAGE";
  page: PageContext;
  fields: FormField[];
  locale: string;
}

export type FillPageResponse =
  | { ok: true; values: GeneratedValues; modelName: string }
  | { ok: false; message: string };

export function isFillPageRequest(value: unknown): value is FillPageRequest {
  if (typeof value !== "object" || value === null) return false;
  const request = value as Partial<FillPageRequest>;
  return request.type === "AUTOFILL_FILL_PAGE"
    && typeof request.page === "object"
    && request.page !== null
    && Array.isArray(request.fields)
    && typeof request.locale === "string";
}
