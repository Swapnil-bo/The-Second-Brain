# Description: Graph router — full graph snapshot, stats, single entity neighborhood,
# and semantic entity search endpoints.

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from models.schemas import GraphSnapshot, GraphSearchRequest
from services import graph_service, chroma_service

router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.get("", response_model=GraphSnapshot)
async def get_full_graph():
    """Return the full graph snapshot (all nodes + edges) for React Flow rendering."""
    snapshot = graph_service.get_full_snapshot()
    stats = graph_service.get_stats()

    return GraphSnapshot(
        nodes=snapshot["nodes"],
        edges=snapshot["edges"],
        stats=stats,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/stats")
async def get_graph_stats():
    """Entity counts by type, total nodes/edges, average confidence."""
    return graph_service.get_stats()


@router.get("/entity/{name}")
async def get_entity(name: str):
    """Single entity + its direct neighbors (depth=2)."""
    neighborhood = graph_service.get_entity_neighborhood(name, depth=2)

    if not neighborhood["nodes"]:
        raise HTTPException(status_code=404, detail=f"Entity '{name}' not found in graph")

    return neighborhood


@router.post("/search")
async def search_entities(request: GraphSearchRequest):
    """Semantic search for entities by query string."""
    results = chroma_service.search_entities(request.query, top_k=request.top_k)

    entities = []
    if results and results.get("metadatas"):
        for i, meta in enumerate(results["metadatas"][0]):
            entities.append({
                "name": meta.get("name", ""),
                "type": meta.get("type", ""),
                "description": results["documents"][0][i] if results.get("documents") else "",
                "confidence": meta.get("confidence", 0.0),
                "distance": results["distances"][0][i] if results.get("distances") else None,
            })

    return {"entities": entities}
