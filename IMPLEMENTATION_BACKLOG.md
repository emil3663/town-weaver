# Town Weaver Implementation Backlog

Prefix: `TW-`

## Phase 0 — Repository and environment foundation

### TW-001 - Scaffold repository structure per ARCHITECTURE.md

- **Phase:** 0
- **Priority:** P0
- **Suggested labels:** `setup`, `infra`
- **Problem it solves:** Nothing else can start until the repo exists with the agreed folder layout — client, server, and docs need a home before any code is written.
- **Scope:**
  - Create `client/`, `server/`, and doc files per `ARCHITECTURE.md` Section 7.
  - Add `LICENSE` (MIT), `README.md` with a short project description.
  - Port the prototype's `index.html`/inline JS into `client/index.html` + `client/app.js` + `client/style.css`, split apart but behaviorally unchanged.
- **Deliverables:**
  - Initialized public repo, `town-weaver`, with the agreed structure.
  - Working prototype behavior reproduced in the new file layout (still calling Anthropic directly at this point — that changes in Phase 1).
- **Acceptance criteria:**
  - Repo is public on GitHub under MIT license.
  - Opening `client/index.html` locally reproduces the prototype's generate/reset/click behavior exactly.
- **Dependencies:** None.

### TW-002 - Stand up Firestore project and initial security rules

- **Phase:** 0
- **Priority:** P1
- **Suggested labels:** `infra`, `firestore`
- **Problem it solves:** Both the rate-limit counter (Phase 2) and the future sync collection need a real Firestore project to exist first.
- **Scope:**
  - Create the Firebase project.
  - Add `firebase-config.example.js` with placeholder values (per the local-first-with-optional-sync pattern).
  - Write security rules restricting per-user documents to their authenticated owner, even though nothing uses them yet.
- **Deliverables:**
  - Firestore project, reachable by both server (admin SDK) and future client (config-gated).
  - `firestore.rules` file committed to the repo.
- **Acceptance criteria:**
  - Rules deny cross-user reads/writes when tested against two different simulated auth identities.
  - `firebase-config.example.js` contains only placeholder values, never real credentials.
- **Dependencies:** TW-001.

### TW-003 - Stand up Render.com deployment target

- **Phase:** 0
- **Priority:** P1
- **Suggested labels:** `infra`, `deployment`
- **Problem it solves:** The backend needs somewhere to actually run before Phase 1 can be tested end to end.
- **Scope:**
  - Create the Render.com service pointed at `server/`.
  - Configure environment variables (placeholders at this stage): Anthropic API key, Firestore admin credentials.
- **Deliverables:**
  - A deployed (even if not yet functional) Render service with a stable URL.
- **Acceptance criteria:**
  - Hitting the Render URL returns a response (even a placeholder "not implemented" is fine at this stage).
- **Dependencies:** TW-001.

## Phase 1 — Backend proxy and core generation flow

### TW-101 - Build FastAPI backend with /api/generate-settlement (tier-aware)

- **Phase:** 1
- **Priority:** P0
- **Suggested labels:** `backend`, `feature`
- **Problem it solves:** This is the core structural fix versus the prototype — the client can no longer hold the Anthropic API key, so the backend needs to exist and do the actual Claude call. Additionally, settlement generation must be tier-aware: towns, cities, county seats, and provincial capitals have fundamentally different scales and structures.
- **Scope:**
  - Create four tier-specific system prompts (server-side): one for towns (~500–2,000 pop, 6–10 locations), one for cities (~3,000–8,000 pop, 10–15 locations), one for county seats (~8,000–15,000 pop, 12–18 locations), one for provincial capitals (~15,000–40,000 pop, 15–25 locations).
  - Implement `POST /api/generate-settlement`, accepting `{ concept: string, tier: "town" | "city" | "county-seat" | "provincial-capital" }`.
  - Route the request to the appropriate tier-specific prompt based on the tier parameter.
  - Return a `Settlement` object with the tier, a population figure that scales to the tier, and locations/residents counts that match the tier.
  - Read the Anthropic API key from environment, never from client input.
- **Deliverables:**
  - Working FastAPI route that calls Claude with a tier-aware system prompt and returns `Settlement`-shaped JSON.
- **Acceptance criteria:**
  - Calling the route with a concept and tier=town returns a settlement with ~500–2,000 population and 6–10 locations.
  - Calling the route with the same concept and tier=provincial-capital returns a settlement with ~15,000–40,000 population and 15–25 locations.
  - The Anthropic API key does not appear anywhere in client-shipped code.
- **Dependencies:** TW-001.

### TW-102 - Server-side response validation (tier-aware)

