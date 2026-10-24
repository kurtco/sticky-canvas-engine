interface TrashZoneProps {
  trashRef: React.RefObject<HTMLDivElement | null>;
}

// A static drop target; useDragNote checks the dragged note's pointer
// position against this element's rect on pointerup.
export function TrashZone({ trashRef }: TrashZoneProps) {
  return (
    <div ref={trashRef} className="trash-zone" aria-label="Drop a note here to delete it">
      🗑 Drop to delete
    </div>
  );
}
