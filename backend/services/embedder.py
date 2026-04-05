# Description: Singleton sentence-transformers embedding service. Loads all-MiniLM-L6-v2 once
# at module level and exposes embed_texts() for all downstream consumers.

from sentence_transformers import SentenceTransformer
from config import EMBEDDING_MODEL

_model: SentenceTransformer = SentenceTransformer(EMBEDDING_MODEL)


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of strings into 384-dim normalized vectors."""
    return _model.encode(texts, normalize_embeddings=True).tolist()


def embed_single(text: str) -> list[float]:
    """Convenience wrapper for a single string."""
    return embed_texts([text])[0]
