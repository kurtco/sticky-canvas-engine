import type { Position } from "./types";

// e.g. clamp(850, 0, 800) returns 800 — keeps a dragged/resized note inside the board.
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function isPointInRect(point: Position, rect: DOMRect): boolean {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

// e.g. a 500x500 note's corner touching the 100x100 trash zone counts as a drop, even if the cursor doesn't.
export function rectsOverlap(a: DOMRect, b: DOMRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
