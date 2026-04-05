# Description: Orchestrates the full 10-step ingestion pipeline — parse, chunk, embed, store
# vectors, extract entities/relationships via LLM, persist to ChromaDB, rebuild networkx graph.
# Maintains a global queue_status dict for frontend polling.

import asyncio
import logging
import uuid
from datetime import datetime, timezone

from langchain_text_splitters import RecursiveCharacterTextSplitter

from config import MAX_CHUNK_SIZE, CHUNK_OVERLAP, RATE_LIMIT_DELAY
from services import chroma_service, graph_service, extractor
from services.gap_detector import invalidate_cache as invalidate_gap_cache

logger = logging.getLogger(__name__)

# --- Global ingestion queue status ---
_queue_status: dict[str, dict] = {}

STAGES = [
    "parsing",
    "chunking",
    "embedding",
    "extracting",
    "storing_vectors",
    "storing_entities",
    "storing_relationships",
    "rebuilding_graph",
    "done",
]


def _new_status(source_id: str, source_name: str, source_type: str) -> dict:
    stages = [
        {"stage": s, "status": "pending", "detail": None}
        for s in STAGES
    ]
    return {
        "source_id": source_id,
        "source_name": source_name,
        "source_type": source_type,
        "current_stage": "parsing",
        "stages": stages,
        "entity_count": 0,
        "relationship_count": 0,
        "error": None,
    }


def _update_stage(source_id: str, stage: str, status: str = "running", detail: str | None = None) -> None:
    if source_id not in _queue_status:
        return
    entry = _queue_status[source_id]
    entry["current_stage"] = stage
    for s in entry["stages"]:
        if s["stage"] == stage:
            s["status"] = status
            s["detail"] = detail
            break


def _mark_done_up_to(source_id: str, stage: str) -> None:
    """Mark all stages up to (but not including) the given stage as done."""
    if source_id not in _queue_status:
        return
    for s in _queue_status[source_id]["stages"]:
        if s["stage"] == stage:
            break
        s["status"] = "done"


def get_queue_status() -> list[dict]:
    """Return all queue items for the frontend."""
    return list(_queue_status.values())


def get_item_status(source_id: str) -> dict | None:
    return _queue_status.get(source_id)


def remove_from_queue(source_id: str) -> None:
    _queue_status.pop(source_id, None)


