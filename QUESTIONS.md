# Town Weaver — Resolved Decision Log

Companion to `ARCHITECTURE.md`. This was the open-questions doc during planning; every item below is now resolved. Kept as a record of *why*, since the reasoning matters more than the answer once implementation starts.

## Backend

1. **Language and framework?** → **Python / FastAPI.** Reversed the initial lean toward Node (which would have matched the other repos) once two future directions were confirmed: painted-map generation and hand-drawn map digitization. Both are computer-vision-heavy, and that ecosystem is overwhelmingly Python. Starting in Python now avoids a rewrite or an awkward two-language split later.

2. **Hosting?** → **Render.com.** Free tier, no card required, runs Python natively. Tradeoff accepted: the service sleeps after ~15 min idle, adding a cold-start delay to the first request after a lull. Revisit (e.g. Google Cloud Run) if that becomes a real problem.

3. **Rate limiting?** → **Firestore-backed counter, written server-side.** Since Firestore is in v1 regardless of sign-in status, the backend increments a counter document on every generation/regeneration call using its own admin credentials — no user account involved, no separate Redis/Upstash needed.

## Persistence

4. **Do towns need to be saved in v1?** → **Yes.**

5. **Firestore, or something else?** → **Firestore.**

6. **Is sign-in in scope for v1?** → **No — fast-follow.** Resolution: `localStorage` is the save mechanism for every v1 user, no account needed. Firestore itself (admin-side counter, security rules, sync collection) is built and tested in v1; the sign-in UI that makes per-user sync reachable ships later as a fast-follow, at which point sync switches on without needing the storage layer revisited.

## Product scope

7. **Editing after generation, or one-shot only?** → **Editing.** v1 supports regenerating a single location in place, not just generating a whole new town. This is why the data model gained `Location.id` and the backend gained a second endpoint (`/api/regenerate-location`) beyond the original single-route design.

8. **Zoom and pan for v1?** → **No — later phase.** Fixed view, matching the prototype.

## Repository

9. **Repo name and visibility?** → **`town-weaver`** (kept as a placeholder — can rename later with no architectural impact), **Public.**

10. **License?** → **MIT.** Standard choice for a public portfolio-style repo: anyone can reuse the code, including commercially, as long as attribution is kept. Considered and set aside: no license (unusual for something intentionally made public), Apache 2.0 (its extra patent clause isn't relevant at this scale).

## Confirmed assumptions

11. No mobile wrap in v1. No painted-art rendering in v1 (confirmed future direction, not current scope). No hand-drawn map digitization in v1 (same). No multiplayer.
