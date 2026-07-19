import json
import os

import anthropic

from schemas import TIER_CONSTRAINTS, Tier

MODEL = "claude-sonnet-4-6"

# Four tier-specific system prompts, built from a shared template so the
# numeric ranges below always match TIER_CONSTRAINTS in schemas.py, but each
# rendered prompt is a distinct string tailored to that tier's scale and
# character — never shipped to the client.
_TIER_FLAVOR: dict[Tier, str] = {
    "town": (
        "an intimate market town or regional hub, with a simple economy and "
        "informal governance (a single leader, council, or elder)"
    ),
    "city": (
        "a regional capital or major trade center, with a complex, layered "
        "economy and multiple named administrative or guild roles"
    ),
    "county-seat": (
        "an administrative capital for a county, with an established history, "
        "visible military or civic infrastructure, and formal governance"
    ),
    "provincial-capital": (
        "a kingdom or region's major city, with extensive infrastructure, "
        "multiple distinct districts, and a deep bureaucracy or noble hierarchy"
    ),
}


def _build_system_prompt(tier: Tier) -> str:
    bounds = TIER_CONSTRAINTS[tier]
    pop_min, pop_max = bounds["population"]
    loc_min, loc_max = bounds["locations"]
    res_min, res_max = bounds["residents"]
    flavor = _TIER_FLAVOR[tier]

    return f"""You design fictional settlements for a tabletop RPG map app. This settlement is {flavor}. Given a short concept, output ONLY one JSON object, no prose, no markdown fences, matching exactly this shape:
{{"name":string,"subtitle":string,"overview":string (2-3 sentences, evoking a settlement of roughly {pop_min}-{pop_max} inhabitants),
"population":integer (a specific plausible population between {pop_min} and {pop_max}),
"landmark":{{"name":string,"description":string (1-2 sentences)}},
"riverName":string or null,"riverDesc":string or null (1 sentence),
"forestDesc":string or null (1 sentence, describes whatever borders the settlement — forest, dunes, ice, etc.),
"locations":[{loc_min} to {loc_max} objects: {{"name":string,"ring":"inner" or "outer","category": one of "dwelling","water","nature","defense","agriculture","burial","gate","dock","ritual","description":string (under 18 words)}}],
"residents":[{res_min} to {res_max} objects: {{"name":string,"role":string,"bio":string (under 15 words)}}],
"economy":string (1 sentence),"customs":[3 short strings],"hooks":[3 short strings],"dangers":string (1 sentence),"quote":string (a short inscription-style line)}}
Pick categories that genuinely match each location's function. Keep every string terse. Split locations roughly evenly between "inner" and "outer" rings."""


TIER_PROMPTS: dict[Tier, str] = {tier: _build_system_prompt(tier) for tier in TIER_CONSTRAINTS}

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _client


def generate_settlement_json(concept: str, tier: Tier) -> dict:
    """Calls Claude with the tier-specific system prompt and returns the
    parsed (but not yet schema-validated) JSON dict."""
    response = _get_client().messages.create(
        model=MODEL,
        max_tokens=4000,
        system=TIER_PROMPTS[tier],
        messages=[{"role": "user", "content": concept}],
    )
    text = "".join(block.text for block in response.content if block.type == "text")
    cleaned = text.replace("```json", "").replace("```", "").strip()
    return json.loads(cleaned)
