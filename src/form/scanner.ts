import type { FieldKind, FieldOption, FormField } from "./types";

export const FIELD_ID_ATTRIBUTE = "data-smart-form-fill-id";

type FillableElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement;
type VisibilityPredicate = (element: Element) => boolean;

const FIELD_SELECTOR = [
  "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']):not([type='file']):not([type='password'])",
  "textarea",
  "select",
  "[contenteditable]:not([contenteditable='false'])"
].join(",");

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function defaultIsVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  const bounds = element.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && bounds.width > 0 && bounds.height > 0;
}

function isTabLike(element: Element): boolean {
  if (element.hasAttribute("data-smart-form-fill-ignore")) return true;
  const role = element.getAttribute("role");
  if (["tab", "tablist", "switch"].includes(role ?? "") || element.hasAttribute("aria-pressed")) {
    return true;
  }

  let current: Element | null = element;
  for (let depth = 0; current && depth < 6; depth += 1, current = current.parentElement) {
    if (current.getAttribute("role") === "tablist" || current.hasAttribute("data-tabs")) return true;
    const signature = `${current.id} ${String(current.className)} ${current.getAttribute("data-testid") ?? ""}`;
    if (/(^|[-_\s])(tab|tabs|toggle|switch|segment|segmented|radio-button)([-_\s]|$)/i.test(signature)) {
      return true;
    }
  }
  return false;
}

function isEditable(element: FillableElement): boolean {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return !element.disabled && !element.readOnly;
  }
  if (element instanceof HTMLSelectElement) return !element.disabled;
  return true;
}

function resolveLabel(element: FillableElement, root: ParentNode): string {
  if (element.id) {
    const label = Array.from(root.querySelectorAll("label[for]"))
      .find((candidate) => candidate.getAttribute("for") === element.id);
    if (label) return normalizeText(label.textContent);
  }
  const wrappingLabel = element.closest("label");
  if (wrappingLabel) return normalizeText(wrappingLabel.textContent);
  return normalizeText(element.getAttribute("aria-label"))
    || normalizeText(element.getAttribute("data-label"))
    || ("name" in element ? normalizeText(element.name) : "")
    || ("placeholder" in element ? normalizeText(element.placeholder) : "")
    || "Unnamed field";
}

function fieldKind(element: FillableElement): FieldKind {
  if (element instanceof HTMLSelectElement) return "select";
  if (element instanceof HTMLTextAreaElement) return "textarea";
  if (element instanceof HTMLInputElement && element.type === "checkbox") return "checkbox";
  if (element instanceof HTMLInputElement && element.type === "radio") return "radio";
  if (!(element instanceof HTMLInputElement) && element.hasAttribute("contenteditable")) {
    return "contenteditable";
  }
  return "text";
}

function selectOptions(element: FillableElement): FieldOption[] {
  if (!(element instanceof HTMLSelectElement)) return [];
  return Array.from(element.options).map((option) => ({
    value: option.value,
    label: normalizeText(option.textContent)
  }));
}

export function scanFormFields(
  root: ParentNode = document,
  isVisible: VisibilityPredicate = defaultIsVisible
): FormField[] {
  return Array.from(root.querySelectorAll(FIELD_SELECTOR))
    .filter((element): element is FillableElement => {
      return element instanceof HTMLElement
        && isEditable(element)
        && !isTabLike(element)
        && isVisible(element);
    })
    .map((element, index) => {
      const id = `field-${index + 1}`;
      element.setAttribute(FIELD_ID_ATTRIBUTE, id);
      const kind = fieldKind(element);
      return {
        id,
        kind,
        type: element instanceof HTMLInputElement ? element.type : kind,
        label: resolveLabel(element, root),
        name: "name" in element ? element.name : "",
        placeholder: "placeholder" in element ? element.placeholder : "",
        required: element.hasAttribute("required"),
        options: selectOptions(element)
      };
    });
}
