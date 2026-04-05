# Description: LLM-powered entity + relationship extraction using Groq (llama-3.1-8b-instant).
# Includes retry with exponential backoff, JSON repair, and graceful fallback to empty extraction.

import json
import asyncio
import logging
from typing import Optional

from groq import AsyncGroq, RateLimitError

from config import GROQ_API_KEY, GROQ_EXTRACTION_MODEL, EXTRACTION_TEMPERATURE, MAX_ENTITIES_PER_CHUNK

logger = logging.getLogger(__name__)

_groq_client: Optional[AsyncGroq] = None


def _get_client() -> AsyncGroq:
    global _groq_client
    if _groq_client is None:
        _groq_client = AsyncGroq(api_key=GROQ_API_KEY)
    return _groq_client


EXTRACTION_SYSTEM_PROMPT = """
You are a knowledge graph extraction engine. Your job is to extract structured entities and relationships from text.

ENTITY TYPES (use exactly these labels):
- CONCEPT: abstract ideas, theories, methodologies, techniques
- TECHNOLOGY: tools, frameworks, libraries, languages, models, systems
- PERSON: real people, researchers, authors, historical figures
- BOOK: books, papers, articles, courses, documentation
- ORGANIZATION: companies, universities, research labs, communities
- EVENT: conferences, historical events, milestones

RULES:
1. Extract only entities explicitly mentioned or strongly implied in the text
2. Relationships must be directional: from_entity → to_entity
3. Relationship types: USES, EXTENDS, REQUIRES, ENABLES, CONTRASTS, CREATED_BY, PART_OF, RELATED_TO, PRECEDED_BY
4. Assign confidence (0.0–1.0) based on how explicit the mention is
5. Normalize entity names: "transformers" and "transformer architecture" → "Transformer"
6. Maximum 20 entities and 30 relationships per chunk

RESPOND ONLY WITH VALID JSON. NO PREAMBLE. NO MARKDOWN FENCES.
Format:
{
  "entities": [
    {"name": "string", "type": "CONCEPT|TECHNOLOGY|PERSON|BOOK|ORGANIZATION|EVENT", "description": "one sentence", "confidence": 0.0-1.0}
  ],
  "relationships": [
    {"from": "entity name", "to": "entity name", "type": "RELATIONSHIP_TYPE", "description": "brief label", "confidence": 0.0-1.0}
  ]
}
"""


def _repair_json(raw: str) -> Optional[dict]:
    """Attempt to extract valid JSON from a possibly malformed LLM response."""
    # Try direct parse first
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Find first '{' and last '}' and re-parse that slice
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(raw[start : end + 1])
        except json.JSONDecodeError:
            pass

    return None


def _validate_extraction(data: dict) -> dict:
    """Ensure extraction result has the expected shape and enforce limits."""
    entities = data.get("entities", [])
    relationships = data.get("relationships", [])

    # Enforce max entities
    entities = entities[:MAX_ENTITIES_PER_CHUNK]

    # Validate entity fields
    valid_entities = []
    for e in entities:
        if isinstance(e, dict) and "name" in e and "type" in e:
            valid_entities.append({
                "name": str(e["name"]).strip(),
                "type": str(e.get("type", "CONCEPT")).upper(),
                "description": str(e.get("description", "")),
                "confidence": float(e.get("confidence", 0.5)),
            })

    # Validate relationship fields
    valid_relationships = []
    for r in relationships:
        if isinstance(r, dict) and "from" in r and "to" in r and "type" in r:
            valid_relationships.append({
                "from": str(r["from"]).strip(),
                "to": str(r["to"]).strip(),
                "type": str(r.get("type", "RELATED_TO")).upper(),
                "description": str(r.get("description", "")),
                "confidence": float(r.get("confidence", 0.5)),
            })

    return {"entities": valid_entities, "relationships": valid_relationships}


async def extract_entities_and_relationships(text: str, source_name: str) -> dict:
    """
    Extract entities and relationships from a text chunk via Groq LLM.

    Uses llama-3.1-8b-instant (NOT 70b) for cost and speed.
    Retry logic: up to 3 retries with exponential backoff on 429.
    Falls back to empty extraction on total failure — never raises.
    """
    client = _get_client()
    user_prompt = f"Source: {source_name}\n\nText:\n{text}"

    for attempt in range(4):  # 0, 1, 2, 3 = initial + 3 retries
        try:
            response = await client.chat.completions.create(
                model=GROQ_EXTRACTION_MODEL,
                messages=[
                    {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=EXTRACTION_TEMPERATURE,
                max_tokens=2048,
            )

            raw = response.choices[0].message.content or ""
            parsed = _repair_json(raw)

            if parsed is None:
                logger.warning("JSON repair failed for chunk from '%s' (attempt %d)", source_name, attempt)
                if attempt < 3:
                    await asyncio.sleep(min(60, 2 ** attempt))
                    continue
                return {"entities": [], "relationships": []}

            return _validate_extraction(parsed)

        except RateLimitError:
            wait_time = min(60, 2 ** attempt)
            logger.warning("Rate limited on extraction (attempt %d), waiting %ds", attempt, wait_time)
            await asyncio.sleep(wait_time)

        except Exception as e:
            logger.error("Extraction error for '%s' (attempt %d): %s", source_name, attempt, str(e))
            if attempt < 3:
                await asyncio.sleep(min(60, 2 ** attempt))
            else:
                return {"entities": [], "relationships": []}

    return {"entities": [], "relationships": []}
