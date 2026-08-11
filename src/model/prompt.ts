import type { FormField } from "../form/types";

export interface PageContext {
  title: string;
  url: string;
}

export interface ModelRequest {
  page: PageContext;
  fields: FormField[];
}

export interface ModelInput {
  page: PageContext;
  fields: FormField[];
}

export const SYSTEM_PROMPT = [
  "You are a professional web form testing assistant.",
  "Generate reasonable synthetic test data for fields that are safe to fill.",
  "Return one valid JSON object only. Each key must be a provided field id.",
  "Return strings for text, textarea, contenteditable, and single select fields.",
  "Return booleans for checkboxes, an option value string for radio fields, and string arrays for multi-select fields.",
  "Return an empty string when a field is unclear or should not be filled.",
  "Never generate real passwords, payment details, identity numbers, authentication codes, or other high-risk personal data."
].join("\n");

function sanitizedPageUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
}

export function buildModelInput(request: ModelRequest): ModelInput {
  return {
    page: {
      title: request.page.title,
      url: sanitizedPageUrl(request.page.url)
    },
    fields: request.fields.map((field) => ({ ...field }))
  };
}

export function buildUserPrompt(request: ModelRequest): string {
  return JSON.stringify(buildModelInput(request));
}
