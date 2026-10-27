import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useDragNote } from "./useDragNote";
import { useNoteStore } from "../store/useNoteStore";

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
    currentTarget: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
  } as unknown as ReactPointerEvent;
}

beforeEach(() => {
  localStorage.clear();
  useNoteStore.setState({ notes: {}, order: [], nextZIndex: 1, pendingDeletes: {} });
});

describe("useDragNote", () => {
  it("mutates the DOM node on pointermove, then commits the clamped position on pointerup", () => {
    const boardEl = document.createElement("div");
    stubRect(boardEl, { left: 0, top: 0, width: 1000, height: 800 });
    const noteEl = document.createElement("div");
    stubRect(noteEl, { left: 40, top: 40, width: 200, height: 150 });
    const trashEl = document.createElement("div");
    stubRect(trashEl, { left: 900, top: 700, width: 80, height: 60 }); // far away, never hit

    const id = useNoteStore.getState().addNote({ x: 40, y: 40 }, { width: 200, height: 150 });

    const { result } = renderHook(() =>
      useDragNote({
        id,
        size: { width: 200, height: 150 },
        boardRef: { current: boardEl },
        trashRef: { current: trashEl },
      }),
    );
    result.current.elRef.current = noteEl;

    act(() => result.current.onPointerDown(fakePointerEvent(100, 100)));
    act(() => result.current.onPointerMove(fakePointerEvent(150, 120)));

    // origX/origY = noteRect - boardRect = 40,40; delta = (50, 20) => (90, 60)
    expect(noteEl.style.transform).toBe("translate(90px, 60px)");

    act(() => result.current.onPointerUp(fakePointerEvent(150, 120)));

    expect(useNoteStore.getState().notes[id]?.position).toEqual({ x: 90, y: 60 });
    expect(useNoteStore.getState().order).toContain(id); // not deleted
  });

  it("deletes the note when its body overlaps the trash, even if the cursor itself doesn't", () => {
    const boardEl = document.createElement("div");
    stubRect(boardEl, { left: 0, top: 0, width: 1000, height: 800 });
    const noteEl = document.createElement("div");
    stubRect(noteEl, { left: 0, top: 0, width: 300, height: 300 }); // a large note
    const trashEl = document.createElement("div");
    stubRect(trashEl, { left: 500, top: 500, width: 100, height: 100 });

    const id = useNoteStore.getState().addNote({ x: 0, y: 0 }, { width: 300, height: 300 });

    const { result } = renderHook(() =>
      useDragNote({
        id,
        size: { width: 300, height: 300 },
        boardRef: { current: boardEl },
        trashRef: { current: trashEl },
      }),
    );
    result.current.elRef.current = noteEl;

    act(() => result.current.onPointerDown(fakePointerEvent(10, 10)));
    // drop so the note's body [480,480]-[780,780] overlaps the trash
    // [500,500]-[600,600], while the cursor (490, 490) itself is outside it
    act(() => result.current.onPointerUp(fakePointerEvent(490, 490)));

    expect(useNoteStore.getState().notes[id]).toBeUndefined();
    expect(useNoteStore.getState().pendingDeletes[id]).toBeDefined();
  });
});
