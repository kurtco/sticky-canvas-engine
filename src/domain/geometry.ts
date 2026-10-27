import type { Position } from "./types";


// this function is executed in every moment using onPointerMove here src/hooks/useResizeNote.ts
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function isPointInRect(point: Position, rect: DOMRect): boolean {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

// True when the two rects overlap by any amount — used to detect a note
// being dropped on the trash zone by its whole body, not just the cursor.
export function rectsOverlap(a: DOMRect, b: DOMRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
