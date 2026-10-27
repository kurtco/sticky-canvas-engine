interface TrashZoneProps {
  trashRef: React.RefObject<HTMLDivElement | null>;
}

// just a styled div — useDragNote does the actual overlap check against its rect.
export function TrashZone({ trashRef }: TrashZoneProps) {
  return (
    <div ref={trashRef} className="trash-zone" aria-label="Drop a note here to delete it">
      🗑 Drop to delete
    </div>
  );
}
