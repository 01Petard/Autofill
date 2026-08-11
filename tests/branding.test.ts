import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("application branding", () => {
  it("uses the generated icon as the popup and settings favicon", async () => {
    const [popup, settings] = await Promise.all([
      readFile("popup/index.html", "utf8"),
      readFile("settings/index.html", "utf8")
    ]);

    expect(popup).toContain('<link rel="icon" href="/icons/icon-32.png" />');
    expect(settings).toContain('<link rel="icon" href="/icons/icon-32.png" />');
  });

  it("renders the canonical icon in every product surface", async () => {
    const [popup, settings, launcher] = await Promise.all([
      readFile("src/popup/index.ts", "utf8"),
      readFile("src/settings/index.ts", "utf8"),
      readFile("src/content/launcher.ts", "utf8")
    ]);

    expect(popup).toContain('app-icon-ui.png?inline');
    expect(popup).toContain('class="brand-icon"');
    expect(settings).toContain('app-icon-ui.png?inline');
    expect(settings).toContain('class="page-brand-icon"');
    expect(launcher).toContain('app-icon-ui.png?inline');
    expect(launcher).toContain('class="launcher-icon"');
    expect(popup).not.toContain('class="brand-mark"');
    expect(launcher).not.toContain(">填</button>");
  });
});
