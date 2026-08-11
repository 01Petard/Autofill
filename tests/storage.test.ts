import { describe, expect, it } from "vitest";
import { StorageRepository } from "../src/shared/storage";

class MemoryStorage {
  private readonly values: Record<string, unknown> = {};

  async get(keys?: string | string[] | Record<string, unknown> | null) {
    if (typeof keys === "string") return { [keys]: this.values[keys] };
    const selected = Array.isArray(keys) ? keys : Object.keys(this.values);
    return Object.fromEntries(selected.map((key) => [key, this.values[key]]));
  }

  async set(items: Record<string, unknown>) {
    Object.assign(this.values, items);
  }

  async remove(keys: string | string[]) {
    for (const key of typeof keys === "string" ? [keys] : keys) delete this.values[key];
  }
}

describe("storage repository", () => {
  it("persists enabled origins without duplicates", async () => {
    const repository = new StorageRepository(new MemoryStorage());

    await repository.setOriginEnabled("https://example.com", true);
    await repository.setOriginEnabled("https://example.com", true);
    await repository.setOriginEnabled("https://other.example", true);

    expect(await repository.getEnabledOrigins()).toEqual([
      "https://example.com",
      "https://other.example"
    ]);

    await repository.setOriginEnabled("https://example.com", false);
    expect(await repository.isOriginEnabled("https://example.com")).toBe(false);
  });
});
