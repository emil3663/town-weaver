from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.generate_settlement import router as generate_settlement_router

app = FastAPI(title="Town Weaver API")

# Locked to the GitHub Pages origin per ARCHITECTURE.md Section 9 — not a
# wildcard. Note this means the client won't be able to reach the deployed
# backend when opened locally via file:// (that Origin is "null", not this
# value); local development against a deployed backend needs a temporary
# origin addition here, not a wildcard reintroduction.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://emil3663.github.io"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

app.include_router(generate_settlement_router)


@app.get("/")
def root():
    return {"status": "ok"}
