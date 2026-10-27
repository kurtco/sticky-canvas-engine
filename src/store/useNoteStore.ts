import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Note, NoteColor, Position, Size } from "../domain/types";

interface DeletedNoteBuffer {
  note: Note;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface NoteStoreState {
  notes: Record<string, Note>;
  order: string[]; // render order (DOM); never reordered, so an active
  nextZIndex: number; // handle the sticky note position to move it to front
  pendingDeletes: Record<string, DeletedNoteBuffer>;
  addNote: (position: Position, size: Size) => string;
  moveNote: (id: string, position: Position) => void;
  resizeNote: (id: string, size: Size) => void;
  setNoteText: (id: string, text: string) => void;
  setNoteColor: (id: string, color: NoteColor) => void;
  bringToFront: (id: string) => void;
  deleteNote: (id: string) => void;
  undoDelete: (id: string) => void;
}

let noteIdCounter = 0;
function createNoteId(): string {
  noteIdCounter += 1;
  return `note-${Date.now()}-${noteIdCounter}`;
}

export const useNoteStore = create<NoteStoreState>()(
  persist(
    (set, get) => ({
      notes: {},
      order: [],
      nextZIndex: 1,
      pendingDeletes: {},

      addNote: (position, size) => {
        const id = createNoteId();
        set((state) => {
          const note: Note = {
            id,
            position,
            size,
            text: "",
            color: "yellow",
            zIndex: state.nextZIndex,
          };
          return {
            notes: { ...state.notes, [id]: note },
            order: [...state.order, id],
            nextZIndex: state.nextZIndex + 1,
          };
        });
        return id;
      },

      moveNote: (id, position) => {
        set((state) => {
          const note = state.notes[id];
          if (!note) return state;
          return { notes: { ...state.notes, [id]: { ...note, position } } };
        });
      },

      resizeNote: (id, size) => {
        set((state) => {
          const note = state.notes[id];
          if (!note) return state;
          return { notes: { ...state.notes, [id]: { ...note, size } } };
        });
      },

      setNoteText: (id, text) => {
        set((state) => {
          const note = state.notes[id];
          if (!note) return state;
          return { notes: { ...state.notes, [id]: { ...note, text } } };
        });
      },

      setNoteColor: (id, color) => {
        set((state) => {
          const note = state.notes[id];
          if (!note) return state;
          return { notes: { ...state.notes, [id]: { ...note, color } } };
        });
      },

      // Stacking is visual only, via z-index. We never touch `order` (which
      // controls DOM position) — if React moves the node mid-drag, the
      // browser can drop pointer capture and the gesture breaks.
      bringToFront: (id) => {
        set((state) => {
          const note = state.notes[id];
          if (!note || note.zIndex === state.nextZIndex - 1) return state;
          return {
            notes: {
              ...state.notes,
              [id]: { ...note, zIndex: state.nextZIndex },
            },
            nextZIndex: state.nextZIndex + 1,
          };
        });
      },

      // Optimistic delete: the note disappears immediately but is kept in a
      // buffer for a few seconds so the UI can offer an undo instead of a
      // blocking confirm() dialog.
      deleteNote: (id) => {
        const note = get().notes[id];
        if (!note) return;

        const timeoutId = setTimeout(() => {
          set((state) => {
            const { [id]: _removed, ...pendingDeletes } = state.pendingDeletes;
            return { pendingDeletes };
          });
        }, 5000);

        set((state) => {
          const { [id]: _removed, ...notes } = state.notes;
          return {
            notes,
            order: state.order.filter((noteId) => noteId !== id),
            pendingDeletes: {
              ...state.pendingDeletes,
              [id]: { note, timeoutId },
            },
          };
        });
      },

      undoDelete: (id) => {
        const buffered = get().pendingDeletes[id];
        if (!buffered) return;
        clearTimeout(buffered.timeoutId);
        set((state) => {
          const { [id]: _removed, ...pendingDeletes } = state.pendingDeletes;
          return {
            notes: {
              ...state.notes,
              [id]: { ...buffered.note, zIndex: state.nextZIndex },
            },
            order: [...state.order, id],
            nextZIndex: state.nextZIndex + 1,
            pendingDeletes,
          };
        });
      },
    }),
    {
      name: "sticky-notes-storage",
      // pendingDeletes holds a live timeoutId — it's transient UI state,
      // not something that should survive a reload.
      partialize: (state) => ({
        notes: state.notes,
        order: state.order,
        nextZIndex: state.nextZIndex,
      }),
    },
  ),
);
