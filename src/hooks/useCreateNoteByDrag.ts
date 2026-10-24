import { useCallback, useRef } from "react";
import { MIN_NOTE_SIZE } from "../domain/types";
import { useNoteStore } from "../store/useNoteStore";

interface CreateDragState {
  startX: number;
  startY: number;
  boardRect: DOMRect;
}

// A minimum drag distance below this is treated as a stray click, not an
// intent to draw a note.
const MIN_DRAG_DISTANCE = 10;

interface UseCreateNoteByDragOptions {
  boardRef: React.RefObject<HTMLDivElement | null>;
}

// Single responsibility: drawing a brand-new note by dragging on empty
// board space (click-drag from corner to corner), mirroring useDragNote's
// shape — cache on pointerdown, mutate a ghost element on pointermove,
// commit to the store only on pointerup.
export function useCreateNoteByDrag({ boardRef }: UseCreateNoteByDragOptions) {
  const ghostRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<CreateDragState | null>(null);
  const addNote = useNoteStore((s) => s.addNote);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only start a creation drag when the background itself was pressed,
      // not a note or any interactive element on top of it.
      if (e.target !== e.currentTarget || !boardRef.current) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        boardRect: boardRef.current.getBoundingClientRect(),
      };
    },
    [boardRef],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    const ghost = ghostRef.current;
    if (!drag || !ghost) return;

    const left = Math.min(e.clientX, drag.startX) - drag.boardRect.left;
    const top = Math.min(e.clientY, drag.startY) - drag.boardRect.top;
    const width = Math.abs(e.clientX - drag.startX);
    const height = Math.abs(e.clientY - drag.startY);

    ghost.style.display = "block";
    ghost.style.transform = `translate(${left}px, ${top}px)`;
    ghost.style.width = `${width}px`;
    ghost.style.height = `${height}px`;
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      const ghost = ghostRef.current;
      dragRef.current = null;
      if (ghost) ghost.style.display = "none";
      if (!drag) return;
      e.currentTarget.releasePointerCapture(e.pointerId);

      const width = Math.abs(e.clientX - drag.startX);
      const height = Math.abs(e.clientY - drag.startY);
      if (width < MIN_DRAG_DISTANCE || height < MIN_DRAG_DISTANCE) return;

      addNote(
        {
          x: Math.min(e.clientX, drag.startX) - drag.boardRect.left,
          y: Math.min(e.clientY, drag.startY) - drag.boardRect.top,
        },
        {
          width: Math.max(width, MIN_NOTE_SIZE.width),
          height: Math.max(height, MIN_NOTE_SIZE.height),
        },
      );
    },
    [addNote],
  );

  return { ghostRef, onPointerDown, onPointerMove, onPointerUp };
}
