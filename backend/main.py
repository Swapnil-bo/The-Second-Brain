# Description: FastAPI application entry point — CORS middleware with explicit origin whitelist,
# router registration, startup event for ChromaDB initialization and graph rebuild.

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import ALLOWED_ORIGINS
from routers import ingest, query, graph, gaps
from services.chroma_service import initialize_collections, get_collection_counts
from services import graph_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SecondBrain API",
    description="Personal Knowledge Graph Engine",
    version="1.0.0",
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
app.include_router(ingest.router)
app.include_router(query.router)
app.include_router(graph.router)
app.include_router(gaps.router)


# --- Startup Event ---
@app.on_event("startup")
async def startup_event():
    """
    1. Initialize all three ChromaDB collections (create if they don't exist).
    2. Rebuild the in-memory networkx DiGraph from persisted data.
    Runs on every server start — ensures graph is never stale after restart.
    """
    logger.info("Initializing ChromaDB collections...")
    initialize_collections()

    counts = get_collection_counts()
    logger.info(
        "ChromaDB ready — chunks: %d, entities: %d, relationships: %d",
        counts["chunks"], counts["entities"], counts["relationships"],
    )

    logger.info("Rebuilding in-memory graph from ChromaDB...")
    await graph_service.rebuild_from_chroma()
    logger.info("Startup complete.")


# --- Health ---
@app.get("/api/health")
async def health_check():
    """Backend health + ChromaDB status + graph node/edge count."""
    try:
        counts = get_collection_counts()
        chroma_status = "healthy"
    except Exception:
        counts = {"chunks": 0, "entities": 0, "relationships": 0}
        chroma_status = "unavailable"

    return {
        "status": "healthy",
        "chroma_status": chroma_status,
        "graph_node_count": graph_service.get_node_count(),
        "graph_edge_count": graph_service.get_edge_count(),
        "collection_counts": counts,
    }
