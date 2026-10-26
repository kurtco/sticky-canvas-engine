import { create } from "zustand";
import type { Note, NoteColor, Position, Size } from "../domain/types";
import type { NoteRepository } from "../persistence/NoteRepository";
import { LocalStorageAdapter } from "../persistence/LocalStorageAdapter";
import { MockRestApiAdapter } from "../persistence/MockRestApiAdapter";
import { CompositeAdapter } from "../persistence/CompositeAdapter";
import { debounce } from "./debounce";

// Dependency injection: the store only knows about the NoteRepository port.

// using local storage tosave data
// const repository: NoteRepository = new CompositeAdapter(new LocalStorageAdapter(), [
//   new MockRestApiAdapter(),
// ]);

// using mock fake api to save data here rivate db: Note[] = []
const repository: NoteRepository = new CompositeAdapter(
  new MockRestApiAdapter(),
  [new LocalStorageAdapter()],
);
interface DeletedNoteBuffer {
  note: Note;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface NoteStoreState {
  notes: Record<string, Note>;
  order: string[]; // render order (DOM); never reordered, so an active
  nextZIndex: number; //  handle the stick note position to move it to front
  pendingDeletes: Record<string, DeletedNoteBuffer>;
  isLoaded: boolean;
  loadNotes: () => Promise<void>;
  addNote: (position: Position, size: Size) => string;
  moveNote: (id: string, position: Position) => void;
  resizeNote: (id: string, size: Size) => void;
  setNoteText: (id: string, text: string) => void;
  setNoteColor: (id: string, color: NoteColor) => void;
  bringToFront: (id: string) => void;
  deleteNote: (id: string) => void;
  undoDelete: (id: string) => void;
}

const persistNotes = debounce((notes: Note[]) => {
  void repository.save(notes);
}, 300);

function schedulePersist(get: () => NoteStoreState) {
  const { notes, order } = get();
  persistNotes(
    order.map((id) => notes[id]).filter((n): n is Note => n !== undefined),
  );
}

let noteIdCounter = 0;
function createNoteId(): string {
  noteIdCounter += 1;
  return `note-${Date.now()}-${noteIdCounter}`;
}

export const useNoteStore = create<NoteStoreState>((set, get) => ({
  notes: {},
  order: [],
  nextZIndex: 1,
  pendingDeletes: {},
  isLoaded: false,

  loadNotes: async () => {
    const notes = await repository.load();
    const maxZIndex = notes.reduce((max, n) => Math.max(max, n.zIndex), 0);
    set({
      notes: Object.fromEntries(notes.map((n) => [n.id, n])),
      order: notes.map((n) => n.id),
      nextZIndex: maxZIndex + 1,
      isLoaded: true,
    });
  },

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
    schedulePersist(get);
    return id;
  },

  moveNote: (id, position) => {
    set((state) => {
      const note = state.notes[id];
      if (!note) return state;
      return { notes: { ...state.notes, [id]: { ...note, position } } };
    });
    schedulePersist(get);
  },

  resizeNote: (id, size) => {
    set((state) => {
      const note = state.notes[id];
      if (!note) return state;
      return { notes: { ...state.notes, [id]: { ...note, size } } };
    });
    schedulePersist(get);
  },

  setNoteText: (id, text) => {
    set((state) => {
      const note = state.notes[id];
      if (!note) return state;
      return { notes: { ...state.notes, [id]: { ...note, text } } };
    });
    schedulePersist(get);
  },

  setNoteColor: (id, color) => {
    set((state) => {
      const note = state.notes[id];
      if (!note) return state;
      return { notes: { ...state.notes, [id]: { ...note, color } } };
    });
    schedulePersist(get);
  },

  // moving the stick to front is visual only, via z-index. We never touch `order`  array (which
  // controls DOM position)
  bringToFront: (id) => {
    set((state) => {
      const note = state.notes[id];
      if (!note || note.zIndex === state.nextZIndex - 1) return state; //the stick note is already out in front; don’t do anything.
      return {
        notes: { ...state.notes, [id]: { ...note, zIndex: state.nextZIndex } }, //Assigning the highest number
        nextZIndex: state.nextZIndex + 1, // incrementing the counter for next time
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
      schedulePersist(get);
    }, 5000);

    set((state) => {
      const { [id]: _removed, ...notes } = state.notes;
      return {
        notes,
        order: state.order.filter((noteId) => noteId !== id),
        pendingDeletes: { ...state.pendingDeletes, [id]: { note, timeoutId } },
      };
    });
    schedulePersist(get);
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
    schedulePersist(get);
  },
}));
