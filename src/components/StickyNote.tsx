import { memo, useCallback } from "react";
import type { Note, NoteColor } from "../domain/types";
import { NOTE_COLORS } from "../domain/types";
import { useDragNote } from "../hooks/useDragNote";
import { useResizeNote } from "../hooks/useResizeNote";
import { useNoteStore } from "../store/useNoteStore";

interface StickyNoteProps {
  note: Note;
  boardRef: React.RefObject<HTMLDivElement | null>;
  trashRef: React.RefObject<HTMLDivElement | null>;
}

// Wrapped in memo so dragging/resizing/editing one note never re-renders
// its siblings: the board only re-renders this component when the `note`
// object for this specific id changes.
function StickyNoteComponent({ note, boardRef, trashRef }: StickyNoteProps) {
  const setNoteText = useNoteStore((s) => s.setNoteText);
  const setNoteColor = useNoteStore((s) => s.setNoteColor);
  const bringToFront = useNoteStore((s) => s.bringToFront);

  const drag = useDragNote({ id: note.id, size: note.size, boardRef, trashRef });
  const resize = useResizeNote({ id: note.id, size: note.size, position: note.position, boardRef });

  const onTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => setNoteText(note.id, e.target.value),
    [note.id, setNoteText],
  );

  const onColorChange = useCallback(
    (color: NoteColor) => setNoteColor(note.id, color),
    [note.id, setNoteColor],
  );

  // Combine both refs (drag's root ref and resize's size-mutation target)
  // onto the same DOM node.
  const setRefs = useCallback(
    (el: HTMLDivElement | null) => {
      drag.elRef.current = el;
      resize.elRef.current = el;
    },
    [drag.elRef, resize.elRef],
  );

  return (
    <div
      ref={setRefs}
      className={`sticky-note sticky-note--${note.color}`}
      style={{
        transform: `translate(${note.position.x}px, ${note.position.y}px)`,
        width: note.size.width,
        height: note.size.height,
      }}
      onFocus={() => bringToFront(note.id)}
    >
      {/* "sticky-note__handle "Dedicated grab strip: the only region that starts a move-drag, so
          it never competes with text editing or color swatches below it. */}
      <div
        className="sticky-note__handle"
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
      >
        <div className="sticky-note__colors">
          {NOTE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`sticky-note__swatch sticky-note__swatch--${color}`}
              aria-label={`Set color ${color}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onColorChange(color)}
            />
          ))}
        </div>
      </div>

      <textarea
        className="sticky-note__text"
        value={note.text}
        placeholder="Type a note…"
        onChange={onTextChange}
      />

      <div
        className="sticky-note__resize-handle"
        onPointerDown={resize.onPointerDown}
        onPointerMove={resize.onPointerMove}
        onPointerUp={resize.onPointerUp}
      />
    </div>
  );
}

export const StickyNote = memo(StickyNoteComponent);
