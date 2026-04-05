# Description: Gap detection engine — sends the full graph summary to Groq (llama-3.3-70b-versatile)
# to identify knowledge gaps and surprising connections. Includes a module-level hash cache
# to avoid burning free-tier quota on repeated calls.

import json
import hashlib
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

from groq import AsyncGroq, RateLimitError

from config import GROQ_API_KEY, GROQ_REASONING_MODEL, GAP_DETECTION_TEMPERATURE
from services import graph_service

logger = logging.getLogger(__name__)

_groq_client: Optional[AsyncGroq] = None

# --- Module-level cache ---
_gap_cache: dict = {
    "result": None,
    "graph_hash": None,
    "generated_at": None,
}


def _get_client() -> AsyncGroq:
    global _groq_client
    if _groq_client is None:
        _groq_client = AsyncGroq(api_key=GROQ_API_KEY)
    return _groq_client


GAP_DETECTION_SYSTEM_PROMPT = """
You are an intelligent learning advisor analyzing a user's personal knowledge graph.

You will receive:
1. A list of all entities the user has studied (with types and descriptions)
2. A list of relationships between those entities
3. The user's query (optional) — what they're trying to understand

Your job:
1. Identify 3–5 significant KNOWLEDGE GAPS — important concepts/technologies that are:
   - Closely related to what the user already knows
   - Conspicuously absent from their knowledge graph
   - Would meaningfully deepen their understanding if learned

2. For each gap, provide:
   - WHY it's missing (how it connects to what they know)
   - A 4-step learning path (concrete resources, not generic advice)
   - Estimated learning time

3. Identify 2–3 SURPRISING CONNECTIONS — relationships between things the user knows that they may not have noticed

RESPOND ONLY WITH VALID JSON. NO PREAMBLE. NO MARKDOWN FENCES.
Format:
{
  "gaps": [
    {
      "topic": "string",
      "type": "CONCEPT|TECHNOLOGY|PERSON|BOOK",
      "why_missing": "explanation of how it relates to existing knowledge",
      "connection_to_known": ["entity1", "entity2"],
      "learning_path": [
        {"step": 1, "action": "string", "resource": "string", "time": "string"}
      ],
      "total_time": "string",
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "surprising_connections": [
    {
      "entity_a": "string",
      "entity_b": "string",
      "connection": "explanation of the non-obvious link"
    }
  ]
}
"""


def _compute_graph_hash() -> str:
    """SHA-256 of sorted entity names + relationship IDs for cache invalidation."""
    snapshot = graph_service.get_full_snapshot()
    names = sorted(n["name"] for n in snapshot["nodes"])
    edge_ids = sorted(e["id"] for e in snapshot["edges"])
    key = json.dumps({"names": names, "edges": edge_ids}, sort_keys=True)
    return hashlib.sha256(key.encode()).hexdigest()


def invalidate_cache() -> None:
    """Force cache invalidation — called after source deletion."""
    _gap_cache["graph_hash"] = None
    _gap_cache["result"] = None
    _gap_cache["generated_at"] = None


async def detect_gaps(focus_query: Optional[str] = None) -> dict:
    """
    Run gap detection over the full knowledge graph.

    1. Compute current graph hash
    2. Return cached result if hash matches and no focus_query
    3. Otherwise call llama-3.3-70b-versatile and cache the result
    """
    current_hash = _compute_graph_hash()

    # Cache hit — return immediately if graph unchanged and no specific query
    if (
        focus_query is None
        and _gap_cache["graph_hash"] == current_hash
        and _gap_cache["result"] is not None
    ):
        return {**_gap_cache["result"], "cache_hit": True}

    # Build prompt
    graph_summary = graph_service.get_graph_summary_for_llm()

    if graph_service.get_node_count() == 0:
        return {
            "gaps": [],
            "surprising_connections": [],
            "graph_summary": graph_summary,
            "analyzed_at": datetime.now(timezone.utc).isoformat(),
            "cache_hit": False,
        }

    user_message = f"KNOWLEDGE GRAPH:\n{graph_summary}"
    if focus_query:
        user_message += f"\n\nUSER FOCUS QUERY: {focus_query}"

    client = _get_client()

    for attempt in range(3):
        try:
            response = await client.chat.completions.create(
                model=GROQ_REASONING_MODEL,
                messages=[
                    {"role": "system", "content": GAP_DETECTION_SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=GAP_DETECTION_TEMPERATURE,
                max_tokens=3000,
            )

            raw = response.choices[0].message.content or ""
            parsed = _repair_json(raw)

            if parsed is None:
                logger.warning("Gap detection JSON parse failed (attempt %d)", attempt)
                if attempt < 2:
                    await asyncio.sleep(min(60, 2 ** attempt))
                    continue
                parsed = {"gaps": [], "surprising_connections": []}

            result = {
                "gaps": parsed.get("gaps", []),
                "surprising_connections": parsed.get("surprising_connections", []),
                "graph_summary": graph_summary,
                "analyzed_at": datetime.now(timezone.utc).isoformat(),
                "cache_hit": False,
            }

            # Update cache (only for non-focused queries)
            if focus_query is None:
                _gap_cache["result"] = result
                _gap_cache["graph_hash"] = current_hash
                _gap_cache["generated_at"] = datetime.now(timezone.utc).isoformat()

            return result

        except RateLimitError:
            wait_time = min(60, 2 ** attempt)
            logger.warning("Rate limited on gap detection (attempt %d), waiting %ds", attempt, wait_time)
            await asyncio.sleep(wait_time)

        except Exception as e:
            logger.error("Gap detection error (attempt %d): %s", attempt, str(e))
            if attempt < 2:
                await asyncio.sleep(min(60, 2 ** attempt))

    # Total failure
    return {
        "gaps": [],
        "surprising_connections": [],
        "graph_summary": graph_summary,
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
        "cache_hit": False,
    }


def _repair_json(raw: str) -> Optional[dict]:
    """Attempt to extract valid JSON from a possibly malformed LLM response."""
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(raw[start : end + 1])
        except json.JSONDecodeError:
            pass

    return None
