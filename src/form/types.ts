export type FieldKind =
  | "text"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "contenteditable";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FormField {
  id: string;
  kind: FieldKind;
  type: string;
  label: string;
  name: string;
  placeholder: string;
  required: boolean;
  options: FieldOption[];
}

export type GeneratedValue = string | boolean | string[];
export type GeneratedValues = Record<string, unknown>;
