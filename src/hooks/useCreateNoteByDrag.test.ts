import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useCreateNoteByDrag } from "./useCreateNoteByDrag";
import { useNoteStore } from "../store/useNoteStore";
import { MIN_NOTE_SIZE } from "../domain/types";

function stubRect(el: HTMLElement, rect: { left: number; top: number; width: number; height: number }) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    x: rect.left,
    y: rect.top,
    left: rect.left,
    top: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    width: rect.width,
    height: rect.height,
    toJSON: () => rect,
  } as DOMRect);
}

function fakePointerEvent(
  clientX: number,
  clientY: number,
  target: EventTarget,
  currentTarget: EventTarget,
) {
  return {
    pointerId: 1,
    clientX,
    clientY,
    target,
    currentTarget: Object.assign(currentTarget, {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    }),
  } as unknown as ReactPointerEvent;
}

beforeEach(() => {
  localStorage.clear();
  useNoteStore.setState({ notes: {}, order: [], nextZIndex: 1, pendingDeletes: {} });
});

describe("useCreateNoteByDrag", () => {
  it("creates a note sized to the dragged rectangle on pointerup", () => {
    const boardEl = document.createElement("div");
    stubRect(boardEl, { left: 0, top: 0, width: 1000, height: 800 });

    const { result } = renderHook(() => useCreateNoteByDrag({ boardRef: { current: boardEl } }));
    const ghostEl = document.createElement("div");
    result.current.ghostRef.current = ghostEl;

    act(() => result.current.onPointerDown(fakePointerEvent(100, 100, boardEl, boardEl)));
    act(() => result.current.onPointerMove(fakePointerEvent(300, 250, boardEl, boardEl)));

    expect(ghostEl.style.width).toBe("200px");
    expect(ghostEl.style.height).toBe("150px");

    act(() => result.current.onPointerUp(fakePointerEvent(300, 250, boardEl, boardEl)));

    const notes = Object.values(useNoteStore.getState().notes);
    expect(notes).toHaveLength(1);
    expect(notes[0]?.position).toEqual({ x: 100, y: 100 });
    expect(notes[0]?.size).toEqual({ width: 200, height: 150 });
  });

  it("ignores a drag shorter than the minimum distance (a stray click)", () => {
    const boardEl = document.createElement("div");
    stubRect(boardEl, { left: 0, top: 0, width: 1000, height: 800 });

    const { result } = renderHook(() => useCreateNoteByDrag({ boardRef: { current: boardEl } }));
    result.current.ghostRef.current = document.createElement("div");

    act(() => result.current.onPointerDown(fakePointerEvent(100, 100, boardEl, boardEl)));
    act(() => result.current.onPointerUp(fakePointerEvent(103, 102, boardEl, boardEl))); // 3x2px

    expect(Object.keys(useNoteStore.getState().notes)).toHaveLength(0);
  });

  it("clamps a tiny-but-valid drag up to MIN_NOTE_SIZE", () => {
    const boardEl = document.createElement("div");
    stubRect(boardEl, { left: 0, top: 0, width: 1000, height: 800 });

    const { result } = renderHook(() => useCreateNoteByDrag({ boardRef: { current: boardEl } }));
    result.current.ghostRef.current = document.createElement("div");

    act(() => result.current.onPointerDown(fakePointerEvent(0, 0, boardEl, boardEl)));
    act(() => result.current.onPointerUp(fakePointerEvent(15, 15, boardEl, boardEl))); // past the min-drag threshold, but smaller than MIN_NOTE_SIZE

    const notes = Object.values(useNoteStore.getState().notes);
    expect(notes[0]?.size).toEqual(MIN_NOTE_SIZE);
  });

  it("ignores pointerdown on a child element (e.g. an existing note), not the board background itself", () => {
    const boardEl = document.createElement("div");
    stubRect(boardEl, { left: 0, top: 0, width: 1000, height: 800 });
    const childEl = document.createElement("div");

    const { result } = renderHook(() => useCreateNoteByDrag({ boardRef: { current: boardEl } }));
    result.current.ghostRef.current = document.createElement("div");

    act(() => result.current.onPointerDown(fakePointerEvent(100, 100, childEl, boardEl)));
    act(() => result.current.onPointerUp(fakePointerEvent(300, 300, childEl, boardEl)));

    expect(Object.keys(useNoteStore.getState().notes)).toHaveLength(0);
  });
});