- **Phase:** 1
- **Priority:** P0
- **Suggested labels:** `backend`, `reliability`
- **Problem it solves:** The prototype trusts `JSON.parse` blindly on Claude's output; a real backend needs to catch malformed responses before they reach the client. Additionally, tier-aware generation means validation must check that location and resident counts match the tier constraints.
- **Scope:**
  - Validate the parsed JSON against the `Settlement` schema (required fields present, `tier` is a valid tier, `locations[].category` is one of the allowed values, population is in the expected range for the tier, location count is within tier bounds).
  - Return a clear 5xx error with a message if validation fails, rather than forwarding malformed data.
- **Deliverables:**
  - A schema validation function used by `/api/generate-settlement` (and reused by `/api/regenerate-location` in Phase 3).
- **Acceptance criteria:**
  - A deliberately malformed mock Claude response is rejected with a clear error, not forwarded to the client.
  - A response with the right schema but invalid tier (e.g., tier="unknown") is rejected.
  - A town-tier response with 25 locations (when town tier expects 6–10) is flagged and rejected.
- **Dependencies:** TW-101.

### TW-103 - Add settlement tier selector to the client UI

- **Phase:** 1
- **Priority:** P0
- **Suggested labels:** `client`, `feature`
- **Problem it solves:** Users need to specify what kind of settlement they're generating (town, city, county seat, or provincial capital) so the backend can scale the response appropriately. Without tier selection, generation defaults to one size.
- **Scope:**
  - Add a dropdown/radio selector to the generator UI before the "Generate settlement" button, with four options: Town, City, County Seat, Provincial Capital.
  - Include a brief description under each option (e.g., "Town (~500–2,000 inhabitants, market town or regional hub)").
  - Default to "Town" for first-time users.
- **Deliverables:**
  - Updated `client/index.html` and `client/app.js` with tier selector.
- **Acceptance criteria:**
  - A user can select a tier before generating.
  - The selected tier is visible and changeable before hitting Generate.
- **Dependencies:** TW-001.

### TW-103b - Migrate client to call the backend's /api/generate-settlement

- **Phase:** 1
- **Priority:** P0
- **Suggested labels:** `client`, `feature`
- **Problem it solves:** The whole point of Phase 1 — the client stops holding/calling with an API key at all. The client must now send both the concept and the selected tier to the backend.
- **Scope:**
  - Replace the prototype's direct `fetch("https://api.anthropic.com/...")` call with a call to the backend's `/api/generate-settlement`.
  - Capture the selected tier from TW-103's selector and include it in the request: `{ concept, tier }`.
  - Keep the existing `renderMap`/`renderDoc` pipeline unchanged — only the data source and request shape change.
- **Deliverables:**
  - Updated `client/app.js` pointing at the backend's `/api/generate-settlement` with tier parameter.
- **Acceptance criteria:**
  - Selecting tier=town and generating produces a settlement with 6–10 locations and ~500–2,000 population.
  - Selecting tier=provincial-capital and generating produces a settlement with 15–25 locations and ~15,000–40,000 population.
- **Dependencies:** TW-101, TW-103.

### TW-104 - Deploy and connect end to end

- **Phase:** 1
- **Priority:** P0
- **Suggested labels:** `infra`, `deployment`
- **Problem it solves:** Phase 1 isn't actually done until it works as a deployed app, not just locally.
- **Scope:**
  - Deploy the finished backend to the Render service from TW-003.
  - Point the deployed client at the live backend URL.
  - Configure GitHub Pages to serve the client.
- **Deliverables:**
  - A publicly reachable version of the app that generates settlements end to end, with tier selection working.
- **Acceptance criteria:**
  - Visiting the deployed client URL, selecting tier=town, and generating a settlement works without any local setup.
  - Selecting tier=provincial-capital and generating produces a visibly larger settlement (more locations, more residents).
  - Tier selection persists across browser refreshes (stored in localStorage via TW-201 when it ships).
- **Dependencies:** TW-101, TW-102, TW-103b, TW-003.

## Phase 2 — Persistence and rate limiting

### TW-201 - localStorage save/load with versioned schema

- **Phase:** 2
- **Priority:** P0
- **Suggested labels:** `client`, `feature`, `data`
- **Problem it solves:** Right now a generated town disappears the moment you regenerate or close the tab. This is the v1 saving mechanism, and it needs to work with no account.
- **Scope:**
  - Save the current town to `localStorage` on generation and on edit.
  - Load the last-saved town on page load, falling back to the Thornwick default if nothing is saved.
  - Add a schema version field so future changes to the `Town` shape don't break existing saved data.
- **Deliverables:**
  - Versioned `localStorage` read/write functions in `client/app.js`.
- **Acceptance criteria:**
  - Refreshing the page after generating a town restores that same town, not the Thornwick default.
  - A deliberately old-shaped saved record still loads without crashing the app.
- **Dependencies:** TW-103.

### TW-202 - Firestore-backed generation counter and rate limit

