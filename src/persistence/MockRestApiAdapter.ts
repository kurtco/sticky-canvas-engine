import type { Note } from "../domain/types";
import type { NoteRepository } from "./NoteRepository";

const SIMULATED_LATENCY_MS = 400;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_LATENCY_MS));
}

// Simulates a REST backend with an in-memory "database" and network latency.
// No real endpoint exists; this stands in for a fetch("/api/notes") call.
export class MockRestApiAdapter implements NoteRepository {
  private db: Note[] = [];

  async load(): Promise<Note[]> {
    return delay(this.db);
  }

  async save(notes: Note[]): Promise<void> {
    this.db = notes;
    await delay(undefined);
  }
}
