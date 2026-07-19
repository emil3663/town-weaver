from typing import Literal

from pydantic import BaseModel

Category = Literal[
    "dwelling",
    "water",
    "nature",
    "defense",
    "agriculture",
    "burial",
    "gate",
    "dock",
    "ritual",
]
Ring = Literal["inner", "outer"]
Tier = Literal["town", "city", "county-seat", "provincial-capital"]

# Population, location count, and resident count bounds per tier — enforced
# in validate_tier_bounds() below, not just documentation.
TIER_CONSTRAINTS: dict[Tier, dict[str, tuple[int, int]]] = {
    "town": {"population": (500, 2000), "locations": (6, 10), "residents": (3, 4)},
    "city": {"population": (3000, 8000), "locations": (10, 15), "residents": (6, 8)},
    "county-seat": {"population": (8000, 15000), "locations": (12, 18), "residents": (8, 12)},
    "provincial-capital": {"population": (15000, 40000), "locations": (15, 25), "residents": (12, 20)},
}


class Landmark(BaseModel):
    name: str
    description: str


class Resident(BaseModel):
    name: str
    role: str
    bio: str


class GeneratedLocation(BaseModel):
    """Shape Claude returns — no id yet, the backend assigns one."""

    name: str
    ring: Ring
    category: Category
    description: str


class Location(GeneratedLocation):
    """Shape returned to the client — id added so a single location can be
    targeted for regeneration without relying on array position."""

    id: str


class GeneratedSettlement(BaseModel):
    """Validates Claude's raw JSON before the backend touches it. No `tier`
    field — the backend already knows the tier from the request and sets it
    directly on the final Settlement, rather than trusting Claude to echo it
    back correctly."""

    name: str
    subtitle: str
    overview: str
    population: int
    landmark: Landmark
    riverName: str | None = None
    riverDesc: str | None = None
    forestDesc: str | None = None
    locations: list[GeneratedLocation]
    residents: list[Resident]
    economy: str
    customs: list[str]
    hooks: list[str]
    dangers: str
    quote: str


class Settlement(BaseModel):
    """Final shape returned to the client — tier set from the request,
    Location.id populated."""

    tier: Tier
    name: str
    subtitle: str
    overview: str
    population: int
    landmark: Landmark
    riverName: str | None = None
    riverDesc: str | None = None
    forestDesc: str | None = None
    locations: list[Location]
    residents: list[Resident]
    economy: str
    customs: list[str]
    hooks: list[str]
    dangers: str
    quote: str


def validate_tier_bounds(tier: Tier, generated: GeneratedSettlement) -> None:
    """Raises ValueError if population, location count, or resident count
    fall outside the requested tier's bounds — e.g. a town-tier response
    with 25 locations."""
    bounds = TIER_CONSTRAINTS[tier]
    pop_min, pop_max = bounds["population"]
    loc_min, loc_max = bounds["locations"]
    res_min, res_max = bounds["residents"]

    errors = []
    if not (pop_min <= generated.population <= pop_max):
        errors.append(
            f"population {generated.population} is outside the '{tier}' range {pop_min}-{pop_max}"
        )
    if not (loc_min <= len(generated.locations) <= loc_max):
        errors.append(
            f"{len(generated.locations)} locations is outside the '{tier}' range {loc_min}-{loc_max}"
        )
    if not (res_min <= len(generated.residents) <= res_max):
        errors.append(
            f"{len(generated.residents)} residents is outside the '{tier}' range {res_min}-{res_max}"
        )
    if errors:
        raise ValueError("; ".join(errors))
