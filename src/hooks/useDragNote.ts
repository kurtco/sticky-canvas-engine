import { useCallback, useRef } from "react";
import type { Position, Size } from "../domain/types";
import { clamp, rectsOverlap } from "../domain/geometry";
import { useNoteStore } from "../store/useNoteStore";

interface DragState {
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  boardRect: DOMRect;
}

interface UseDragNoteOptions {
  id: string;
  size: Size;
  boardRef: React.RefObject<HTMLDivElement | null>;
  trashRef: React.RefObject<HTMLDivElement | null>;
}

// Single responsibility: moving an existing note by dragging it.
// Position is mutated straight on the DOM node during the gesture and only
// committed to the Zustand store on pointerup, so dragging never re-renders
// React at pointer-event frequency.
export function useDragNote({ id, size, boardRef, trashRef }: UseDragNoteOptions) {
  const elRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const moveNote = useNoteStore((s) => s.moveNote);
  const deleteNote = useNoteStore((s) => s.deleteNote);
  const bringToFront = useNoteStore((s) => s.bringToFront);

  const computeClampedPosition = useCallback(
    (drag: DragState, clientX: number, clientY: number): Position => {
      const maxX = drag.boardRect.width - size.width;
      const maxY = drag.boardRect.height - size.height;
      return {
        x: clamp(drag.origX + (clientX - drag.startX), 0, Math.max(0, maxX)),
        y: clamp(drag.origY + (clientY - drag.startY), 0, Math.max(0, maxY)),
      };
    },
    [size.height, size.width],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!boardRef.current || !elRef.current) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      bringToFront(id);

      // Cache both rects once up front; re-reading the DOM on every
      // pointermove would force a synchronous layout (layout thrashing).
      const boardRect = boardRef.current.getBoundingClientRect();
      const noteRect = elRef.current.getBoundingClientRect();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: noteRect.left - boardRect.left,
        origY: noteRect.top - boardRect.top,
        boardRect,
      };
    },
    [boardRef, bringToFront, id],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      const el = elRef.current;
      if (!drag || !el) return;
      const { x, y } = computeClampedPosition(drag, e.clientX, e.clientY);
      el.style.transform = `translate(${x}px, ${y}px)`;
    },
    [computeClampedPosition],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      e.currentTarget.releasePointerCapture(e.pointerId);

      const { x, y } = computeClampedPosition(drag, e.clientX, e.clientY);
      const noteRect = new DOMRect(
        drag.boardRect.left + x,
        drag.boardRect.top + y,
        size.width,
        size.height,
      );
      const droppedOnTrash =
        trashRef.current !== null && rectsOverlap(noteRect, trashRef.current.getBoundingClientRect());

      if (droppedOnTrash) {
        deleteNote(id);
      } else {
        moveNote(id, { x, y });
      }
      dragRef.current = null;
    },
    [computeClampedPosition, deleteNote, id, moveNote, size.height, size.width, trashRef],
  );

  return { elRef, onPointerDown, onPointerMove, onPointerUp };
}
