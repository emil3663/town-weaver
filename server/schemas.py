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


class GeneratedTown(BaseModel):
    """Validates Claude's raw JSON before the backend touches it."""

    name: str
    subtitle: str
    overview: str
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


class Town(BaseModel):
    """Final shape returned to the client — Location.id populated."""

    name: str
    subtitle: str
    overview: str
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
