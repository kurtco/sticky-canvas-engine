import type { Note } from "../domain/types";
import type { NoteRepository } from "./NoteRepository";

const STORAGE_KEY = "sticky-canvas-engine:notes";

// Wrapped in Promise.resolve to honor the async NoteRepository contract,
// even though localStorage itself is synchronous.
export class LocalStorageAdapter implements NoteRepository {
  async load(): Promise<Note[]> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Note[];
    } catch {
      return [];
    }
  }

  async save(notes: Note[]): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }
}
