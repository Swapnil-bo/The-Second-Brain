# Description: Pydantic request/response models for all API endpoints.

from typing import List, Optional
from pydantic import BaseModel, HttpUrl


# --- Ingestion ---

class IngestTextRequest(BaseModel):
    content: str
    source_name: str = "Pasted Note"


class IngestURLRequest(BaseModel):
    url: HttpUrl
    custom_name: Optional[str] = None


class IngestStage(BaseModel):
    stage: str
    status: str  # "pending" | "running" | "done" | "failed"
    detail: Optional[str] = None


class IngestQueueItem(BaseModel):
    source_id: str
    source_name: str
    source_type: str
    current_stage: str
    stages: List[IngestStage]
    entity_count: int = 0
    relationship_count: int = 0
    error: Optional[str] = None


class IngestResult(BaseModel):
    source_id: str
    source_name: str
    source_type: str
    chunk_count: int
    entity_count: int
    relationship_count: int
    status: str  # "done" | "failed"
    error: Optional[str] = None


# --- Graph ---

class GraphNode(BaseModel):
    id: str
    name: str
    type: str
    description: str
    confidence: float
    occurrence_count: int
    source_ids: List[str]


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship_type: str
    description: str
    confidence: float


class GraphSnapshot(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: dict
    generated_at: str


class GraphSearchRequest(BaseModel):
    query: str
    top_k: int = 5


# --- Chat ---

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []
    top_k: int = 5


# --- Gap Detection ---

class GapAnalysisRequest(BaseModel):
    focus_query: Optional[str] = None


class LearningStep(BaseModel):
    step: int
    action: str
    resource: str
    time: str


class GapResult(BaseModel):
    topic: str
    type: str
    why_missing: str
    connection_to_known: List[str]
    learning_path: List[LearningStep]
    total_time: str
    priority: str  # "HIGH" | "MEDIUM" | "LOW"


class SurprisingConnection(BaseModel):
    entity_a: str
    entity_b: str
    connection: str


class GapAnalysisResponse(BaseModel):
    gaps: List[GapResult]
    surprising_connections: List[SurprisingConnection]
    graph_summary: str
    analyzed_at: str
    cache_hit: bool


# --- Health ---

class HealthResponse(BaseModel):
    status: str
    chroma_status: str
    graph_node_count: int
    graph_edge_count: int
