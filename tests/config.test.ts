import { describe, expect, it } from "vitest";
import {
  createDefaultConfig,
  migrateModelConfigs,
  resolveActiveConfig
} from "../src/shared/model-config";

describe("model configuration", () => {
  it("migrates legacy Agnes configs to the Anthropic protocol", () => {
    const configs = migrateModelConfigs([
      {
        id: "agnes",
        name: "claude-sonnet",
        endpoint: "https://apihub.agnes-ai.com/v1",
        apiKey: "secret",
        createdAt: 1,
        updatedAt: 2
      }
    ]);

    expect(configs).toEqual([
      expect.objectContaining({ id: "agnes", protocol: "anthropic" })
    ]);
  });

  it("defaults other legacy endpoints to the OpenAI protocol", () => {
    const [config] = migrateModelConfigs([
      {
        id: "custom",
        name: "custom-model",
        endpoint: "https://models.example.com/v1/chat/completions",
        apiKey: "secret",
        createdAt: 1,
        updatedAt: 2
      }
    ]);

    expect(config?.protocol).toBe("openai");
  });

  it("drops malformed config values instead of exposing partial secrets", () => {
    expect(migrateModelConfigs([null, { apiKey: "secret" }, "bad"])).toEqual([]);
  });

  it("falls back to the first model when the stored active id is missing", () => {
    const first = createDefaultConfig(() => "first", 10);
    const second = { ...first, id: "second" };

    expect(resolveActiveConfig([first, second], "missing")?.id).toBe("first");
    expect(resolveActiveConfig([], "missing")).toBeNull();
  });
});
