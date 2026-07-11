# Town Weaver — Architecture Document (Phase 0: Foundation)

Date: 2026-07-10
Scope: Establish the technical foundation for an AI-assisted interactive town-map generator, evolved from the Thornwick prototype.
Status: Approved and locked. All decisions below are confirmed; see `QUESTIONS.md` for the resolved decision log.

## 1. Problem and goals

The prototype proved the core idea: a text concept goes in, a structured interactive town map comes out, rendered as clickable vector icons on a fixed hex-and-road layout. This phase turns that prototype into a real, shippable app.

Goals for this phase:
- Define the system's components and how they talk to each other.
- Define the data model for a generated town, so client, backend, and storage agree on shape.
- Resolve the structural problem the prototype sidesteps: the Anthropic API key.
- Produce a repository structure so implementation can start immediately.

## 2. Non-goals (v1)

- Painted/textured map art (an Inkarnate-style look). The map stays vector-illustrated SVG, matching the prototype. Chosen as a future direction — see Section 10.
- Hand-drawn map digitization (photo/scan → digital map). Future direction — see Section 10.
- Zoom and pan on the map. Fixed view, matching the prototype. Deferred to a later phase.
- Sign-in and cross-device sync UI. Firestore is wired up in v1 (Section 4.3), but the sign-in flow itself is a fast-follow, not v1.
- Multiplayer or shared/collaborative editing of a single town.
- Native mobile wrap (Capacitor). Web-first; wrapping is a later phase, same pattern as the other repos.
- Monetization or billing for generations.

## 3. System architecture

The prototype has two components (browser, Anthropic API). The real app needs three — a backend sits between them:

```
┌────────────┐   generate/edit request   ┌───────────────┐   Messages API   ┌────────────┐
│   Client    │ ─────────────────────────▶│ Backend proxy │─────────────────▶│ Claude API │
│ (browser)   │◀───────────────────────── │ (FastAPI)     │◀───────────────── │ (Sonnet)   │
└────────────┘     town/location JSON     └───────────────┘   generated JSON  └────────────┘
      │                                          │
      │ localStorage                             │ generation counter (rate limit)
      ▼                                          ▼
┌────────────┐                            ┌───────────────┐
│  Browser    │                           │  Firestore     │
│  (always on)│                           │ (server-side)  │
└────────────┘                            └───────────────┘
```

- The client never talks to Claude directly. It only ever calls its own backend.
- The backend is the only component that holds the Anthropic API key.
- Saved towns live in `localStorage` first — this works for every user immediately, no account required.
- Firestore serves two purposes in v1: (a) a server-side generation counter for rate limiting, written directly by the backend using admin credentials, independent of any user account; (b) the future per-user sync target, fully wired and tested now, but not reachable by end users until sign-in ships in a later phase.

## 4. Components

### 4.1 Client
- Vanilla JS with inline SVG, directly descended from the prototype's rendering engine (`renderMap`, `renderDoc`, the icon functions). This code does not need to change to move from prototype to real app.
- Calls the backend instead of `api.anthropic.com` directly, for both full-town generation and single-location regeneration.
- Local-first: a generated town lives in `localStorage` the moment it's created, and reloads on return visits. No account is required to use the app at all.

### 4.2 Backend (new — doesn't exist in the prototype)
- **Framework: Python / FastAPI.** Chosen over Node (despite the other repos being JS) specifically because two confirmed future directions — painted-map generation and hand-drawn-map digitization — are computer-vision-heavy work (OpenCV, Pillow, and the broader ML/CV ecosystem are overwhelmingly Python-first). Starting in Python now avoids a language split or rewrite when that work begins.
- **Hosting: Render.com**, free tier, no card required. Tradeoff: the service sleeps after ~15 minutes idle, adding a 30-60s cold start to the first request after a lull. Acceptable for the current traffic level; revisit if it becomes annoying.
- Two responsibilities:
  1. `POST /api/generate-town` — accept a concept string, call Claude with the system prompt and schema, validate and return the resulting `Town` JSON.
  2. `POST /api/regenerate-location` — accept the current town context plus a target location, call Claude for a replacement of just that one location, validate and return it.
