import type { Note } from "../domain/types";

// Port: the store depends on this abstraction, never on a concrete storage mechanism.
export interface NoteRepository {
  load(): Promise<Note[]>;
  save(notes: Note[]): Promise<void>;
}
