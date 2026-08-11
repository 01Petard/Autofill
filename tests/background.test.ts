import { describe, expect, it, vi } from "vitest";
import { FillOrchestrator } from "../src/background/orchestrator";
import type { FormField } from "../src/form/types";
import type { ModelConfig } from "../src/shared/types";

const field: FormField = {
  id: "field-1",
  kind: "text",
  type: "text",
  label: "Name",
  name: "name",
  placeholder: "",
  required: true,
  options: []
};

const model: ModelConfig = {
  id: "model",
  name: "test-model",
  endpoint: "https://api.example.com/chat/completions",
  apiKey: "secret",
  protocol: "openai",
  createdAt: 1,
  updatedAt: 1
};

describe("background fill orchestration", () => {
  it("calls the active model and returns only validated field values", async () => {
    const call = vi.fn().mockResolvedValue('{"field-1":"Alice","unknown":"bad"}');
    const orchestrator = new FillOrchestrator(
      { getActiveConfig: vi.fn().mockResolvedValue(model) },
      call,
      () => 10_000
    );

    const response = await orchestrator.fill({
      type: "AUTOFILL_FILL_PAGE",
      page: { title: "Form", url: "https://site.test/form?private=1" },
      fields: [field],
      locale: "en"
    }, 9);

    expect(response).toEqual({ ok: true, values: { "field-1": "Alice" }, modelName: "test-model" });
    expect(call).toHaveBeenCalledOnce();
  });

  it("rejects repeated requests from the same tab within three seconds", async () => {
    let now = 10_000;
    const orchestrator = new FillOrchestrator(
      { getActiveConfig: vi.fn().mockResolvedValue(model) },
      vi.fn().mockResolvedValue('{"field-1":"Alice"}'),
      () => now
    );
    const request = {
      type: "AUTOFILL_FILL_PAGE" as const,
      page: { title: "Form", url: "https://site.test/form" },
      fields: [field],
      locale: "zh-CN"
    };

    expect((await orchestrator.fill(request, 3)).ok).toBe(true);
    now += 2_999;
    expect(await orchestrator.fill(request, 3)).toEqual({ ok: false, message: "操作过于频繁，请稍后再试" });
  });

  it("reports empty pages and missing model configuration", async () => {
    const repository = { getActiveConfig: vi.fn().mockResolvedValue(null) };
    const orchestrator = new FillOrchestrator(repository, vi.fn(), () => 1);

    expect(await orchestrator.fill({
      type: "AUTOFILL_FILL_PAGE",
      page: { title: "", url: "https://site.test" },
      fields: [],
      locale: "en"
    }, 1)).toEqual({ ok: false, message: "No fillable form fields were found on this page" });

    expect(await orchestrator.fill({
      type: "AUTOFILL_FILL_PAGE",
      page: { title: "", url: "https://site.test" },
      fields: [field],
      locale: "en"
    }, 2)).toEqual({ ok: false, message: "Add a model configuration in extension settings first" });
  });
});
