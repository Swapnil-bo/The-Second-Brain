# Description: ChromaDB CRUD layer managing all three collections — knowledge_chunks,
# knowledge_entities, and knowledge_relationships. Handles initialization, upserts,
# queries, deletes, and full-collection retrieval for graph rebuilds.

import json
import hashlib
from datetime import datetime, timezone
from typing import Optional

import chromadb
from chromadb.config import Settings as ChromaSettings

from config import (
    CHROMA_PERSIST_DIR,
    CHUNKS_COLLECTION,
    ENTITIES_COLLECTION,
    RELATIONSHIPS_COLLECTION,
)
from services.embedder import embed_texts, embed_single

# --- Client + Collections (module-level singletons) ---

_client: Optional[chromadb.ClientAPI] = None
_chunks_col: Optional[chromadb.Collection] = None
_entities_col: Optional[chromadb.Collection] = None
_relationships_col: Optional[chromadb.Collection] = None


def initialize_collections() -> None:
    """Create or open all three ChromaDB collections. Called once from main.py startup."""
    global _client, _chunks_col, _entities_col, _relationships_col

    _client = chromadb.PersistentClient(
        path=CHROMA_PERSIST_DIR,
        settings=ChromaSettings(anonymized_telemetry=False),
    )
    _chunks_col = _client.get_or_create_collection(name=CHUNKS_COLLECTION)
    _entities_col = _client.get_or_create_collection(name=ENTITIES_COLLECTION)
    _relationships_col = _client.get_or_create_collection(name=RELATIONSHIPS_COLLECTION)


def _require_init() -> None:
    if _chunks_col is None:
        raise RuntimeError("ChromaDB not initialized — call initialize_collections() first")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _entity_id(name: str) -> str:
    normalized = name.strip().title()
    return "entity_" + hashlib.sha256(normalized.encode()).hexdigest()[:16]


def _relationship_id(from_entity: str, rel_type: str, to_entity: str) -> str:
    key = f"{from_entity.strip().title()}|{rel_type}|{to_entity.strip().title()}"
    return "rel_" + hashlib.sha256(key.encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------
# Chunks
# ---------------------------------------------------------------------------

def store_chunks(
    chunks: list[str],
    source_id: str,
    source_name: str,
    source_type: str,
) -> int:
    """Embed and store text chunks. Returns the number of chunks stored."""
    _require_init()
    if not chunks:
        return 0

    embeddings = embed_texts(chunks)
    now = datetime.now(timezone.utc).isoformat()

    ids = [f"chunk_{source_id}_{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "source_id": source_id,
            "source_name": source_name,
            "source_type": source_type,
            "chunk_index": i,
            "total_chunks": len(chunks),
            "ingested_at": now,
            "token_count": len(chunk.split()),
        }
        for i, chunk in enumerate(chunks)
    ]

    _chunks_col.upsert(ids=ids, embeddings=embeddings, documents=chunks, metadatas=metadatas)
    return len(chunks)


def query_chunks(query: str, top_k: int = 5) -> dict:
    """Semantic search over knowledge_chunks. Returns ids, documents, metadatas, distances."""
    _require_init()
    embedding = embed_single(query)
    results = _chunks_col.query(query_embeddings=[embedding], n_results=top_k)
    return results


def delete_chunks_by_source(source_id: str) -> None:
    """Remove all chunks belonging to a given source."""
    _require_init()
    existing = _chunks_col.get(where={"source_id": source_id})
    if existing["ids"]:
        _chunks_col.delete(ids=existing["ids"])


# ---------------------------------------------------------------------------
# Entities
# ---------------------------------------------------------------------------

def upsert_entity(
    name: str,
    entity_type: str,
    description: str,
    confidence: float,
    source_id: str,
) -> str:
    """Upsert an entity. Merges source_ids and increments occurrence_count on duplicates."""
    _require_init()
    eid = _entity_id(name)
    normalized_name = name.strip().title()
    now = datetime.now(timezone.utc).isoformat()

    existing = _entities_col.get(ids=[eid])
    if existing["ids"]:
        meta = existing["metadatas"][0]
        prev_sources = json.loads(meta.get("source_ids", "[]"))
        if source_id not in prev_sources:
            prev_sources.append(source_id)
        occurrence = meta.get("occurrence_count", 1) + 1
        confidence = max(confidence, meta.get("confidence", 0.0))
        description = description or existing["documents"][0]
        created_at = meta.get("created_at", now)
    else:
        prev_sources = [source_id]
        occurrence = 1
        created_at = now

    embedding = embed_single(f"{normalized_name}: {description}")

    _entities_col.upsert(
        ids=[eid],
        embeddings=[embedding],
        documents=[description],
        metadatas=[
            {
                "name": normalized_name,
                "type": entity_type.upper(),
                "confidence": confidence,
                "source_ids": json.dumps(prev_sources),
                "occurrence_count": occurrence,
                "created_at": created_at,
                "updated_at": now,
            }
        ],
    )
    return eid


