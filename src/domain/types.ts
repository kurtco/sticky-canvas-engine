export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type NoteColor = "yellow" | "pink" | "green" | "blue" | "orange";

export interface Note {
  id: string;
  position: Position;
  size: Size;
  text: string;
  color: NoteColor;
  zIndex: number;
}

export const NOTE_COLORS: NoteColor[] = ["yellow", "pink", "green", "blue", "orange"];

export const MIN_NOTE_SIZE: Size = { width: 120, height: 100 };
