import { describe, expect, it } from "vitest";
import { removeModel, upsertModel } from "../src/settings/model-editor";
import type { ModelConfig } from "../src/shared/types";

const first: ModelConfig = {
  id: "first",
  name: "deepseek-chat",
  endpoint: "https://api.deepseek.com/chat/completions",
  apiKey: "secret",
  protocol: "openai",
  createdAt: 10,
  updatedAt: 10
};

describe("model editor", () => {
  it("updates a config without changing its creation time", () => {
    const result = upsertModel([first], { ...first, name: "new-name", createdAt: 999, updatedAt: 20 });
    expect(result).toEqual([{ ...first, name: "new-name", updatedAt: 20 }]);
  });

  it("appends a new config and removes by id", () => {
    const second = { ...first, id: "second" };
    expect(upsertModel([first], second)).toEqual([first, second]);
    expect(removeModel([first, second], "first")).toEqual([second]);
  });
});
