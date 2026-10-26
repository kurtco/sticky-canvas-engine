import { beforeEach, describe, expect, it } from "vitest";
import { useNoteStore } from "./useNoteStore";

beforeEach(() => {
  useNoteStore.setState({ notes: {}, order: [], nextZIndex: 1, pendingDeletes: {}, isLoaded: false });
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