- **Phase:** 2
- **Priority:** P0
- **Suggested labels:** `backend`, `firestore`, `reliability`
- **Problem it solves:** Every generation call costs real money against the Anthropic account; this needs a cap before the app is meaningfully public.
- **Scope:**
  - Backend increments a Firestore counter document on every successful `/api/generate-town` and (later) `/api/regenerate-location` call, using admin credentials.
  - Backend checks the counter against a daily cap before calling Claude, returning 429 if exceeded.
- **Deliverables:**
  - `firestore_client.py` counter logic, wired into both generation routes.
- **Acceptance criteria:**
  - Exceeding the daily cap in a test environment returns a 429 with a clear error message, and does not call Claude.
- **Dependencies:** TW-002, TW-101.

### TW-203 - Scaffold dormant Firestore sync collection and rules

- **Phase:** 2
- **Priority:** P2
- **Suggested labels:** `client`, `firestore`, `future-proofing`
- **Problem it solves:** Sign-in is a fast-follow, not v1 — but wiring the sync layer now means it can be switched on later without revisiting the storage design.
- **Scope:**
  - Add the config-gated Firebase initialization pattern to the client (checks whether `firebase-config.js` has real values; sync UI stays hidden if not).
  - Confirm the per-user security rules from TW-002 cover the actual document shape saved in TW-201.
- **Deliverables:**
  - Sync-capable but currently-inactive Firestore client code.
- **Acceptance criteria:**
  - With `firebase-config.js` left as placeholders, the app behaves identically to TW-201 — no errors, no visible sync UI.
- **Dependencies:** TW-002, TW-201.

## Phase 3 — Location editing

### TW-301 - Build /api/regenerate-location endpoint

- **Phase:** 3
- **Priority:** P0
- **Suggested labels:** `backend`, `feature`
- **Problem it solves:** v1 scope explicitly includes editing, not just one-shot generation — this is the endpoint that makes that possible.
- **Scope:**
  - Add `Location.id` to the data model (client and server).
  - Implement `POST /api/regenerate-location`, accepting the current town plus a target `locationId`, returning a single replacement `Location`.
  - Reuse the TW-102 validation logic against the single-location shape.
- **Deliverables:**
  - Working endpoint, covered by the same rate-limit check as TW-202.
- **Acceptance criteria:**
  - Calling the endpoint with a valid town and locationId returns a differently-worded location with the same `id` and a valid `category`.
- **Dependencies:** TW-102, TW-202.

### TW-302 - Add "regenerate this location" action to the client

- **Phase:** 3
- **Priority:** P1
- **Suggested labels:** `client`, `feature`
- **Problem it solves:** The backend capability from TW-301 needs a way for a user to actually trigger it.
- **Scope:**
  - Add a button/action in the info panel (shown when a location is selected) to request regeneration of just that location.
  - Show a loading/error state consistent with the existing `genStatus` pattern.
- **Deliverables:**
  - Updated info panel UI in `client/app.js` / `client/index.html`.
- **Acceptance criteria:**
  - Clicking a location and choosing to regenerate it shows a loading state, then updates that location's icon/label/description without affecting any other location.
- **Dependencies:** TW-301.

### TW-303 - Merge regenerated location into saved town state

- **Phase:** 3
- **Priority:** P1
- **Suggested labels:** `client`, `data`
- **Problem it solves:** A regenerated location needs to persist, not just update the current render — otherwise refreshing the page loses the edit.
- **Scope:**
  - Merge the returned `Location` into the current town object by matching `id`.
  - Re-save the updated town to `localStorage` (via TW-201's save function).
- **Deliverables:**
  - Merge logic in `client/app.js`.
- **Acceptance criteria:**
  - After regenerating a location and refreshing the page, the regenerated version persists (not the original).
- **Dependencies:** TW-302, TW-201.

## Recommended Execution Order

1. TW-001
2. TW-002
3. TW-003
4. TW-101
5. TW-102
6. TW-103 (add tier selector UI)
7. TW-103b (connect client to backend with tier parameter)
8. TW-104
9. TW-201
10. TW-202
11. TW-203
12. TW-301
13. TW-302
14. TW-303

## Suggested Milestone Gates

### Gate A - Backend live with tier-aware generation (end of Phase 1)
- Generating a settlement in the deployed client works end to end via the Render-hosted backend.
- Tier selection is visible and functional; selecting different tiers produces visibly different settlements (varying location counts, population, and scope).
- No client code contains or calls the Anthropic API key directly.

### Gate B - Persistence and safety (end of Phase 2)
- A generated town survives a page refresh.
- The daily generation cap is enforced and tested.

### Gate C - Editing (end of Phase 3)
- A single location can be regenerated without disturbing the rest of the town, and the edit survives a refresh.
