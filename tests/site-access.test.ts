import { describe, expect, it, vi } from "vitest";
import { disableSite, enableSite, siteScriptId } from "../src/popup/site-access";

function dependencies(granted: boolean) {
  return {
    repository: {
      setOriginEnabled: vi.fn().mockResolvedValue(undefined)
    },
    browser: {
      requestOrigin: vi.fn().mockResolvedValue(granted),
      register: vi.fn().mockResolvedValue(undefined),
      inject: vi.fn().mockResolvedValue(undefined),
      unregister: vi.fn().mockResolvedValue(undefined)
    }
  };
}

describe("per-site access", () => {
  it("does not register or persist a site when permission is denied", async () => {
    const { repository, browser } = dependencies(false);

    expect(await enableSite("https://example.com", 7, repository, browser)).toBe("denied");
    expect(browser.register).not.toHaveBeenCalled();
    expect(browser.inject).not.toHaveBeenCalled();
    expect(repository.setOriginEnabled).not.toHaveBeenCalled();
  });

  it("registers and immediately injects only the approved origin", async () => {
    const { repository, browser } = dependencies(true);

    expect(await enableSite("https://example.com", 7, repository, browser)).toBe("enabled");
    expect(browser.requestOrigin).toHaveBeenCalledWith("https://example.com/*");
    expect(browser.register).toHaveBeenCalledWith(siteScriptId("https://example.com"), "https://example.com/*");
    expect(browser.inject).toHaveBeenCalledWith(7);
    expect(repository.setOriginEnabled).toHaveBeenCalledWith("https://example.com", true);
  });

  it("rolls back persisted state and registration when immediate injection fails", async () => {
    const { repository, browser } = dependencies(true);
    browser.inject.mockRejectedValueOnce(new Error("blocked page"));

    await expect(enableSite("https://example.com", 7, repository, browser)).rejects.toThrow("blocked page");
    expect(browser.unregister).toHaveBeenCalledWith(siteScriptId("https://example.com"));
    expect(repository.setOriginEnabled).toHaveBeenLastCalledWith("https://example.com", false);
  });

  it("unregisters and removes persisted enablement when disabled", async () => {
    const { repository, browser } = dependencies(true);

    await disableSite("https://example.com", repository, browser);

    expect(browser.unregister).toHaveBeenCalledWith(siteScriptId("https://example.com"));
    expect(repository.setOriginEnabled).toHaveBeenCalledWith("https://example.com", false);
  });

  it("persists disabled state even if browser script cleanup fails", async () => {
    const { repository, browser } = dependencies(true);
    browser.unregister.mockRejectedValueOnce(new Error("cleanup failed"));

    await expect(disableSite("https://example.com", repository, browser)).rejects.toThrow("cleanup failed");
    expect(repository.setOriginEnabled).toHaveBeenCalledWith("https://example.com", false);
  });

  it("creates stable, registration-safe ids per origin", () => {
    expect(siteScriptId("https://example.com")).toBe(siteScriptId("https://example.com"));
    expect(siteScriptId("https://other.example")).not.toBe(siteScriptId("https://example.com"));
    expect(siteScriptId("https://example.com")).toMatch(/^autofill-site-[a-z0-9]+$/);
  });
});