def get_all_entities(limit: int = 1000) -> dict:
    """Retrieve all entities (paginated). Returns ChromaDB get() result dict."""
    _require_init()
    return _entities_col.get(limit=limit)


def delete_entities_by_source(source_id: str) -> list[str]:
    """Remove entities that ONLY belong to this source. Returns deleted entity names."""
    _require_init()
    all_ents = _entities_col.get()
    to_delete: list[str] = []
    to_update: list[tuple[str, dict, str]] = []

    for i, eid in enumerate(all_ents["ids"]):
        meta = all_ents["metadatas"][i]
        sources = json.loads(meta.get("source_ids", "[]"))
        if source_id in sources:
            sources.remove(source_id)
            if not sources:
                to_delete.append(eid)
            else:
                meta["source_ids"] = json.dumps(sources)
                meta["occurrence_count"] = max(1, meta.get("occurrence_count", 1) - 1)
                to_update.append((eid, meta, all_ents["documents"][i]))

    deleted_names = []
    if to_delete:
        for eid in to_delete:
            idx = all_ents["ids"].index(eid)
            deleted_names.append(all_ents["metadatas"][idx].get("name", ""))
        _entities_col.delete(ids=to_delete)

    for eid, meta, doc in to_update:
        _entities_col.update(ids=[eid], metadatas=[meta])

    return deleted_names


def search_entities(query: str, top_k: int = 5) -> dict:
    """Semantic search over knowledge_entities."""
    _require_init()
    embedding = embed_single(query)
    return _entities_col.query(query_embeddings=[embedding], n_results=top_k)


# ---------------------------------------------------------------------------
# Relationships
# ---------------------------------------------------------------------------

def upsert_relationship(
    from_entity: str,
    to_entity: str,
    relationship_type: str,
    description: str,
    confidence: float,
    source_id: str,
) -> str:
    """Persist a relationship edge in ChromaDB. Merges source_ids on duplicates."""
    _require_init()
    rid = _relationship_id(from_entity, relationship_type, to_entity)
    from_norm = from_entity.strip().title()
    to_norm = to_entity.strip().title()
    now = datetime.now(timezone.utc).isoformat()

    existing = _relationships_col.get(ids=[rid])
    if existing["ids"]:
        meta = existing["metadatas"][0]
        prev_sources = json.loads(meta.get("source_ids", "[]"))
        if source_id not in prev_sources:
            prev_sources.append(source_id)
        confidence = max(confidence, meta.get("confidence", 0.0))
    else:
        prev_sources = [source_id]

    doc_text = f"{from_norm} → {relationship_type} → {to_norm}: {description}"
    embedding = embed_single(doc_text)

    _relationships_col.upsert(
        ids=[rid],
        embeddings=[embedding],
        documents=[doc_text],
        metadatas=[
            {
                "from_entity": from_norm,
                "to_entity": to_norm,
                "relationship_type": relationship_type.upper(),
                "description": description,
                "confidence": confidence,
                "source_ids": json.dumps(prev_sources),
                "created_at": existing["metadatas"][0].get("created_at", now) if existing["ids"] else now,
            }
        ],
    )
    return rid


def get_all_relationships(limit: int = 5000) -> dict:
    """Retrieve all relationships (paginated). Returns ChromaDB get() result dict."""
    _require_init()
    return _relationships_col.get(limit=limit)


def delete_relationships_by_source(source_id: str) -> int:
    """Remove relationships that ONLY belong to this source. Returns count deleted."""
    _require_init()
    all_rels = _relationships_col.get()
    to_delete: list[str] = []
    to_update: list[tuple[str, dict]] = []

    for i, rid in enumerate(all_rels["ids"]):
        meta = all_rels["metadatas"][i]
        sources = json.loads(meta.get("source_ids", "[]"))
        if source_id in sources:
            sources.remove(source_id)
            if not sources:
                to_delete.append(rid)
            else:
                meta["source_ids"] = json.dumps(sources)
                to_update.append((rid, meta))

    if to_delete:
        _relationships_col.delete(ids=to_delete)

    for rid, meta in to_update:
        _relationships_col.update(ids=[rid], metadatas=[meta])

    return len(to_delete)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

def get_collection_counts() -> dict:
    """Return item counts for all three collections."""
    _require_init()
    return {
        "chunks": _chunks_col.count(),
        "entities": _entities_col.count(),
        "relationships": _relationships_col.count(),
    }
