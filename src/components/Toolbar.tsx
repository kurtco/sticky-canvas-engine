import { useNoteStore } from "../store/useNoteStore";
import { MIN_NOTE_SIZE } from "../domain/types";

const CASCADE_STEP = 28; // e.g. the 2nd click places its note 28px right and 28px down from the 1st.
const CASCADE_WRAP = 10; // e.g. the 11th click resets to the same spot as the 1st, restarting the staircase.

export function Toolbar() {
  const addNote = useNoteStore((s) => s.addNote);
  const noteCount = useNoteStore((s) => s.order.length);

  const onAddNote = () => {
    // e.g. without this offset, every click from the button would stack a new blank note on the last one.
    const offset = (noteCount % CASCADE_WRAP) * CASCADE_STEP;
    addNote(
      { x: 40 + offset, y: 40 + offset },
      { width: MIN_NOTE_SIZE.width + 40, height: MIN_NOTE_SIZE.height + 40 },
    );
  };

  return (
    <div className="toolbar">
      <button type="button" onClick={onAddNote}>
        + New note
      </button>
      <span className="toolbar__hint">or click-drag on empty canvas to draw one</span>
    </div>
  );
}
