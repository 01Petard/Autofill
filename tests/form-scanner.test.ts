// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { scanFormFields } from "../src/form/scanner";

describe("form scanner", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("collects semantic metadata without exposing current field values", () => {
    document.body.innerHTML = `
      <label for="name">Contact name</label>
      <input id="name" name="contact" value="Alice Secret" required />
      <select id="department" aria-label="Department">
        <option value="engineering" selected>Engineering</option>
      </select>
    `;

    const fields = scanFormFields(document, () => true);

    expect(fields).toEqual([
      expect.objectContaining({
        id: "field-1",
        kind: "text",
        label: "Contact name",
        name: "contact",
        required: true
      }),
      expect.objectContaining({
        id: "field-2",
        kind: "select",
        label: "Department",
        options: [{ value: "engineering", label: "Engineering" }]
      })
    ]);
    expect(JSON.stringify(fields)).not.toContain("Alice Secret");
    expect(JSON.stringify(fields)).not.toContain("selected");
  });

  it("excludes sensitive, non-editable, hidden, and tab-like controls", () => {
    document.body.innerHTML = `
      <input type="password" aria-label="Password" />
      <input type="file" aria-label="Identity scan" />
      <input type="hidden" value="token" />
      <input disabled aria-label="Disabled" />
      <input readonly aria-label="Readonly" />
      <input role="switch" aria-label="UI switch" />
      <input data-smart-form-fill-ignore aria-label="Ignored" />
      <input aria-label="Invisible" class="invisible" />
      <textarea aria-label="Description"></textarea>
    `;

    const fields = scanFormFields(
      document,
      (element) => !element.classList.contains("invisible")
    );

    expect(fields.map((field) => field.label)).toEqual(["Description"]);
  });
});
