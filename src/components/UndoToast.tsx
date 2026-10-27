import { useNoteStore } from "../store/useNoteStore";

// e.g. delete 3 notes fast: 3 stacked toasts, each with its own independent 5s countdown.
export function UndoToast() {
  const pendingDeletes = useNoteStore((s) => s.pendingDeletes);
  const undoDelete = useNoteStore((s) => s.undoDelete);
  const ids = Object.keys(pendingDeletes);

  if (ids.length === 0) return null;

  return (
    <div className="undo-toast-stack">
      {ids.map((id) => (
        <div key={id} className="undo-toast">
          <span>Note deleted</span>
          <button type="button" onClick={() => undoDelete(id)}>
            Undo
          </button>
        </div>
      ))}
    </div>
  );
}
