import { describe, expect, it } from "vitest";
import { clamp, isPointInRect, rectsOverlap } from "./geometry";

describe("clamp", () => {
  it("returns the value unchanged when inside the range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min/max when outside the range", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("isPointInRect", () => {
  const rect = new DOMRect(100, 100, 50, 50); // left 100, top 100, right 150, bottom 150

  it("is true for a point inside the rect", () => {
    expect(isPointInRect({ x: 120, y: 120 }, rect)).toBe(true);
  });

  it("is false for a point outside the rect", () => {
    expect(isPointInRect({ x: 10, y: 10 }, rect)).toBe(false);
  });
});

describe("rectsOverlap", () => {
  it("is true when a large rect's body covers a small rect, even without touching its exact center", () => {
    const bigNote = new DOMRect(0, 0, 500, 500); // the dragged note's current body
    const trash = new DOMRect(400, 400, 100, 100); // only the corner overlaps
    expect(rectsOverlap(bigNote, trash)).toBe(true);
  });

  it("is false when the rects don't touch at all", () => {
    const noteA = new DOMRect(0, 0, 50, 50);
    const trash = new DOMRect(200, 200, 100, 100);
    expect(rectsOverlap(noteA, trash)).toBe(false);
  });

  it("is false when rects only touch at the edge (no actual overlap)", () => {
    const noteA = new DOMRect(0, 0, 50, 50);
    const trash = new DOMRect(50, 0, 50, 50); // shares the x=50 edge only
    expect(rectsOverlap(noteA, trash)).toBe(false);
  });
});
