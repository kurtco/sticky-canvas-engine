import { useRef } from "react";
import { useNoteStore } from "../store/useNoteStore";
import { useCreateNoteByDrag } from "../hooks/useCreateNoteByDrag";
import { StickyNote } from "./StickyNote";
import { TrashZone } from "./TrashZone";
import { Toolbar } from "./Toolbar";
import { UndoToast } from "./UndoToast";

// The board subscribes only to the `order` ID array (stable reference unless
// a note is added, deleted, undone, or brought to front) — never to the
// `notes` record itself. Each StickyNote reads its own note by id, so
// editing or dragging one note re-renders only that note, never the board
// or its siblings.
export function Board() {
  const boardRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);

  const order = useNoteStore((s) => s.order);

  const create = useCreateNoteByDrag({ boardRef });

  return (
    <div className="app">
      <Toolbar />
      <div
        ref={boardRef}
        className="board"
        onPointerDown={create.onPointerDown}
        onPointerMove={create.onPointerMove}
        onPointerUp={create.onPointerUp}
      >
        {order.map((id) => (
          <StickyNote key={id} id={id} boardRef={boardRef} trashRef={trashRef} />
        ))}
        <div ref={create.ghostRef} className="create-ghost" />
        <TrashZone trashRef={trashRef} />
      </div>
      <UndoToast />
    </div>
  );
}
