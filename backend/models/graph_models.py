# Description: Data models for entities, relationships, and extraction results used by the graph engine.

from typing import List, Optional
from pydantic import BaseModel, Field


# --- Entity Types (canonical labels) ---

ENTITY_TYPES: list[str] = [
    "CONCEPT",
    "TECHNOLOGY",
    "PERSON",
    "BOOK",
    "ORGANIZATION",
    "EVENT",
]

# --- Relationship Types (canonical labels) ---

RELATIONSHIP_TYPES: list[str] = [
    "USES",
    "EXTENDS",
    "REQUIRES",
    "ENABLES",
    "CONTRASTS",
    "CREATED_BY",
    "PART_OF",
    "RELATED_TO",
    "PRECEDED_BY",
]


class Entity(BaseModel):
    name: str
    type: str  # one of ENTITY_TYPES
    description: str = ""
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    source_ids: List[str] = []
    occurrence_count: int = 1


class Relationship(BaseModel):
    from_entity: str
    to_entity: str
    relationship_type: str  # one of RELATIONSHIP_TYPES
    description: str = ""
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    source_ids: List[str] = []


class ExtractionResult(BaseModel):
    entities: List[Entity] = []
    relationships: List[Relationship] = []
    source_id: str = ""
    chunk_index: Optional[int] = None


class GraphStats(BaseModel):
    total_nodes: int = 0
    total_edges: int = 0
    entity_counts: dict = {}  # type -> count
    relationship_counts: dict = {}  # type -> count
    avg_confidence: float = 0.0
