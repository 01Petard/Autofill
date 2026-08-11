import { describe, expect, it, vi } from "vitest";
import { callModel } from "../src/model/client";
import { buildModelInput } from "../src/model/prompt";
import { parseGeneratedValues } from "../src/model/response";
import type { FormField } from "../src/form/types";
import type { ModelConfig } from "../src/shared/types";

const fields: FormField[] = [
  {
    id: "field-1",
    kind: "text",
    type: "text",
    label: "Name",
    name: "name",
    placeholder: "",
    required: true,
    options: []
  },
  {
    id: "field-2",
    kind: "checkbox",
    type: "checkbox",
    label: "Enabled",
    name: "enabled",
    placeholder: "",
    required: false,
    options: []
  },
  {
    id: "field-3",
    kind: "radio",
    type: "radio",
    label: "Status",
    name: "status",
    placeholder: "",
    required: false,
    options: []
  }
];

function config(protocol: ModelConfig["protocol"]): ModelConfig {
  return {
    id: "model",
    name: "test-model",
    endpoint: protocol === "openai"
      ? "https://api.example.com/v1/chat/completions"
      : "https://anthropic.example.com/v1",
    apiKey: "secret",
    protocol,
    createdAt: 1,
    updatedAt: 1
  };
}

describe("model prompt", () => {
  it("removes credentials, query, and fragment from page context", () => {
    const input = buildModelInput({
      page: {
        title: "Registration",
        url: "https://user:pass@example.com/form?token=secret#private"
      },
      fields
    });

    expect(input.page.url).toBe("https://example.com/form");
    expect(JSON.stringify(input)).not.toContain("secret");
    expect(JSON.stringify(input)).not.toContain("pass");
  });
});

describe("model client", () => {
  it("uses OpenAI JSON mode and retries a 400 response without response_format", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "unsupported" } }), { status: 400 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{ message: { content: '{"field-1":"Alice"}' } }]
      }), { status: 200 }));

    const result = await callModel(config("openai"), { page: { title: "Form", url: "https://site.test/form" }, fields }, fetcher);

    expect(result).toBe('{"field-1":"Alice"}');
    expect(fetcher).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
    const secondBody = JSON.parse(String(fetcher.mock.calls[1]?.[1]?.body));
    expect(firstBody.response_format).toEqual({ type: "json_object" });
    expect(secondBody.response_format).toBeUndefined();
    expect(fetcher.mock.calls[0]?.[1]?.headers).toMatchObject({ Authorization: "Bearer secret" });
  });

  it("uses Anthropic Messages with the configured protocol", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      content: [{ type: "text", text: '{"field-1":"Alice"}' }]
    }), { status: 200 }));

    const result = await callModel(config("anthropic"), { page: { title: "Form", url: "https://site.test/form" }, fields }, fetcher);

    expect(result).toBe('{"field-1":"Alice"}');
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://anthropic.example.com/v1/messages");
    const options = fetcher.mock.calls[0]?.[1];
    expect(options?.headers).toMatchObject({ "x-api-key": "secret", "anthropic-version": "2023-06-01" });
    expect(JSON.parse(String(options?.body))).toMatchObject({ model: "test-model", max_tokens: 4096 });
  });

  it("surfaces API error messages without leaking response bodies", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { message: "Invalid API key" },
      debug: "sensitive body"
    }), { status: 401 }));

    await expect(callModel(config("anthropic"), { page: { title: "Form", url: "https://site.test/form" }, fields }, fetcher))
      .rejects.toThrow("Invalid API key");
  });
});

describe("model response", () => {
  it("accepts fenced JSON and keeps only field-compatible values", () => {
    const result = parseGeneratedValues(`\`\`\`json
      {"field-1":"Alice","field-2":true,"field-3":"enabled","unknown":"remove"}
    \`\`\``, fields);

    expect(result).toEqual({
      "field-1": "Alice",
      "field-2": true,
      "field-3": "enabled"
    });
  });

  it("rejects malformed JSON and drops incompatible radio booleans", () => {
    expect(() => parseGeneratedValues("not json", fields)).toThrow("valid JSON");
    expect(parseGeneratedValues('{"field-3":true}', fields)).toEqual({});
  });
});
