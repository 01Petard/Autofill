// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyGeneratedValues } from "../src/form/executor";
import { scanFormFields } from "../src/form/scanner";

describe("form executor", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("writes text, textarea, checkbox, and select values with browser events", () => {
    document.body.innerHTML = `
      <input aria-label="Name" />
      <textarea aria-label="Summary"></textarea>
      <input type="checkbox" aria-label="Enabled" />
      <select aria-label="Department"><option value="rd">Research</option></select>
    `;
    const input = document.querySelector("input")!;
    const onInput = vi.fn();
    const onChange = vi.fn();
    input.addEventListener("input", onInput);
    input.addEventListener("change", onChange);
    const fields = scanFormFields(document, () => true);

    const count = applyGeneratedValues(
      {
        "field-1": "张三",
        "field-2": "项目说明",
        "field-3": true,
        "field-4": "Research"
      },
      fields,
      document
    );

    expect(count).toBe(4);
    expect((document.querySelector("input") as HTMLInputElement).value).toBe("张三");
    expect(document.querySelector("textarea")?.value).toBe("项目说明");
    expect((document.querySelectorAll("input")[1] as HTMLInputElement).checked).toBe(true);
    expect(document.querySelector("select")?.value).toBe("rd");
    expect(onInput).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("matches multi-select values by option value or label", () => {
    document.body.innerHTML = `
      <select multiple aria-label="Skills">
        <option value="java">Java</option>
        <option value="ts">TypeScript</option>
      </select>
    `;
    const fields = scanFormFields(document, () => true);

    expect(applyGeneratedValues({ "field-1": ["java", "TypeScript"] }, fields, document)).toBe(1);
    expect(Array.from(document.querySelector("select")!.selectedOptions).map((item) => item.value)).toEqual([
      "java",
      "ts"
    ]);
  });

  it("selects exactly one radio by option value and ignores boolean group values", () => {
    document.body.innerHTML = `
      <label><input type="radio" name="status" value="enabled" /> Enabled</label>
      <label><input type="radio" name="status" value="disabled" /> Disabled</label>
    `;
    const fields = scanFormFields(document, () => true);

    expect(applyGeneratedValues({ "field-1": true, "field-2": true }, fields, document)).toBe(0);
    expect(Array.from(document.querySelectorAll("input")).some((item) => item.checked)).toBe(false);

    expect(applyGeneratedValues({ "field-2": "disabled" }, fields, document)).toBe(1);
    expect((document.querySelectorAll("input")[0] as HTMLInputElement).checked).toBe(false);
    expect((document.querySelectorAll("input")[1] as HTMLInputElement).checked).toBe(true);
  });

  it("ignores unknown fields and empty generated values", () => {
    document.body.innerHTML = `<input aria-label="Name" value="keep" />`;
    const fields = scanFormFields(document, () => true);

    expect(applyGeneratedValues({ unknown: "bad", "field-1": "" }, fields, document)).toBe(0);
    expect(document.querySelector("input")?.value).toBe("keep");
  });
});
