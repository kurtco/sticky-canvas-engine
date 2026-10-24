import type { Position } from "./types";


// this function is executed in every moment using onPointerMove here src/hooks/useResizeNote.ts
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function isPointInRect(point: Position, rect: DOMRect): boolean {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}
