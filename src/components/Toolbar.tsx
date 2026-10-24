import { useNoteStore } from "../store/useNoteStore";
import { MIN_NOTE_SIZE } from "../domain/types";

const CASCADE_STEP = 28; // Each time the user clicks the button, the new note appears exactly 28 pixels further to the right and 28 pixels further down than the previous one.
const CASCADE_WRAP = 10; // If the user creates more than 10, a second staircase begins, positioned perfectly on top of the first one.

// two ways to create sticks draging or clicking the button "New Note"
export function Toolbar() {
  const addNote = useNoteStore((s) => s.addNote);
  const noteCount = useNoteStore((s) => s.order.length);

  const onAddNote = () => {
    // Cascade each new note diagonally so repeated clicks don't stack
    // new blank notes exactly on top of existing ones.
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
