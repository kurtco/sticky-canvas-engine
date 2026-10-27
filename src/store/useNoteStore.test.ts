import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNoteStore } from "./useNoteStore";

beforeEach(() => {
  localStorage.clear();
  useNoteStore.setState({ notes: {}, order: [], nextZIndex: 1, pendingDeletes: {} });
});

describe("bringToFront", () => {
  it("raises the note's z-index without reordering `order`", () => {
    const idA = useNoteStore.getState().addNote({ x: 0, y: 0 }, { width: 120, height: 100 });
    const idB = useNoteStore.getState().addNote({ x: 10, y: 10 }, { width: 120, height: 100 });

    useNoteStore.getState().bringToFront(idA);

    const state = useNoteStore.getState();
    expect(state.notes[idA]?.zIndex).toBeGreaterThan(state.notes[idB]?.zIndex ?? 0);
    expect(state.order).toEqual([idA, idB]); // DOM render order stays as creation order
  });

  it("is a no-op when the note is already on top", () => {
    const idA = useNoteStore.getState().addNote({ x: 0, y: 0 }, { width: 120, height: 100 });
    useNoteStore.getState().addNote({ x: 10, y: 10 }, { width: 120, height: 100 });

    useNoteStore.getState().bringToFront(idA);
    const afterFirstBump = useNoteStore.getState();

    useNoteStore.getState().bringToFront(idA); // already the topmost note
    const afterSecondCall = useNoteStore.getState();

    expect(afterSecondCall.notes).toBe(afterFirstBump.notes); // same reference: no redundant update
  });

  it("gives each newly created note a higher z-index than the previous one", () => {
    const idA = useNoteStore.getState().addNote({ x: 0, y: 0 }, { width: 120, height: 100 });
    const idB = useNoteStore.getState().addNote({ x: 10, y: 10 }, { width: 120, height: 100 });

    const state = useNoteStore.getState();
    expect(state.notes[idB]?.zIndex).toBeGreaterThan(state.notes[idA]?.zIndex ?? 0);
  });
});

describe("persistence (localStorage)", () => {
  it("writes notes/order/nextZIndex to localStorage on every mutation", () => {
    const id = useNoteStore.getState().addNote({ x: 0, y: 0 }, { width: 120, height: 100 });

    const raw = localStorage.getItem("sticky-notes-storage");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.notes[id]).toBeDefined();
    expect(parsed.state.order).toEqual([id]);
  });

  it("never persists pendingDeletes (it holds a live timeoutId)", () => {
    const id = useNoteStore.getState().addNote({ x: 0, y: 0 }, { width: 120, height: 100 });
    useNoteStore.getState().deleteNote(id);

    const raw = localStorage.getItem("sticky-notes-storage");
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.pendingDeletes).toBeUndefined();
  });

  it("restores notes from localStorage on a fresh module load (simulates an F5 reload)", async () => {
    localStorage.setItem(
      "sticky-notes-storage",
      JSON.stringify({
        state: {
          notes: { "note-1": { id: "note-1", position: { x: 5, y: 5 }, size: { width: 120, height: 100 }, text: "hi", color: "yellow", zIndex: 1 } },
          order: ["note-1"],
          nextZIndex: 2,
        },
        version: 0,
      }),
    );

    vi.resetModules();
    const { useNoteStore: rehydratedStore } = await import("./useNoteStore");

    expect(rehydratedStore.getState().notes["note-1"]?.text).toBe("hi");
    expect(rehydratedStore.getState().order).toEqual(["note-1"]);
  });
});
