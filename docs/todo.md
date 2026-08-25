- [x] Add @unmount trigger
- [x] Replace the per-listener MutationObserver in listeners.js (one full-document subtree observer created per z-action/z-swap trigger) with a single shared observer keyed by a node→handler registry
- [x] Add test for unmount
- [x] Make sure that mount/unmount don't fire when moved to a different area of the DOM (as in with drag and drop like a kanban board)

## Hotwire feature parity (2026-08-01)

Gaps between Zjax and Hotwire (Turbo + Stimulus) for a Rails app to fully switch over.

1. Real-time server-push updates (Turbo Streams equivalent) — a transport-agnostic
   z-stream style API that applies server-sent DOM patches (append/prepend/replace/
   remove/update) over WebSocket or SSE. The client protocol can be backend-agnostic,
   but each backend needs its own adapter to actually publish patches.
2. **Rails ActionCable bridge for #1 — the deep, Rails-specific piece.** Turbo Streams'
   real-time mode rides on ActionCable pub/sub (Redis/Postgres adapter, broadcast
   helpers like `broadcasts_to`). Zjax has no server-side story at all yet; this
   likely means a companion Rails gem, not just JS, and is probably the single
   biggest lift on this list.
3. Turbo Frames-style scoped regions — a contained area where links/forms inside it
   navigate that region only (no extra targeting attributes needed), plus lazy-load
   when scrolled into view.
4. Stimulus-style reusable controllers — named, instantiable action modules with
   scoped targets and typed values, distributable as standalone npm packages,
   instead of today's global `zjax.actions` functions.
5. DOM morphing on swap (idiomorph-style patch instead of full replace) — preserves
   focus, scroll position, form input state, and in-flight media/CSS transitions
   across a z-swap update.
6. Form ergonomics — CSRF token auto-injection, method override (PATCH/PUT/DELETE),
   disable-while-submitting, redirect (303) handling, confirm-before-submit.
7. Rails integration gem — install generator, CSRF wiring, content-type negotiation
   for partial/stream responses. Overlaps with #2; probably one gem, not two.
8. Loading/progress affordances — top-of-page progress bar plus fetch/submit
   start/end events to hook spinners into.
9. Turbo Drive equivalent (full-page nav accelerator) — deprioritized. The "flash of
   white" problem is now solved natively by the cross-document View Transitions API.
   The one thing Drive still uniquely offers — literal continuity of a live
   `<audio>`/WebSocket/JS context across a real navigation — has no native browser
   fix short of Document Picture-in-Picture; revisit only if a real use case needs it.
