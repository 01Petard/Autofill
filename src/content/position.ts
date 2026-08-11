import type { LauncherPosition } from "../shared/types";

const SIZE = 56;
const SIDE_GAP = 8;
const TOP_GAP = 12;

function verticalRange(viewportHeight: number): number {
  return Math.max(1, viewportHeight - SIZE - TOP_GAP * 2);
}

export function launcherPosition(
  left: number,
  top: number,
  viewportWidth: number,
  viewportHeight: number
): LauncherPosition {
  const range = verticalRange(viewportHeight);
  return {
    side: left + SIZE / 2 < viewportWidth / 2 ? "left" : "right",
    yRatio: Math.min(Math.max((top - TOP_GAP) / range, 0), 1)
  };
}

export function launcherPixels(
  position: LauncherPosition,
  viewportWidth: number,
  viewportHeight: number
): { left: number; top: number } {
  const ratio = Math.min(Math.max(position.yRatio, 0), 1);
  return {
    left: position.side === "left" ? SIDE_GAP : Math.max(SIDE_GAP, viewportWidth - SIZE - SIDE_GAP),
    top: TOP_GAP + ratio * verticalRange(viewportHeight)
  };
}