async def ingest_document(
    content: str,
    source_name: str,
    source_type: str,
    source_id: str | None = None,
) -> dict:
    """
    Run the full 10-step ingestion pipeline.

    Args:
        content: Raw text content (already extracted from PDF/URL/paste).
        source_name: Display name of the source.
        source_type: One of "pdf", "markdown", "text", "url".
        source_id: Optional pre-generated UUID; created if not given.

    Returns:
        IngestResult-compatible dict with counts and status.
    """
    if source_id is None:
        source_id = uuid.uuid4().hex

    _queue_status[source_id] = _new_status(source_id, source_name, source_type)
    total_entities = 0
    total_relationships = 0

    try:
        # ----- STEP 1: PARSE (already done for text; this stage is a pass-through) -----
        _update_stage(source_id, "parsing", "running")
        if not content.strip():
            raise ValueError("Empty content — nothing to ingest")
        _update_stage(source_id, "parsing", "done")

        # ----- STEP 2: CHUNK -----
        _mark_done_up_to(source_id, "chunking")
        _update_stage(source_id, "chunking", "running")

        if len(content.split()) < 80:
            # Very short input — treat as single chunk, skip splitting
            chunks = [content.strip()]
        else:
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=MAX_CHUNK_SIZE,
                chunk_overlap=CHUNK_OVERLAP,
                length_function=lambda t: len(t.split()),
                separators=["\n\n", "\n", ". ", " ", ""],
            )
            chunks = splitter.split_text(content)

        _update_stage(source_id, "chunking", "done", detail=f"{len(chunks)} chunks")

        # ----- STEP 3 + 5: EMBED + STORE VECTORS -----
        _mark_done_up_to(source_id, "embedding")
        _update_stage(source_id, "embedding", "running")
        # Embedding happens inside chroma_service.store_chunks
        _update_stage(source_id, "embedding", "done")

        _mark_done_up_to(source_id, "storing_vectors")
        _update_stage(source_id, "storing_vectors", "running")
        chroma_service.store_chunks(chunks, source_id, source_name, source_type)
        _update_stage(source_id, "storing_vectors", "done")

        # ----- STEP 5: EXTRACT entities + relationships per chunk -----
        _mark_done_up_to(source_id, "extracting")
        _update_stage(source_id, "extracting", "running")

        all_entities: list[dict] = []
        all_relationships: list[dict] = []

        for i, chunk in enumerate(chunks):
            result = await extractor.extract_entities_and_relationships(chunk, source_name)
            all_entities.extend(result.get("entities", []))
            all_relationships.extend(result.get("relationships", []))

            _update_stage(
                source_id, "extracting", "running",
                detail=f"Chunk {i + 1}/{len(chunks)} — {len(result.get('entities', []))} entities",
            )

            # Rate limit between LLM calls
            if i < len(chunks) - 1:
                await asyncio.sleep(RATE_LIMIT_DELAY)

        _update_stage(source_id, "extracting", "done")

        # ----- STEP 6 + 7: STORE ENTITIES -----
        _mark_done_up_to(source_id, "storing_entities")
        _update_stage(source_id, "storing_entities", "running")

        for entity in all_entities:
            chroma_service.upsert_entity(
                name=entity["name"],
                entity_type=entity.get("type", "CONCEPT"),
                description=entity.get("description", ""),
                confidence=entity.get("confidence", 0.5),
                source_id=source_id,
            )
            total_entities += 1

        _update_stage(source_id, "storing_entities", "done", detail=f"{total_entities} entities")

        # ----- STEP 8: STORE RELATIONSHIPS -----
        _mark_done_up_to(source_id, "storing_relationships")
        _update_stage(source_id, "storing_relationships", "running")

        for rel in all_relationships:
            chroma_service.upsert_relationship(
                from_entity=rel["from"],
                to_entity=rel["to"],
                relationship_type=rel.get("type", "RELATED_TO"),
                description=rel.get("description", ""),
                confidence=rel.get("confidence", 0.5),
                source_id=source_id,
            )
            total_relationships += 1

        _update_stage(source_id, "storing_relationships", "done", detail=f"{total_relationships} relationships")

        # ----- STEP 9: REBUILD NETWORKX GRAPH -----
        _mark_done_up_to(source_id, "rebuilding_graph")
        _update_stage(source_id, "rebuilding_graph", "running")
        await graph_service.rebuild_from_chroma()
        _update_stage(source_id, "rebuilding_graph", "done")

        # Invalidate gap detection cache (graph hash changed)
        invalidate_gap_cache()

        # ----- STEP 10: DONE -----
        _update_stage(source_id, "done", "done")
        _queue_status[source_id]["entity_count"] = total_entities
        _queue_status[source_id]["relationship_count"] = total_relationships

        return {
            "source_id": source_id,
            "source_name": source_name,
            "source_type": source_type,
            "chunk_count": len(chunks),
            "entity_count": total_entities,
            "relationship_count": total_relationships,
            "status": "done",
            "error": None,
        }

    except Exception as e:
        logger.error("Ingestion failed for '%s': %s", source_name, str(e))
        _queue_status[source_id]["error"] = str(e)
        _update_stage(source_id, _queue_status[source_id]["current_stage"], "failed", detail=str(e))

        return {
            "source_id": source_id,
            "source_name": source_name,
            "source_type": source_type,
            "chunk_count": 0,
            "entity_count": total_entities,
            "relationship_count": total_relationships,
            "status": "failed",
            "error": str(e),
        }


async def delete_source(source_id: str) -> dict:
    """
    Remove a source and all its entities, relationships, and chunks.
    Rebuilds the graph and invalidates the gap cache afterward.
    """
    chroma_service.delete_chunks_by_source(source_id)
    deleted_names = chroma_service.delete_entities_by_source(source_id)
    deleted_rels = chroma_service.delete_relationships_by_source(source_id)

    await graph_service.rebuild_from_chroma()
    invalidate_gap_cache()
    remove_from_queue(source_id)

    return {
        "source_id": source_id,
        "deleted_entities": deleted_names,
        "deleted_relationship_count": deleted_rels,
    }
