import { access, readFile, readdir } from "node:fs/promises";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const iconSizes = [16, 32, 48, 128] as const;

describe("store release assets", () => {
  it("declares and provides correctly sized PNG icons", async () => {
    const manifest = JSON.parse(await readFile("public/manifest.json", "utf8")) as {
      icons: Record<string, string>;
      action: { default_icon: Record<string, string> };
    };

    for (const size of iconSizes) {
      const expected = `icons/icon-${size}.png`;
      expect(manifest.icons[String(size)]).toBe(expected);
      expect(manifest.action.default_icon[String(size)]).toBe(expected);
      const metadata = await sharp(`public/${expected}`).metadata();
      expect({ width: metadata.width, height: metadata.height, format: metadata.format }).toEqual({
        width: size,
        height: size,
        format: "png"
      });
    }
  });

  it("includes truthful bilingual store and privacy documentation", async () => {
    const files = [
      "README.md",
      "PRIVACY.md",
      "docs/store-listing.zh-CN.md",
      "docs/store-listing.en.md"
    ];
    await Promise.all(files.map((file) => access(file)));

    const privacy = await readFile("PRIVACY.md", "utf8");
    expect(privacy).toContain("chrome.storage.local");
    expect(privacy).toContain("does not submit forms");
    expect(privacy).toContain("不会自动提交表单");
  });

  it("keeps prohibited artifacts out of the built extension", async () => {
    const paths: string[] = [];
    async function walk(directory: string): Promise<void> {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = `${directory}/${entry.name}`;
        if (entry.isDirectory()) await walk(path);
        else paths.push(path);
      }
    }
    await walk("dist");

    expect(paths.some((path) => path.endsWith(".DS_Store"))).toBe(false);
    expect(paths.some((path) => path.endsWith(".map"))).toBe(false);
    expect(paths.some((path) => /(^|\/)\.env($|\.)/.test(path))).toBe(false);
  });

  it("does not emit module preload links that Edge treats as cross-world errors", async () => {
    const [popup, settings] = await Promise.all([
      readFile("dist/popup/index.html", "utf8"),
      readFile("dist/settings/index.html", "utf8")
    ]);

    expect(popup).not.toContain("modulepreload");
    expect(settings).not.toContain("modulepreload");
  });
});
