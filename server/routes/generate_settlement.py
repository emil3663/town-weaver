import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError

from anthropic_client import generate_settlement_json
from schemas import GeneratedSettlement, Location, Settlement, Tier, validate_tier_bounds

router = APIRouter()


class GenerateSettlementRequest(BaseModel):
    concept: str
    tier: Tier


@router.post("/api/generate-settlement", response_model=Settlement)
def generate_settlement(request: GenerateSettlementRequest) -> Settlement:
    try:
        raw = generate_settlement_json(request.concept, request.tier)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to reach Claude: {exc}") from exc

    try:
        generated = GeneratedSettlement.model_validate(raw)
        validate_tier_bounds(request.tier, generated)
    except (ValidationError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Claude returned a settlement that doesn't match the expected "
                f"shape for tier '{request.tier}': {exc}"
            ),
        ) from exc

    locations = [
        Location(id=str(uuid.uuid4()), **loc.model_dump())
        for loc in generated.locations
    ]
    return Settlement(
        tier=request.tier,
        **generated.model_dump(exclude={"locations"}),
        locations=locations,
    )
