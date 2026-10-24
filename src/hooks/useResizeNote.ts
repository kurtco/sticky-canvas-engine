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

// Single responsibility: resizing a note from its bottom-right handle.
// Unlike dragging, resizing must touch width/height (not transform) since
// the note's content needs to reflow with its new box — that reflow stays
// local to this one element, so the cost is acceptable.
export function useResizeNote({ id, size, position, boardRef }: UseResizeNoteOptions) {
  const elRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const resizeNote = useNoteStore((s) => s.resizeNote);

  
  // recives the current size and thje
  const computeClampedSize = useCallback((resize: ResizeState, clientX: number, clientY: number): Size => {
    const width = clamp(resize.origWidth + (clientX - resize.startX), MIN_NOTE_SIZE.width, resize.maxWidth);
    const height = clamp(resize.origHeight + (clientY - resize.startY), MIN_NOTE_SIZE.height, resize.maxHeight);
    return { width, height };
  }, []);

  // the users clicks on the stick
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!boardRef.current) return;
      e.stopPropagation(); 
      e.currentTarget.setPointerCapture(e.pointerId);
      const boardRect = boardRef.current.getBoundingClientRect();
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origWidth: size.width,
        origHeight: size.height,
        /* They represent the exact position of your pointer (mouse) within the browser window at that precise moment */
        maxWidth: boardRect.width - position.x,
        maxHeight: boardRect.height - position.y,
      };
    },
    [boardRef, position.x, position.y, size.height, size.width],
  );


  // the user is working or resizing
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
 

  // the user stops working with the stick
  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const resize = resizeRef.current;
      if (!resize) return;
      e.stopPropagation();
      e.currentTarget.releasePointerCapture(e.pointerId);
      resizeNote(id, computeClampedSize(resize, e.clientX, e.clientY)); // critical part: when the users stops resizing we calculate the final size
      resizeRef.current = null;
    },
    [computeClampedSize, id, resizeNote],
  );


  return { elRef, onPointerDown, onPointerMove, onPointerUp };
}
