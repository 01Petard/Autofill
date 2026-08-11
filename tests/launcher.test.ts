// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountLauncher } from "../src/content/launcher";

describe("page launcher", () => {
  beforeEach(() => {
    document.body.innerHTML = `<form><input aria-label="Name" /></form>`;
  });

  it("mounts once, performs a fill callback without submitting, and tears down", async () => {
    const submit = vi.fn();
    document.querySelector("form")?.addEventListener("submit", submit);
    const fill = vi.fn().mockResolvedValue({ ok: true, values: { "field-1": "Alice" }, modelName: "test" });
    const scan = vi.fn().mockReturnValue([{ id: "field-1" }]);
    const apply = vi.fn().mockReturnValue(1);

    const launcher = mountLauncher({ document, locale: "en", fill, scan, apply, shadowMode: "open" });
    const duplicate = mountLauncher({ document, locale: "en", fill, scan, apply, shadowMode: "open" });
    const host = document.querySelector("#smart-form-fill-root") as HTMLElement;
    (host.shadowRoot?.querySelector("button") as HTMLButtonElement).click();
    await vi.waitFor(() => expect(fill).toHaveBeenCalledOnce());

    expect(document.querySelectorAll("#smart-form-fill-root")).toHaveLength(1);
    expect(apply).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();

    duplicate.destroy();
    launcher.destroy();
    expect(document.querySelector("#smart-form-fill-root")).toBeNull();
  });
});
