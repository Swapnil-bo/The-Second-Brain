# Description: Chat and semantic query router. POST /api/chat uses SSE StreamingResponse
# with Groq llama-3.3-70b-versatile. POST /api/query returns non-streaming search results.

import json
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from groq import AsyncGroq, RateLimitError

from config import GROQ_API_KEY, GROQ_REASONING_MODEL, CHAT_TEMPERATURE
from models.schemas import ChatRequest, GraphSearchRequest
from services import chroma_service, graph_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["query"])

_groq_client: Optional[AsyncGroq] = None


def _get_client() -> AsyncGroq:
    global _groq_client
    if _groq_client is None:
        _groq_client = AsyncGroq(api_key=GROQ_API_KEY)
    return _groq_client


CHAT_SYSTEM_PROMPT = """
You are SecondBrain, a knowledgeable assistant with direct access to the user's personal knowledge graph and notes.

You will receive:
1. Relevant chunks retrieved from the user's notes (via semantic search)
2. Relevant graph context (entities and relationships connected to the query)
3. The user's question

Your job:
- Answer using ONLY the user's own knowledge artifacts as your primary source
- Clearly distinguish between what's in their notes vs. your general knowledge
- Cite specific sources when quoting their notes (use [Source: filename])
- If their notes don't cover something, say so — then optionally extend with general knowledge
- Be conversational but precise. You are their second brain, not a search engine.
- Highlight interesting connections in their notes they may not have noticed
"""


def _build_context(message: str, top_k: int) -> tuple[str, list[dict], list[dict]]:
    """Retrieve chunks + graph neighborhood and build a context string for the LLM."""
    # Semantic chunk retrieval
    chunk_results = chroma_service.query_chunks(message, top_k=top_k)
    sources: list[dict] = []
    context_parts: list[str] = []

    if chunk_results and chunk_results.get("documents"):
        for i, doc in enumerate(chunk_results["documents"][0]):
            meta = chunk_results["metadatas"][0][i] if chunk_results.get("metadatas") else {}
            source_name = meta.get("source_name", "Unknown")
            sources.append({
                "content": doc[:300],
                "source_name": source_name,
                "source_type": meta.get("source_type", ""),
                "chunk_index": meta.get("chunk_index", 0),
            })
            context_parts.append(f"[Source: {source_name}]\n{doc}")

    # Graph neighborhood context
    entity_results = chroma_service.search_entities(message, top_k=3)
    graph_ctx: list[dict] = []

    if entity_results and entity_results.get("metadatas"):
        for meta in entity_results["metadatas"][0]:
            entity_name = meta.get("name", "")
            if entity_name:
                neighborhood = graph_service.get_entity_neighborhood(entity_name, depth=1)
                for node in neighborhood.get("nodes", [])[:5]:
                    graph_ctx.append({
                        "name": node["name"],
                        "type": node["type"],
                        "description": node["description"][:100],
                    })

    # Build context string
    chunk_context = "\n\n---\n\n".join(context_parts) if context_parts else "No relevant notes found."
    graph_context_str = ""
    if graph_ctx:
        lines = [f"- {g['name']} [{g['type']}]: {g['description']}" for g in graph_ctx]
        graph_context_str = "\n\nRELATED ENTITIES IN KNOWLEDGE GRAPH:\n" + "\n".join(lines)

    full_context = f"RETRIEVED NOTES:\n{chunk_context}{graph_context_str}"
    return full_context, sources, graph_ctx


@router.post("/chat")
async def chat_stream(request: ChatRequest):
    """Conversational query with SSE streaming. Uses llama-3.3-70b-versatile."""
    context, sources, graph_ctx = _build_context(request.message, request.top_k)

    messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]

    # Add conversation history
    for msg in request.history[-10:]:
        if msg.get("role") in ("user", "assistant"):
            messages.append({"role": msg["role"], "content": msg["content"]})

    # Current message with retrieved context
    user_prompt = f"CONTEXT:\n{context}\n\nQUESTION: {request.message}"
    messages.append({"role": "user", "content": user_prompt})

    client = _get_client()

    async def event_generator():
        try:
            stream = await client.chat.completions.create(
                model=GROQ_REASONING_MODEL,
                messages=messages,
                temperature=CHAT_TEMPERATURE,
                max_tokens=2048,
                stream=True,
            )

            async for chunk in stream:
                token = chunk.choices[0].delta.content or ""
                if token:
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

            # Final event with sources and graph context
            yield f"data: {json.dumps({'type': 'done', 'sources': sources, 'graph_context': graph_ctx})}\n\n"

        except RateLimitError:
            yield f"data: {json.dumps({'type': 'error', 'content': 'Rate limited — please wait a moment and try again.'})}\n\n"
        except GeneratorExit:
            # Client disconnected mid-stream — exit cleanly
            return
        except Exception as e:
            logger.error("Chat stream error: %s", str(e))
            yield f"data: {json.dumps({'type': 'error', 'content': 'An error occurred while generating a response.'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/query")
async def semantic_search(request: GraphSearchRequest):
    """Non-streaming semantic search over chunks and entities."""
    chunk_results = chroma_service.query_chunks(request.query, top_k=request.top_k)
    entity_results = chroma_service.search_entities(request.query, top_k=request.top_k)

    chunks = []
    if chunk_results and chunk_results.get("documents"):
        for i, doc in enumerate(chunk_results["documents"][0]):
            meta = chunk_results["metadatas"][0][i] if chunk_results.get("metadatas") else {}
            chunks.append({
                "content": doc,
                "source_name": meta.get("source_name", ""),
                "source_type": meta.get("source_type", ""),
                "distance": chunk_results["distances"][0][i] if chunk_results.get("distances") else None,
            })

    entities = []
    if entity_results and entity_results.get("metadatas"):
        for i, meta in enumerate(entity_results["metadatas"][0]):
            entities.append({
                "name": meta.get("name", ""),
                "type": meta.get("type", ""),
                "description": entity_results["documents"][0][i] if entity_results.get("documents") else "",
                "confidence": meta.get("confidence", 0.0),
                "distance": entity_results["distances"][0][i] if entity_results.get("distances") else None,
            })

    return {"chunks": chunks, "entities": entities}
