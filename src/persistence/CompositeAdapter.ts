import type { Note } from "../domain/types";
import type { NoteRepository } from "./NoteRepository";

// Fans a save out to every backing repository (e.g. localStorage + mock REST),
// but only the primary one is authoritative for loading on startup.
export class CompositeAdapter implements NoteRepository {
  constructor(
    private primary: NoteRepository,
    private secondary: NoteRepository[],
  ) {}

  async load(): Promise<Note[]> {
    return this.primary.load();
  }

  async save(notes: Note[]): Promise<void> {
    await Promise.all([this.primary.save(notes), ...this.secondary.map((r) => r.save(notes))]);
  }
}
