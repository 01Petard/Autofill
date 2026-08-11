import { FIELD_ID_ATTRIBUTE } from "./scanner";
import type { FormField, GeneratedValues } from "./types";

type FillableElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement;

function dispatchValueEvents(element: Element): void {
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const prototype = element instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  setter?.call(element, value);
  dispatchValueEvents(element);
}

function matchesOption(option: HTMLOptionElement, value: unknown): boolean {
  const expected = String(value ?? "").trim().toLowerCase();
  return option.value.trim().toLowerCase() === expected
    || (option.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase() === expected;
}

function applySelect(element: HTMLSelectElement, value: unknown): boolean {
  const requested = Array.isArray(value) ? value : [value];
  const matching = Array.from(element.options).filter((option) =>
    requested.some((item) => matchesOption(option, item))
  );
  if (matching.length === 0) return false;
  const allowed = element.multiple ? matching : matching.slice(0, 1);
  for (const option of Array.from(element.options)) option.selected = allowed.includes(option);
  dispatchValueEvents(element);
  return true;
}

function applyRadio(element: HTMLInputElement, value: unknown): boolean {
  if (typeof value !== "string" || value.trim() === "") return false;
  const label = element.closest("label")?.textContent ?? "";
  const expected = value.trim().toLowerCase();
  if (element.value.trim().toLowerCase() !== expected && label.replace(/\s+/g, " ").trim().toLowerCase() !== expected) {
    return false;
  }
  element.checked = true;
  dispatchValueEvents(element);
  return true;
}

function applyValue(element: FillableElement, field: FormField, value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (field.kind === "select" && element instanceof HTMLSelectElement) {
    return applySelect(element, value);
  }
  if (field.kind === "checkbox" && element instanceof HTMLInputElement) {
    if (typeof value !== "boolean") return false;
    element.checked = value;
    dispatchValueEvents(element);
    return true;
  }
  if (field.kind === "radio" && element instanceof HTMLInputElement) {
    return applyRadio(element, value);
  }
  if (field.kind === "contenteditable") {
    if (typeof value !== "string") return false;
    element.textContent = value;
    element.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: value
    }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  if (
    (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)
    && typeof value === "string"
  ) {
    setNativeValue(element, value);
    return true;
  }
  return false;
}

export function applyGeneratedValues(
  values: GeneratedValues,
  fields: FormField[],
  root: ParentNode = document
): number {
  const fieldMap = new Map(fields.map((field) => [field.id, field]));
  let applied = 0;

  for (const [id, value] of Object.entries(values)) {
    const field = fieldMap.get(id);
    if (!field) continue;
    const element = root.querySelector(`[${FIELD_ID_ATTRIBUTE}="${id}"]`);
    if (element instanceof HTMLElement && applyValue(element, field, value)) applied += 1;
  }
  return applied;
}
