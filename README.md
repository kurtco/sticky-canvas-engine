# Sticky Canvas Engine

A single-page sticky notes application built with React 19, TypeScript, and
Zustand. Notes can be created, moved, resized, recolored, edited, and deleted
by dragging them onto a trash zone.

## Architecture

The domain layer (`src/domain`) defines plain types and pure geometry
functions with zero framework dependencies. The Zustand store
(`src/store/useNoteStore.ts`) is the application core: it owns all note
state and mutations. Persistence is handled by Zustand's own `persist`
middleware, wrapping the store and backed by `localStorage` — on every
mutation it writes `notes`/`order`/`nextZIndex` synchronously, and on load
it rehydrates from whatever was last saved, so a reload (F5) restores the
board exactly as it was left. `pendingDeletes` is excluded from what gets
persisted (via `partialize`): it holds a live `timeoutId` for the undo
buffer, which is transient UI state, not something that should survive a
reload.

Drag, resize, and create-by-drag are deliberately **not** abstracted behind
a custom interface — that would be over-engineering for native DOM gestures. Instead,
each gesture lives in its own single-responsibility hook
(`useDragNote`, `useResizeNote`, `useCreateNoteByDrag`) that talks directly
to the DOM via refs and to the store via its actions. All three follow the
same shape for performance: cache bounding rects once on `pointerdown`,
mutate the DOM node's `transform`/`width`/`height` directly on
`pointermove` (zero `useState`, zero re-renders at 60fps+), and commit the
final value to the Zustand store only on `pointerup` (deferred sync). This
is why dragging a note never re-renders its siblings — the board subscribes
only to the `order` array of note IDs, and each `StickyNote` is wrapped in
`React.memo`, subscribing to its own note by ID in a `Record<string, Note>`
for O(1) reads/writes instead of scanning an array.

Note deletion is optimistic: dragging a note onto the trash zone removes it
from state immediately, but keeps it in a 5-second buffer (`pendingDeletes`)
so the `UndoToast` component can restore it — no blocking `confirm()`
dialog.

## Folder structure

```
src/
├── main.tsx                     Mounts the React root.
├── App.tsx                      Top-level component; renders Board.
├── index.css                    Global styles (layout, note colors, grid background).
│
├── domain/                      Framework-free core types and math. No React, no store.
│   ├── types.ts                   Note, Position, Size, NoteColor; MIN_NOTE_SIZE, NOTE_COLORS constants.
│   └── geometry.ts                clamp() and isPointInRect() — pure helpers used by the drag/resize/trash hooks.
│
├── store/                        The application core (Zustand).
│   └── useNoteStore.ts             Single source of truth: notes (Record<id, Note>), order (render order),
│                                    nextZIndex (monotonic stacking counter), pendingDeletes (undo buffer).
│                                    Wrapped in Zustand's persist middleware (localStorage, bonus III) —
│                                    notes/order/nextZIndex survive a reload; pendingDeletes is excluded.
│
├── hooks/                        One hook per gesture, single responsibility, DOM-ref-driven for 60fps.
│   ├── useDragNote.ts              Moving an existing note: pointer capture, transform-based move,
│   │                                clamping to board bounds, trash-zone drop detection.
│   ├── useResizeNote.ts            Resizing from the bottom-right handle: width/height mutation, min-size
│   │                                and board-bound clamping.
│   └── useCreateNoteByDrag.ts       Drawing a brand-new note by dragging on empty canvas (ghost rectangle
│                                     during the gesture, committed to the store on pointerup).
│
└── components/                   Presentation layer.
    ├── Board.tsx                   The canvas: owns boardRef/trashRef, renders notes from `order`,
    │                                wires up useCreateNoteByDrag.
    ├── StickyNote.tsx               A single note (React.memo'd): combines useDragNote + useResizeNote,
    │                                renders the drag handle, color swatches, textarea, and resize handle.
    ├── Toolbar.tsx                  Second note-creation path: a button that adds a note at a cascading
    │                                default position (bonus requirement: ≥2 ways to create a note).
    ├── TrashZone.tsx                 Static drop target used by useDragNote for delete-by-drag.
    └── UndoToast.tsx                 Renders one dismissible "Undo" toast per note in the pendingDeletes buffer.
```

## Running it

```bash
npm install
npm run dev      # starts Vite dev server
npm run build    # type-checks (tsc -b) and produces a production build in dist/
npm run preview  # serves the production build locally
npm run test     # runs the Vitest unit tests
npm run lint     # runs ESLint
```

Requires Node 18+. No environment variables or external services are
needed — notes are persisted to the browser's `localStorage`.
