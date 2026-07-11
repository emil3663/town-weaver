import json
import os

import anthropic

SYSTEM_PROMPT = """You design fictional settlements for a tabletop RPG map app. Given a short concept, output ONLY one JSON object, no prose, no markdown fences, matching exactly this shape:
{"name":string,"subtitle":string,"overview":string (2-3 sentences),
"landmark":{"name":string,"description":string (1-2 sentences)},
"riverName":string or null,"riverDesc":string or null (1 sentence),
"forestDesc":string or null (1 sentence, describes whatever borders the settlement — forest, dunes, ice, etc.),
"locations":[6 to 10 objects: {"name":string,"ring":"inner" or "outer","category": one of "dwelling","water","nature","defense","agriculture","burial","gate","dock","ritual","description":string (under 18 words)}],
"residents":[3 to 4 objects: {"name":string,"role":string,"bio":string (under 15 words)}],
"economy":string (1 sentence),"customs":[3 short strings],"hooks":[3 short strings],"dangers":string (1 sentence),"quote":string (a short inscription-style line)}
Pick categories that genuinely match each location's function. Keep every string terse. Split locations roughly evenly between "inner" and "outer" rings."""

MODEL = "claude-sonnet-4-6"

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _client


def generate_town_json(concept: str) -> dict:
    """Calls Claude and returns the parsed (but not yet schema-validated) JSON dict."""
    response = _get_client().messages.create(
        model=MODEL,
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": concept}],
    )
    text = "".join(block.text for block in response.content if block.type == "text")
    cleaned = text.replace("```json", "").replace("```", "").strip()
    return json.loads(cleaned)
