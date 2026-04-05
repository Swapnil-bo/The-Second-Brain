# Description: In-memory networkx DiGraph manager. Rebuilds from ChromaDB on startup,
# provides neighborhood queries, graph snapshots, stats, and a compact LLM summary
# for gap detection.

import json
import logging
from collections import Counter

import networkx as nx

from services import chroma_service

logger = logging.getLogger(__name__)

_graph: nx.DiGraph = nx.DiGraph()


async def rebuild_from_chroma() -> None:
    """
    Rebuild the in-memory DiGraph from ChromaDB collections.
    Called on FastAPI startup and after each ingestion.
    Order: load all entities first → load all relationships → add to graph.
    """
    global _graph
    _graph = nx.DiGraph()

    # --- Load entities ---
    entities = chroma_service.get_all_entities(limit=10000)
    for i, eid in enumerate(entities["ids"]):
        meta = entities["metadatas"][i]
        _graph.add_node(
            eid,
            name=meta.get("name", ""),
            type=meta.get("type", "CONCEPT"),
            description=entities["documents"][i] if entities["documents"] else "",
            confidence=meta.get("confidence", 0.0),
            occurrence_count=meta.get("occurrence_count", 1),
            source_ids=json.loads(meta.get("source_ids", "[]")),
        )

    # --- Load relationships ---
    rels = chroma_service.get_all_relationships(limit=50000)
    for i, rid in enumerate(rels["ids"]):
        meta = rels["metadatas"][i]
        from_name = meta.get("from_entity", "")
        to_name = meta.get("to_entity", "")

        # Resolve entity names to node IDs
        from_id = _find_node_by_name(from_name)
        to_id = _find_node_by_name(to_name)

        if from_id and to_id:
            _graph.add_edge(
                from_id,
                to_id,
                id=rid,
                relationship_type=meta.get("relationship_type", "RELATED_TO"),
                description=meta.get("description", ""),
                confidence=meta.get("confidence", 0.0),
                source_ids=json.loads(meta.get("source_ids", "[]")),
            )

    logger.info("Graph rebuilt: %d nodes, %d edges", _graph.number_of_nodes(), _graph.number_of_edges())


def _find_node_by_name(name: str) -> str | None:
    """Look up a node ID by its normalized name."""
    normalized = name.strip().title()
    for node_id, data in _graph.nodes(data=True):
        if data.get("name", "").strip().title() == normalized:
            return node_id
    return None


def get_full_snapshot() -> dict:
    """Return the full graph as nodes + edges for the frontend."""
    nodes = []
    for node_id, data in _graph.nodes(data=True):
        nodes.append({
            "id": node_id,
            "name": data.get("name", ""),
            "type": data.get("type", "CONCEPT"),
            "description": data.get("description", ""),
            "confidence": data.get("confidence", 0.0),
            "occurrence_count": data.get("occurrence_count", 1),
            "source_ids": data.get("source_ids", []),
        })

    edges = []
    for u, v, data in _graph.edges(data=True):
        edges.append({
            "id": data.get("id", f"{u}->{v}"),
            "source": u,
            "target": v,
            "relationship_type": data.get("relationship_type", "RELATED_TO"),
            "description": data.get("description", ""),
            "confidence": data.get("confidence", 0.0),
        })

    return {"nodes": nodes, "edges": edges}


def get_stats() -> dict:
    """Entity counts by type, total nodes/edges, avg confidence."""
    type_counts: Counter = Counter()
    rel_type_counts: Counter = Counter()
    confidences: list[float] = []

    for _, data in _graph.nodes(data=True):
        type_counts[data.get("type", "UNKNOWN")] += 1
        confidences.append(data.get("confidence", 0.0))

    for _, _, data in _graph.edges(data=True):
        rel_type_counts[data.get("relationship_type", "RELATED_TO")] += 1

    avg_conf = sum(confidences) / len(confidences) if confidences else 0.0

    return {
        "total_nodes": _graph.number_of_nodes(),
        "total_edges": _graph.number_of_edges(),
        "entity_counts": dict(type_counts),
        "relationship_counts": dict(rel_type_counts),
        "avg_confidence": round(avg_conf, 3),
    }


def get_entity_neighborhood(entity_name: str, depth: int = 2) -> dict:
    """Return the subgraph of all nodes within `depth` hops of the named entity."""
    node_id = _find_node_by_name(entity_name)
    if not node_id:
        return {"nodes": [], "edges": []}

    # Collect neighbor node IDs via BFS up to depth
    visited: set[str] = set()
    frontier: set[str] = {node_id}

    for _ in range(depth):
        next_frontier: set[str] = set()
        for nid in frontier:
            if nid not in visited:
                visited.add(nid)
                next_frontier.update(_graph.successors(nid))
                next_frontier.update(_graph.predecessors(nid))
        frontier = next_frontier - visited
    visited.update(frontier)

    # Build subgraph snapshot
    nodes = []
    for nid in visited:
        data = _graph.nodes[nid]
        nodes.append({
            "id": nid,
            "name": data.get("name", ""),
            "type": data.get("type", "CONCEPT"),
            "description": data.get("description", ""),
            "confidence": data.get("confidence", 0.0),
            "occurrence_count": data.get("occurrence_count", 1),
            "source_ids": data.get("source_ids", []),
        })

    edges = []
    for u, v, data in _graph.edges(data=True):
        if u in visited and v in visited:
            edges.append({
                "id": data.get("id", f"{u}->{v}"),
                "source": u,
                "target": v,
                "relationship_type": data.get("relationship_type", "RELATED_TO"),
                "description": data.get("description", ""),
                "confidence": data.get("confidence", 0.0),
            })

    return {"nodes": nodes, "edges": edges}


def get_graph_summary_for_llm() -> str:
    """
    Compact text summary of the entire graph for gap detection / chat prompts.
    Truncates to top 50 entities by occurrence_count. Keeps under ~3000 tokens.
    """
    if _graph.number_of_nodes() == 0:
        return "The knowledge graph is empty. No entities or relationships exist yet."

    # Sort entities by occurrence count (descending), take top 50
    sorted_nodes = sorted(
        _graph.nodes(data=True),
        key=lambda x: x[1].get("occurrence_count", 1),
        reverse=True,
    )[:50]

    entity_lines = []
    for _, data in sorted_nodes:
        name = data.get("name", "")
        etype = data.get("type", "")
        desc = data.get("description", "")[:80]
        entity_lines.append(f"- {name} [{etype}]: {desc}")

    # Collect edges for those top entities
    top_names = {data.get("name", "") for _, data in sorted_nodes}
    rel_lines = []
    for u, v, data in _graph.edges(data=True):
        u_name = _graph.nodes[u].get("name", "")
        v_name = _graph.nodes[v].get("name", "")
        if u_name in top_names or v_name in top_names:
            rel_type = data.get("relationship_type", "RELATED_TO")
            rel_lines.append(f"- {u_name} --[{rel_type}]--> {v_name}")

    summary = f"KNOWLEDGE GRAPH SUMMARY ({_graph.number_of_nodes()} entities, {_graph.number_of_edges()} relationships)\n\n"
    summary += "ENTITIES:\n" + "\n".join(entity_lines) + "\n\n"
    summary += "KEY RELATIONSHIPS:\n" + "\n".join(rel_lines[:100])

    return summary


def get_node_count() -> int:
    return _graph.number_of_nodes()


def get_edge_count() -> int:
    return _graph.number_of_edges()
