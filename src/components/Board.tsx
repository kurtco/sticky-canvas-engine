import { useRef } from "react";
import { useNoteStore } from "../store/useNoteStore";
import { useCreateNoteByDrag } from "../hooks/useCreateNoteByDrag";
import { StickyNote } from "./StickyNote";
import { TrashZone } from "./TrashZone";
import { Toolbar } from "./Toolbar";
import { UndoToast } from "./UndoToast";

// e.g. typing in one note's textarea never re-renders this list — Board only reacts to notes being added/removed/reordered.
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
