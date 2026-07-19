# Town Weaver

Town Weaver takes a short text concept and generates a fully-realized, interactive fantasy settlement — landmark, locations, residents, economy, plot hooks — rendered as a clickable vector map, at whatever scale you choose (town through provincial capital).

It grew out of a single-file HTML prototype that called the Anthropic API directly from the browser. This version runs entirely client-side and free: the client calls a local (or friend-shared) [Ollama](https://ollama.ai) instance directly — no backend, no API key, no running costs.

See `ARCHITECTURE.md` for the technical design and `IMPLEMENTATION_BACKLOG.md` for the ticket-by-ticket build order. See `HELP.md` for setup instructions (installing Ollama, sharing an instance with friends). `QUESTIONS.md` and `PROJECT_PLAN.md` are kept as a historical record of the earlier Anthropic-API-backed design — see the `anthropic-backend` branch for that version.

## Status

Early build-out, following the backlog in `IMPLEMENTATION_BACKLOG.md`.

## Local development

1. Install [Ollama](https://ollama.ai) and run `ollama pull mistral`.
2. Open `client/index.html` directly in a browser. It calls `http://localhost:11434` by default — no build step, no server.

See `HELP.md` for full setup instructions, including pointing the app at a friend's shared Ollama instance.
