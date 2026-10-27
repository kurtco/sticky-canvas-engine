import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Note, NoteColor, Position, Size } from "../domain/types";

interface DeletedNoteBuffer {
  note: Note;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface NoteStoreState {
  notes: Record<string, Note>;
  order: string[]; // e.g. bringToFront never changes this — React never reorders a note's DOM node.
  nextZIndex: number; // e.g. always the highest zIndex handed out + 1, so bringToFront never recomputes others.
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

      // e.g. clicking a note just bumps its z-index — `order` (and the DOM) never gets reshuffled.
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

      // e.g. drop a note on the trash: it vanishes instantly, but a 5s "Undo" toast can still bring it back.
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
      // e.g. without this, reloading mid-undo-countdown would show a toast whose timer no longer exists.
      partialize: (state) => ({
        notes: state.notes,
        order: state.order,
        nextZIndex: state.nextZIndex,
      }),
    },
  ),
);
