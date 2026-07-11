from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.generate_town import router as generate_town_router

app = FastAPI(title="Town Weaver API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

app.include_router(generate_town_router)


@app.get("/")
def root():
    return {"status": "ok"}
