import { memo, useCallback, useState } from "react";
import type { NoteColor } from "../domain/types";
import { NOTE_COLORS } from "../domain/types";
import { useDragNote } from "../hooks/useDragNote";
import { useResizeNote } from "../hooks/useResizeNote";
import { useNoteStore } from "../store/useNoteStore";

interface StickyNoteProps {
  id: string;
  boardRef: React.RefObject<HTMLDivElement | null>;
  trashRef: React.RefObject<HTMLDivElement | null>;
}

// Wrapped in memo, and subscribes to its own note by id — editing or
// dragging one note only re-renders this component, never the board or
// its siblings.
function StickyNoteComponent({ id, boardRef, trashRef }: StickyNoteProps) {
  const note = useNoteStore((s) => s.notes[id]);
  const setNoteText = useNoteStore((s) => s.setNoteText);
  const setNoteColor = useNoteStore((s) => s.setNoteColor);
  const bringToFront = useNoteStore((s) => s.bringToFront);

  // Local to this component while typing — the store (and every other
  // subscriber) is only updated on blur, so a keystroke never triggers a
  // Zustand update at all.
  const [text, setText] = useState(note?.text ?? "");

  const drag = useDragNote({ id, size: note?.size ?? { width: 0, height: 0 }, boardRef, trashRef });
  const resize = useResizeNote({
    id,
    size: note?.size ?? { width: 0, height: 0 },
    position: note?.position ?? { x: 0, y: 0 },
    boardRef,
  });

  const onTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value),
    [],
  );

  const onTextBlur = useCallback(() => setNoteText(id, text), [id, setNoteText, text]);

  const onColorChange = useCallback((color: NoteColor) => setNoteColor(id, color), [id, setNoteColor]);

  // Combine both refs (drag's root ref and resize's size-mutation target)
  // onto the same DOM node.
  const setRefs = useCallback(
    (el: HTMLDivElement | null) => {
      drag.elRef.current = el;
      resize.elRef.current = el;
    },
    [drag.elRef, resize.elRef],
  );

  if (!note) return null; // deleted mid-render (e.g. dragged onto the trash)

  return (
    <div
      ref={setRefs}
      className={`sticky-note sticky-note--${note.color}`}
      style={{
        transform: `translate(${note.position.x}px, ${note.position.y}px)`,
        width: note.size.width,
        height: note.size.height,
        zIndex: note.zIndex,
      }}
      onFocus={() => bringToFront(id)}
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
        value={text}
        placeholder="Type a note…"
        onChange={onTextChange}
        onBlur={onTextBlur}
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
