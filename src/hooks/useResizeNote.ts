import { useCallback, useRef } from "react";
import type { Position, Size } from "../domain/types";
import { MIN_NOTE_SIZE } from "../domain/types";
import { clamp } from "../domain/geometry";
import { useNoteStore } from "../store/useNoteStore";

interface ResizeState {
  startX: number;
  startY: number;
  origWidth: number;
  origHeight: number;
  maxWidth: number;
  maxHeight: number;
}

interface UseResizeNoteOptions {
  id: string;
  size: Size;
  position: Position;
  boardRef: React.RefObject<HTMLDivElement | null>;
}

// e.g. growing the note needs its textarea to reflow too — that's why this mutates width/height, not transform.
export function useResizeNote({ id, size, position, boardRef }: UseResizeNoteOptions) {
  const elRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const resizeNote = useNoteStore((s) => s.resizeNote);

  // e.g. dragging past the board edge: still returns a size that fits, never bigger than maxWidth/maxHeight.
  const computeClampedSize = useCallback((resize: ResizeState, clientX: number, clientY: number): Size => {
    const width = clamp(resize.origWidth + (clientX - resize.startX), MIN_NOTE_SIZE.width, resize.maxWidth);
    const height = clamp(resize.origHeight + (clientY - resize.startY), MIN_NOTE_SIZE.height, resize.maxHeight);
    return { width, height };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!boardRef.current) return;
      e.stopPropagation(); // e.g. without this, dragging the resize handle would also start moving the note
      e.currentTarget.setPointerCapture(e.pointerId);
      const boardRect = boardRef.current.getBoundingClientRect();
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origWidth: size.width,
        origHeight: size.height,
        // e.g. a note at x=700 on a 1000px board can only grow to width=300, not the full board width
        maxWidth: boardRect.width - position.x,
        maxHeight: boardRect.height - position.y,
      };
    },
    [boardRef, position.x, position.y, size.height, size.width],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const resize = resizeRef.current;
      const el = elRef.current;
      if (!resize || !el) return;
      const { width, height } = computeClampedSize(resize, e.clientX, e.clientY);
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
    },
    [computeClampedSize],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const resize = resizeRef.current;
      if (!resize) return;
      e.stopPropagation();
      e.currentTarget.releasePointerCapture(e.pointerId);
      resizeNote(id, computeClampedSize(resize, e.clientX, e.clientY));
      resizeRef.current = null;
    },
    [computeClampedSize, id, resizeNote],
  );

  return { elRef, onPointerDown, onPointerMove, onPointerUp };
}
