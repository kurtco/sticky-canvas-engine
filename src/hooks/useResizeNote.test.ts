import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useResizeNote } from "./useResizeNote";
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

function fakePointerEvent(clientX: number, clientY: number) {
  return {
    pointerId: 1,
    clientX,
    clientY,
    stopPropagation: vi.fn(),
    currentTarget: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
  } as unknown as ReactPointerEvent;
}

beforeEach(() => {
  localStorage.clear();
  useNoteStore.setState({ notes: {}, order: [], nextZIndex: 1, pendingDeletes: {} });
});

describe("useResizeNote", () => {
  it("mutates width/height on pointermove, then commits the final size on pointerup", () => {
    const boardEl = document.createElement("div");
    stubRect(boardEl, { left: 0, top: 0, width: 1000, height: 800 });
    const noteEl = document.createElement("div");

    const id = useNoteStore.getState().addNote({ x: 40, y: 40 }, { width: 200, height: 150 });

    const { result } = renderHook(() =>
      useResizeNote({
        id,
        size: { width: 200, height: 150 },
        position: { x: 40, y: 40 },
        boardRef: { current: boardEl },
      }),
    );
    result.current.elRef.current = noteEl;

    act(() => result.current.onPointerDown(fakePointerEvent(0, 0)));
    act(() => result.current.onPointerMove(fakePointerEvent(60, 30))); // +60 wide, +30 tall

    expect(noteEl.style.width).toBe("260px");
    expect(noteEl.style.height).toBe("180px");

    act(() => result.current.onPointerUp(fakePointerEvent(60, 30)));

    expect(useNoteStore.getState().notes[id]?.size).toEqual({ width: 260, height: 180 });
  });

  it("never shrinks below MIN_NOTE_SIZE", () => {
    const boardEl = document.createElement("div");
    stubRect(boardEl, { left: 0, top: 0, width: 1000, height: 800 });
    const noteEl = document.createElement("div");

    const id = useNoteStore.getState().addNote({ x: 0, y: 0 }, { width: 200, height: 150 });

    const { result } = renderHook(() =>
      useResizeNote({
        id,
        size: { width: 200, height: 150 },
        position: { x: 0, y: 0 },
        boardRef: { current: boardEl },
      }),
    );
    result.current.elRef.current = noteEl;

    act(() => result.current.onPointerDown(fakePointerEvent(0, 0)));
    act(() => result.current.onPointerUp(fakePointerEvent(-500, -500))); // drag far past zero

    expect(useNoteStore.getState().notes[id]?.size).toEqual(MIN_NOTE_SIZE);
  });

  it("never grows past the board's bounds", () => {
    const boardEl = document.createElement("div");
    stubRect(boardEl, { left: 0, top: 0, width: 300, height: 300 });
    const noteEl = document.createElement("div");

    const id = useNoteStore.getState().addNote({ x: 0, y: 0 }, { width: 200, height: 150 });

    const { result } = renderHook(() =>
      useResizeNote({
        id,
        size: { width: 200, height: 150 },
        position: { x: 0, y: 0 },
        boardRef: { current: boardEl },
      }),
    );
    result.current.elRef.current = noteEl;

    act(() => result.current.onPointerDown(fakePointerEvent(0, 0)));
    act(() => result.current.onPointerUp(fakePointerEvent(5000, 5000))); // way past the 300x300 board

    expect(useNoteStore.getState().notes[id]?.size).toEqual({ width: 300, height: 300 });
  });
});
