import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError

from anthropic_client import generate_town_json
from schemas import GeneratedTown, Location, Town

router = APIRouter()


class GenerateTownRequest(BaseModel):
    concept: str


@router.post("/api/generate-town", response_model=Town)
def generate_town(request: GenerateTownRequest) -> Town:
    try:
        raw = generate_town_json(request.concept)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to reach Claude: {exc}") from exc

    try:
        generated = GeneratedTown.model_validate(raw)
    except ValidationError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Claude returned a town that doesn't match the expected shape: {exc}",
        ) from exc

    locations = [
        Location(id=str(uuid.uuid4()), **loc.model_dump())
        for loc in generated.locations
    ]
    return Town(**{**generated.model_dump(exclude={"locations"}), "locations": locations})
