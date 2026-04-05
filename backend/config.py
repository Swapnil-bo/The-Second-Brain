# Description: Central configuration — env vars, constants, model names, collection names.

import os
from dotenv import load_dotenv

load_dotenv()

# --- Groq API ---
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GROQ_EXTRACTION_MODEL: str = os.getenv("GROQ_EXTRACTION_MODEL", "llama-3.1-8b-instant")
GROQ_REASONING_MODEL: str = os.getenv("GROQ_REASONING_MODEL", "llama-3.3-70b-versatile")

# --- ChromaDB ---
CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
CHUNKS_COLLECTION: str = "knowledge_chunks"
ENTITIES_COLLECTION: str = "knowledge_entities"
RELATIONSHIPS_COLLECTION: str = "knowledge_relationships"

# --- Embeddings ---
EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

# --- Chunking ---
MAX_CHUNK_SIZE: int = int(os.getenv("MAX_CHUNK_SIZE", "512"))
CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "50"))

# --- Retrieval ---
TOP_K_RETRIEVAL: int = int(os.getenv("TOP_K_RETRIEVAL", "5"))
MAX_ENTITIES_PER_CHUNK: int = int(os.getenv("MAX_ENTITIES_PER_CHUNK", "20"))

# --- LLM Temperatures ---
EXTRACTION_TEMPERATURE: float = float(os.getenv("EXTRACTION_TEMPERATURE", "0.1"))
CHAT_TEMPERATURE: float = float(os.getenv("CHAT_TEMPERATURE", "0.7"))
GAP_DETECTION_TEMPERATURE: float = float(os.getenv("GAP_DETECTION_TEMPERATURE", "0.7"))

# --- Rate Limiting ---
RATE_LIMIT_DELAY: float = float(os.getenv("RATE_LIMIT_DELAY", "1.0"))

# --- CORS ---
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "")

ALLOWED_ORIGINS: list[str] = [
    origin for origin in [
        "http://localhost:5173",
        "http://localhost:4173",
        FRONTEND_URL,
    ] if origin
]
