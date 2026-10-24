import { useEffect, useRef } from "react";
import { useNoteStore } from "../store/useNoteStore";
import { useCreateNoteByDrag } from "../hooks/useCreateNoteByDrag";
import { StickyNote } from "./StickyNote";
import { TrashZone } from "./TrashZone";
import { Toolbar } from "./Toolbar";
import { UndoToast } from "./UndoToast";

// The board subscribes only to the `order` or unique ID  array (stable reference unless
// a note is added, deleted, undone, or brought to front), never to the
// `notes` record itself — so editing a single note's text or dragging it
// never re-renders the board or its siblings.
export function Board() {
  const boardRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);

  const order = useNoteStore((s) => s.order);
  const notes = useNoteStore((s) => s.notes);
  const isLoaded = useNoteStore((s) => s.isLoaded);
  const loadNotes = useNoteStore((s) => s.loadNotes);

  const create = useCreateNoteByDrag({ boardRef });

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

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
        {isLoaded &&
          order.map((id) => {
            const note = notes[id];
            if (!note) return null;
            return <StickyNote key={id} note={note} boardRef={boardRef} trashRef={trashRef} />;
          })}
        <div ref={create.ghostRef} className="create-ghost" />
        <TrashZone trashRef={trashRef} />
      </div>
      <UndoToast />
    </div>
  );
}
