import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("extension manifest", () => {
  it("declares a localized MV3 extension with scoped runtime permissions", async () => {
    const source = await readFile("public/manifest.json", "utf8");
    const manifest = JSON.parse(source) as {
      manifest_version: number;
      name: string;
      description: string;
      default_locale: string;
      permissions: string[];
      optional_host_permissions: string[];
      background: { service_worker: string; type: string };
      action: { default_popup: string };
      options_page: string;
    };

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe("__MSG_appName__");
    expect(manifest.description).toBe("__MSG_appDescription__");
    expect(manifest.default_locale).toBe("en");
    expect(manifest.permissions).toEqual(["storage", "scripting", "activeTab"]);
    expect(manifest.optional_host_permissions).toContain("https://*/*");
    expect(manifest.optional_host_permissions).toContain("http://*/*");
    expect(manifest.background).toEqual({ service_worker: "background.js", type: "module" });
    expect(manifest.action.default_popup).toBe("popup/index.html");
    expect(manifest.options_page).toBe("settings/index.html");
  });

  it("defines English and Simplified Chinese product names", async () => {
    const [english, chinese] = await Promise.all([
      readFile("public/_locales/en/messages.json", "utf8"),
      readFile("public/_locales/zh_CN/messages.json", "utf8")
    ]);

    expect(JSON.parse(english).appName.message).toBe("Autofill");
    expect(JSON.parse(chinese).appName.message).toBe("智填");
  });
});
