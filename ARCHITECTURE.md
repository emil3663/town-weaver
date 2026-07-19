# Town Weaver — Architecture Document (v1: Ollama-based, zero cost)

Date: 2026-07-10
Scope: Ship Town Weaver as a personal/friend-accessible app using local open-source models via Ollama. No running costs, no API keys, no backend infrastructure.
Status: Approved and locked.

## 1. Problem and goals

The prototype proved the core idea: a text concept goes in, a structured interactive settlement map comes out, rendered as clickable vector icons on a fixed hex-and-road layout. This phase turns that prototype into a real, deployable app that works entirely locally or with a friend's shared Ollama instance — zero running costs.

Goals for this phase:
- Define the system's components and how they talk to each other.
- Use Ollama + open-source models (Mistral, Llama) instead of Claude API — no API costs.
- Allow users to run locally by default, with optional configuration for a shared Ollama instance.
- Ship on GitHub Pages (free, static hosting).
- Produce a detailed setup guide so users can get started in minutes.

## 2. Non-goals (v1)

- Backend infrastructure (Render, FastAPI, proxies, rate limiting). All computation is local or user-configured.
- Paid tier / freemium billing. That's a future direction once costs aren't a blocker.
- Sign-in, cloud sync, or persistent storage beyond localStorage.
- Painted/textured map art. Vector-illustrated, like the prototype.
- Zoom and pan on the map.
- Native mobile wrap (Capacitor).

## 3. System architecture

Simple: client calls Ollama directly (local, or at a user-specified URL):

```
┌────────────┐   generate/edit request (HTTP)   ┌──────────────┐
│   Client    │ ────────────────────────────────▶│   Ollama      │
│ (browser)   │◀─────────────────────────────────│  (local or    │
└────────────┘     settlement/location JSON      │   remote)     │
      │                                          └──────────────┘
      │ localStorage
      ▼
┌────────────┐
│  Browser    │
│  (always on)│
└────────────┘
```

- Client calls Ollama at `http://localhost:11434` by default (if Ollama is running locally).
- Client includes a settings panel to point at a different Ollama URL (e.g., a friend's shared instance).
- No credentials, no API keys, no backend.
- Settlement data is saved to `localStorage` immediately; survives browser refresh.

## 4. Components

### 4.1 Client
- Vanilla JS with inline SVG, directly descended from the prototype.
- Calls `POST http://localhost:11434/api/generate` (or user-configured URL) instead of Anthropic.
- Includes settings panel where users can:
  - Change Ollama URL (defaults to `localhost:11434`)
  - Change model name (defaults to `mistral` or `llama2`)
  - See connection status and error messages
- Saves settlements to `localStorage` with versioned schema.

### 4.2 Ollama
- User installs Ollama locally (https://ollama.ai)
- User runs `ollama pull mistral` (or `llama2`, etc.) — once, takes a few minutes
- `ollama serve` runs in the background, listening on `http://localhost:11434`
- No authentication, no setup beyond installation

### 4.3 Optional shared instance
- If a friend wants to run a shared Ollama server:
  - Run Ollama on their machine (or cheap VPS like Linode $5/mo)
  - Configure Ollama to bind to `0.0.0.0:11434` instead of just localhost
  - Share the URL with you (e.g., `http://friend-server:11434`)
  - You paste that URL into Town Weaver's settings
- Detailed instructions in `HELP.md`

## 5. Data model

Same `Settlement` type as before (with `tier`, `locations`, `residents`, etc.). Unchanged from the other version.

## 6. API design

**Town Weaver calls Ollama's standard completion API:**

`POST http://[ollama-url]/api/generate`
- Request: `{ "model": "mistral", "prompt": "...", "stream": false }`
- Response: `{ "response": "JSON-formatted settlement object" }`

Ollama's API is simple — it takes a text prompt and returns generated text. Town Weaver constructs four tier-specific prompts (embedded in the client, not secret), and parses Ollama's text response as JSON.

## 7. Repository structure

```
town-weaver/
├── README.md
├── LICENSE                     (MIT)
├── ARCHITECTURE.md             (this document)
├── HELP.md                     (detailed setup guide for local & shared Ollama)
├── QUESTIONS.md                (resolved decision log)
├── PROJECT_PLAN.md
├── IMPLEMENTATION_BACKLOG.md
├── client/
│   ├── index.html
│   ├── app.js                  (renderMap / renderDoc / Ollama integration)
│   └── style.css
└── (no server/ folder — computation is entirely client-side or on user's Ollama)
```

## 8. System prompts (client-side, tier-aware)

Four prompts, embedded in `client/app.js`, one per tier. Each includes explicit JSON formatting requirements:

```
"Output ONLY a valid JSON object, no markdown, no explanation. 
Return exactly: { tier, name, subtitle, population, overview, landmark, 
riverName, riverDesc, forestDesc, locations, residents, economy, customs, 
hooks, dangers, quote }. Never add backticks or markdown."
```

Ollama tends to hallucinate extra text, so prompts are more explicit than Claude's would be.

## 9. Security and privacy

- No API keys, no credentials anywhere.
- All data stays local (`localStorage`, or on the user's machine running Ollama).
- If a friend runs a shared Ollama instance, the URL is unencrypted HTTP — this is fine for a personal setup (not for production), and friends must trust each other.
- Ollama has no authentication layer by default — if running on a public IP, protect it via firewall or VPN.

## 10. Deployment

- **Client:** GitHub Pages, `client/` folder, zero cost.
- **Generation:** User installs and runs Ollama locally. Zero cost. Instructions in `HELP.md`.
- **Optional shared:** Friend's machine or cheap VPS (e.g., Linode $5/mo). User's choice.

## 11. Deferred to later phases

- Swap to Claude API (once costs aren't a concern, this is a drop-in replacement).
- Rate limiting / monetization / freemium.
- Cloud sync or persistent cross-device storage.
- Painted-art rendering.
- Native mobile wrap.

---
See `HELP.md` for detailed setup instructions.
See `QUESTIONS.md` for the resolved decision log behind this document.
