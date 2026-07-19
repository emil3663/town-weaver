# Town Weaver Implementation Backlog (Ollama-based, v1)

Prefix: `TW-`

This is a simplified backlog compared to the Anthropic API version — no backend, no Render, no Firestore. Everything is client-side.

## Phase 0 — Repository and environment foundation

### TW-001 - Scaffold repository structure per ARCHITECTURE.md

- **Phase:** 0
- **Priority:** P0
- **Suggested labels:** `setup`, `infra`
- **Problem it solves:** Nothing else can start until the repo exists with the agreed folder layout.
- **Scope:**
  - Create `client/` folder and doc files per `ARCHITECTURE.md` Section 7.
  - Add `LICENSE` (MIT), `README.md` with a short project description, `HELP.md` (already written).
  - Port the prototype's `index.html`/inline JS into `client/index.html` + `client/app.js` + `client/style.css`, split apart but behaviorally unchanged.
- **Deliverables:**
  - Initialized public repo, `town-weaver`, with the agreed structure.
  - Working prototype behavior reproduced in the new file layout.
- **Acceptance criteria:**
  - Repo is public on GitHub under MIT license.
  - Opening `client/index.html` locally reproduces the prototype's generate/reset/click behavior exactly.
- **Dependencies:** None.

### TW-002 - Enable GitHub Pages

- **Phase:** 0
- **Priority:** P0
- **Suggested labels:** `setup`, `deployment`
- **Problem it solves:** The app needs a URL where friends can access it.
- **Scope:**
  - Go to repo Settings → Pages → Deploy from branch.
  - Select `main` branch, folder `client/`.
- **Deliverables:**
  - GitHub Pages URL (e.g., `https://emil3663.github.io/town-weaver/`)
- **Acceptance criteria:**
  - The Pages URL is live and serves `client/index.html`.
- **Dependencies:** TW-001.

## Phase 1 — Ollama integration and tier-aware generation

### TW-101 - Add tier-aware Ollama prompts and model selection to client

- **Phase:** 1
- **Priority:** P0
- **Suggested labels:** `client`, `feature`
- **Problem it solves:** The client needs four tier-specific prompts (town, city, county seat, provincial capital) embedded in the code, ready to send to Ollama. These prompts must be explicit about JSON formatting since Ollama is less reliable than Claude at structured output.
- **Scope:**
  - Create four system prompts (one per tier), each with explicit JSON formatting requirements: "Output ONLY a valid JSON object, no markdown, no explanation. Never add backticks."
  - Each prompt includes tier-specific flavor text and population/location ranges.
  - Store prompts in `client/app.js` as a `TIER_PROMPTS` object.
- **Deliverables:**
  - Four tier-specific prompts, embedded in client code.
- **Acceptance criteria:**
  - Each prompt explicitly states JSON output requirements.
  - Prompts for different tiers are visibly different (town prompt suggests 6–10 locations; provincial capital suggests 15–25).
- **Dependencies:** TW-001.

### TW-102 - Add settings panel for Ollama URL and model configuration

