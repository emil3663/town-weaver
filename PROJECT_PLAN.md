# Town Weaver Project Plan

**Version:** 1.0
**Date:** 2026-07-10
**Status:** Decision locked for v1 execution

## Product Vision

Town Weaver takes a short text concept and generates a fully-realized, interactive fantasy settlement — landmark, locations, residents, economy, plot hooks — rendered as a clickable vector map, powered by Claude. It grew out of the Thornwick prototype, which proved the generate-and-render loop works; this plan turns that into a real, deployable app with its own backend, persistence, and editing.

## Current Functionality (Baseline)

- A working single-file HTML prototype (`town-weaver` prototype) that calls the Anthropic API directly from the browser, renders a hex-and-road vector map with category-based icons (dwelling, water, nature, defense, agriculture, burial, gate, dock, ritual), and displays full town documentation in collapsible sections.
- No backend, no persistence, no editing — every regeneration replaces the current view entirely.

## Scope (v1)

### In scope
1. A Python/FastAPI backend that proxies generation requests, holding the Anthropic API key server-side.
2. A second endpoint that regenerates a single location in place, without regenerating the whole town.
3. `localStorage`-based saving, available to every user immediately, no account required.
4. Firestore wired up for two purposes: a server-side rate-limit counter (active immediately), and a per-user sync collection (built and security-tested now, activated later).
5. Public GitHub repository under an MIT license.

### Out of scope
- Sign-in and cross-device sync UI (Firestore plumbing is ready; the sign-in flow itself is a fast-follow).
- Zoom and pan on the map.
- Painted-art rendering mode (confirmed future direction).
- Hand-drawn map digitization (confirmed future direction).
- Native mobile wrap, multiplayer, monetization.

## Development Phases

### Phase 0 — Repository and environment foundation
- Scaffold the repo per `ARCHITECTURE.md`.
- Stand up the Firestore project and initial security rules.
- Stand up the Render.com deployment target.

### Phase 1 — Backend proxy and core generation flow
- Build the FastAPI backend and its `/api/generate-town` route.
- Add server-side validation of Claude's JSON response.
- Migrate the client from calling Anthropic directly to calling the backend.
- Deploy and connect end to end.

### Phase 2 — Persistence and rate limiting
- Add `localStorage` save/load with a versioned schema.
- Add the Firestore-backed generation counter and rate-limit check.
- Scaffold the (currently dormant) Firestore sync collection and security rules.

### Phase 3 — Location editing
- Add the `/api/regenerate-location` endpoint.
- Add a "regenerate this location" action to the client's info panel.
- Merge a regenerated location back into local town state without disturbing the rest of the town.

### Phase 4 — Not yet scoped (fast-follow candidates)
- Sign-in and cross-device sync UI.
- Zoom and pan.
- Painted-art rendering mode.
- Hand-drawn map digitization.

Phase 4 items are named here so nobody assumes they're missing by accident, but they aren't broken into tickets yet — that happens when one of them is actually picked up next.
