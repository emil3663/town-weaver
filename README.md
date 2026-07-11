# Town Weaver

Town Weaver takes a short text concept and generates a fully-realized, interactive fantasy settlement — landmark, locations, residents, economy, plot hooks — rendered as a clickable vector map, powered by Claude.

It grew out of a single-file HTML prototype that called the Anthropic API directly from the browser. This repo turns that into a real app: a Python/FastAPI backend that holds the API key server-side, `localStorage`-based saving, and in-place editing of individual map locations.

See `PROJECT_PLAN.md` for the product vision and scope, `ARCHITECTURE.md` for the technical design, `QUESTIONS.md` for the reasoning behind each locked decision, and `IMPLEMENTATION_BACKLOG.md` for the ticket-by-ticket build order.

## Status

Early build-out, following the backlog in `IMPLEMENTATION_BACKLOG.md`.

## Local development

Open `client/index.html` directly in a browser. Until the Phase 1 backend migration lands, the client calls the Anthropic API directly and expects an API key to be wired in for generation to work.