- Holds the Anthropic API key as a server-side environment variable — never shipped to the client, never committed.
- Validates the shape of Claude's response before returning it. The prototype trusts `JSON.parse` blindly — this backend does not.
- Holds Firestore admin credentials and increments the generation counter on every successful call to either endpoint, checking the daily cap before calling Claude.

### 4.3 Persistence (Firestore + localStorage)
- `localStorage` is the source of truth for every user, signed in or not — this is what makes "saving is in v1" true without needing sign-in to also be in v1.
- Firestore is set up now for two things: the rate-limit counter (active immediately, no auth needed), and the per-user sync collection (built and security-rule-tested now, but the sign-in UI that would make it reachable ships later).
- Firestore security rules restrict per-user documents to their authenticated owner — written and tested in this phase even though unreachable by real users until sign-in exists.

## 5. Data model

```ts
type Town = {
  name: string;
  subtitle: string;
  overview: string;
  landmark: { name: string; description: string };
  riverName: string | null;
  riverDesc: string | null;
  forestDesc: string | null;
  locations: Location[];       // 6–10, category-tagged
  residents: Resident[];       // 3–4
  economy: string;
  customs: string[];           // 3 items
  hooks: string[];             // 3 items
  dangers: string;
  quote: string;
};

type Location = {
  id: string;                  // stable id, added in v1 so a single location can be targeted for regeneration
  name: string;
  ring: "inner" | "outer";
  category: "dwelling" | "water" | "nature" | "defense" | "agriculture" | "burial" | "gate" | "dock" | "ritual";
  description: string;
};

type Resident = { name: string; role: string; bio: string };
```

Note: `Location.id` is new versus the prototype — needed so `/api/regenerate-location` can identify which one to replace without relying on array position.

## 6. API design

`POST /api/generate-town`
- Request: `{ "concept": string }`
- Response (200): a `Town` object
- Response (429): `{ "error": "Daily generation limit reached" }` — rate limit hit
- Response (4xx/5xx): `{ "error": string }`

`POST /api/regenerate-location`
- Request: `{ "town": Town, "locationId": string }`
- Response (200): a single updated `Location` object, same `id`, to be merged into the client's current town state
- Response (429/4xx/5xx): same error shape as above

The backend owns the system prompts for both routes (server-side, not shipped in client JS), so they can be tuned without a client redeploy.

## 7. Repository structure

```
town-weaver/
├── README.md
├── LICENSE                     (MIT)
├── ARCHITECTURE.md             (this document)
├── QUESTIONS.md                (resolved decision log)
├── PROJECT_PLAN.md
├── IMPLEMENTATION_BACKLOG.md
├── TEST_PLAN.md                (added alongside first implementation phase)
├── client/
│   ├── index.html
│   ├── app.js                  (renderMap / renderDoc / icons — from the prototype)
│   └── style.css
├── server/
│   ├── main.py                 (FastAPI app entry point)
│   ├── routes/
│   │   ├── generate_town.py
│   │   └── regenerate_location.py
│   ├── firestore_client.py     (admin SDK init, counter logic)
│   ├── requirements.txt
│   └── .env.example
└── firebase-config.example.js  (client-side config, for the future sign-in phase)
```

## 8. Security

- Anthropic API key: server-side environment variable only. Never in client code, never committed.
- Firestore admin credentials: server-side only, same handling as the Anthropic key.
- Rate limiting: Firestore-backed counter, checked server-side before every Claude call, on both endpoints.
- Firestore security rules: per-user, owner-only read/write for the future sync collection — written and tested in this phase even though not yet reachable by end users.

## 9. Repository settings

- **Name:** `town-weaver` (placeholder — can be renamed later without affecting anything in this document)
- **Visibility:** Public
- **License:** MIT

## 10. Deferred to later phases

- Sign-in and cross-device sync UI (Firestore plumbing is ready; this activates it).
- Zoom and pan on the map.
- Capacitor wrap for app-store distribution.
- Painted-art rendering mode — confirmed future direction; this is why the backend is Python.
- Hand-drawn map digitization (photo/scan → interactive digital map) — confirmed future direction, same reasoning.
- Shareable or public town links.

---
See `QUESTIONS.md` for the resolved decision log behind this document.
