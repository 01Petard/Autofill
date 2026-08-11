import { describe, expect, it } from "vitest";
import { launcherPixels, launcherPosition } from "../src/content/position";

describe("launcher position", () => {
  it("snaps to the nearest side and stores a viewport-relative vertical ratio", () => {
    expect(launcherPosition(20, 192, 1000, 800)).toEqual({ side: "left", yRatio: 0.25 });
    expect(launcherPosition(900, 552, 1000, 800)).toEqual({ side: "right", yRatio: 0.75 });
  });

  it("converts and clamps persisted positions to safe viewport pixels", () => {
    expect(launcherPixels({ side: "right", yRatio: 2 }, 1000, 800)).toEqual({ left: 936, top: 732 });
    expect(launcherPixels({ side: "left", yRatio: -1 }, 1000, 800)).toEqual({ left: 8, top: 12 });
  });
});
