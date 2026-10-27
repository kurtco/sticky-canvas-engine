import { useCallback, useRef } from "react";
import { MIN_NOTE_SIZE } from "../domain/types";
import { useNoteStore } from "../store/useNoteStore";

interface CreateDragState {
  startX: number;
  startY: number;
  boardRect: DOMRect;
}

// e.g. a 3px wiggle while clicking the board is ignored, not drawn as a tiny note.
const MIN_DRAG_DISTANCE = 10;

interface UseCreateNoteByDragOptions {
  boardRef: React.RefObject<HTMLDivElement | null>;
}

// e.g. drag a rectangle on empty canvas: a ghost div previews it live, the real note is only added on release.
export function useCreateNoteByDrag({ boardRef }: UseCreateNoteByDragOptions) {
  const ghostRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<CreateDragState | null>(null);
  const addNote = useNoteStore((s) => s.addNote);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // e.g. pressing down on an existing note shouldn't also start drawing a new one underneath it.
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