- **Phase:** 1
- **Priority:** P0
- **Suggested labels:** `client`, `feature`
- **Problem it solves:** Users need to be able to point at a different Ollama instance (local default, or a friend's shared server) and change which model to use. A settings panel makes this discoverable and easy.
- **Scope:**
  - Add a ⚙ (settings) button in the client UI.
  - Settings panel shows:
    - Ollama URL field (defaults to `http://localhost:11434`)
    - Model name field (defaults to `mistral`)
    - "Test connection" button (makes a test request to Ollama, shows success/error)
    - "Save settings" button (stores to localStorage)
  - Settings persist across page refreshes.
- **Deliverables:**
  - Settings UI in `client/index.html` and `client/app.js`.
- **Acceptance criteria:**
  - User can open settings, change the Ollama URL, click "Test connection", and see whether Ollama responds.
  - User can change the model name and it persists.
- **Dependencies:** TW-001.

### TW-103 - Add settlement tier selector to the client UI

- **Phase:** 1
- **Priority:** P0
- **Suggested labels:** `client`, `feature`
- **Problem it solves:** Users need to specify what kind of settlement they're generating (town, city, county seat, or provincial capital) so the appropriate prompt is used.
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

### TW-104 - Connect client to Ollama with tier-aware generation

- **Phase:** 1
- **Priority:** P0
- **Suggested labels:** `client`, `feature`
- **Problem it solves:** The client must actually call Ollama with the tier-specific prompt and parse the settlement response.
- **Scope:**
  - Replace any prototype Anthropic API calls with calls to Ollama at `http://[ollama-url]/api/generate`.
  - Build request: `{ model: [model-name], prompt: [tier-prompt + concept], stream: false }`.
  - Parse the response: extract JSON from Ollama's text output.
  - Render the settlement using existing `renderMap` / `renderDoc` functions.
  - Show errors if Ollama is unreachable or returns invalid JSON.
- **Deliverables:**
  - Updated `client/app.js` with Ollama HTTP call and response parsing.
- **Acceptance criteria:**
  - Entering a concept, selecting a tier, and clicking "Generate settlement" calls Ollama and renders a settlement.
  - Tier=town produces ~6–10 locations; tier=provincial-capital produces ~15–25 locations.
  - If Ollama is unreachable, the app shows a clear error message.
- **Dependencies:** TW-101, TW-102, TW-103.

### TW-105 - Deploy to GitHub Pages and verify end-to-end

- **Phase:** 1
- **Priority:** P0
- **Suggested labels:** `infra`, `deployment`
- **Problem it solves:** Phase 1 isn't done until the live deployed app works end-to-end (with a real local Ollama instance).
- **Scope:**
  - Ensure `client/` folder is committed and pushed to `main`.
  - GitHub Pages is already set up from TW-002.
- **Deliverables:**
  - Live app accessible at the GitHub Pages URL.
- **Acceptance criteria:**
  - Visiting the Pages URL and generating a settlement works (assuming Ollama is running locally on the tester's machine).
  - Different tiers produce visibly different settlements.
- **Dependencies:** TW-002, TW-104.

## Phase 2 — Persistence and location editing

### TW-201 - localStorage save/load with versioned schema

- **Phase:** 2
- **Priority:** P0
- **Suggested labels:** `client`, `feature`, `data`
- **Problem it solves:** A generated settlement currently disappears if you refresh the page. Users should be able to come back to their settlements.
- **Scope:**
  - Save the current settlement to `localStorage` on generation and on edit (TW-302).
  - Load the last-saved settlement on page load, falling back to Thornwick default if nothing is saved.
  - Add a schema version field so future changes to the `Settlement` shape don't break existing saved data.
  - Add a "Save settlement" button so users can explicitly save (even though it auto-saves).
  - Add a "Clear saved data" button for users who want to start fresh.
- **Deliverables:**
  - Versioned `localStorage` read/write functions in `client/app.js`.
- **Acceptance criteria:**
  - Refreshing the page after generating a settlement restores that same settlement, not the default.
  - A deliberately old-shaped saved record still loads without crashing.
- **Dependencies:** TW-104.

### TW-202 - Add "regenerate this location" action to the client

- **Phase:** 2
- **Priority:** P1
- **Suggested labels:** `client`, `feature`
- **Problem it solves:** Users should be able to regenerate a single location in place, not just generate a whole new settlement.
- **Scope:**
  - When a location is selected, show a "Regenerate" button in the info panel.
  - Clicking it sends the current settlement + target location to Ollama, asking for a replacement of just that location.
  - Show a loading state while waiting for Ollama.
  - Merge the response back into the current settlement and re-render.
- **Deliverables:**
  - Updated info panel and Ollama integration in `client/app.js`.
- **Acceptance criteria:**
  - Clicking a location and choosing "Regenerate" updates that location's description/name without affecting other locations.
  - The regenerated location persists after a page refresh (via TW-201).
- **Dependencies:** TW-201.

## Phase 3 — Nice-to-haves (if time permits)

### TW-301 - Export settlement as JSON or text

- **Phase:** 3
- **Priority:** P2
- **Suggested labels:** `client`, `feature`
- **Problem it solves:** Users might want to save a settlement outside the app (for D&D campaigns, world-building documents, etc.).
- **Scope:**
  - Add an "Export" button to the UI.
  - User can download the settlement as `settlement.json` or `settlement.txt` (readable format).
- **Dependencies:** TW-201.

### TW-302 - Import a settlement from JSON

- **Phase:** 3
- **Priority:** P2
- **Suggested labels:** `client`, `feature`
- **Problem it solves:** Users who exported a settlement should be able to load it back in.
- **Scope:**
  - Add a "Load from file" button.
  - User selects a previously exported `.json` file.
  - Settlement is validated and loaded into the app.
- **Dependencies:** TW-301, TW-201.

## Recommended Execution Order

1. TW-001
2. TW-002
3. TW-101
4. TW-102
5. TW-103
6. TW-104
7. TW-105 (Gate A checkpoint)
8. TW-201
9. TW-202 (Gate B checkpoint after this one)
10. TW-301 (if time permits)
11. TW-302 (if time permits)

## Suggested Milestone Gates

### Gate A - Live on GitHub Pages with tier-aware generation (end of Phase 1)
- Visiting the GitHub Pages URL generates settlements end-to-end.
- Tier selection is visible and functional; different tiers produce different settlement scales.
- Settings panel allows pointing at a different Ollama URL for testing shared instances.

### Gate B - Persistence and location editing (end of Phase 2)
- Generated settlements persist across page refreshes.
- Users can regenerate a single location in place without regenerating the entire settlement.
