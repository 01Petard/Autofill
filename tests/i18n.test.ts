import { describe, expect, it } from "vitest";
import { localeFromLanguage, uiText } from "../src/shared/i18n";

describe("UI localization", () => {
  it("uses Simplified Chinese for Chinese browser locales", () => {
    expect(localeFromLanguage("zh-CN")).toBe("zh");
    expect(uiText("zh").settingsTitle).toBe("模型设置");
  });

  it("falls back to English for other locales", () => {
    expect(localeFromLanguage("fr-FR")).toBe("en");
    expect(uiText("en").settingsTitle).toBe("Model settings");
  });
});
