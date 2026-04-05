# Description: Ingestion router — POST endpoints for file upload (PDF/MD/TXT), URL scraping,
# raw text paste, queue status polling, and source deletion with cascade cleanup.

import uuid
import asyncio
import hashlib
import logging

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks

from models.schemas import IngestTextRequest, IngestURLRequest, IngestResult
from services.ingestor import ingest_document, delete_source, get_queue_status, get_item_status
from services.pdf_parser import extract_text_from_pdf
from services.url_scraper import scrape_url

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ingest", tags=["ingest"])

# Track ingested URL hashes to detect duplicates
_ingested_urls: dict[str, str] = {}  # url_hash -> source_id


@router.post("/file", response_model=IngestResult)
async def ingest_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Upload and ingest a PDF, Markdown, or plain text file."""
    if not file.filename:
        raise HTTPException(status_code=422, detail="No filename provided")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    allowed = {"pdf", "md", "markdown", "txt"}
    if ext not in allowed:
        raise HTTPException(status_code=422, detail=f"Unsupported file type '.{ext}'. Allowed: {', '.join(allowed)}")

    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=422, detail="Uploaded file is empty")

    source_id = uuid.uuid4().hex

    # Parse based on file type
    if ext == "pdf":
        try:
            content = extract_text_from_pdf(raw_bytes)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
        source_type = "pdf"
    else:
        content = raw_bytes.decode("utf-8", errors="replace")
        source_type = "markdown" if ext in ("md", "markdown") else "text"

    result = await ingest_document(
        content=content,
        source_name=file.filename,
        source_type=source_type,
        source_id=source_id,
    )
    return result


@router.post("/url", response_model=IngestResult)
async def ingest_url(request: IngestURLRequest):
    """Scrape and ingest content from a URL."""
    url_str = str(request.url)
    url_hash = hashlib.sha256(url_str.encode()).hexdigest()[:16]

    # Duplicate detection
    if url_hash in _ingested_urls:
        existing_id = _ingested_urls[url_hash]
        status = get_item_status(existing_id)
        if status and status.get("current_stage") == "done":
            return IngestResult(
                source_id=existing_id,
                source_name=request.custom_name or url_str,
                source_type="url",
                chunk_count=0,
                entity_count=0,
                relationship_count=0,
                status="done",
                error="Already in your brain",
            )

    try:
        scraped = await scrape_url(url_str)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    source_id = uuid.uuid4().hex
    source_name = request.custom_name or scraped["title"]
    _ingested_urls[url_hash] = source_id

    result = await ingest_document(
        content=scraped["content"],
        source_name=source_name,
        source_type="url",
        source_id=source_id,
    )
    return result


@router.post("/text", response_model=IngestResult)
async def ingest_text(request: IngestTextRequest):
    """Ingest raw pasted text."""
    if not request.content.strip():
        raise HTTPException(status_code=422, detail="Content is empty")

    source_id = uuid.uuid4().hex

    result = await ingest_document(
        content=request.content,
        source_name=request.source_name,
        source_type="text",
        source_id=source_id,
    )
    return result


@router.get("/status")
async def get_status():
    """Get current ingestion queue status for all items."""
    return get_queue_status()


@router.delete("/{source_id}")
async def remove_source(source_id: str):
    """Remove a source and all its entities, relationships, and chunks."""
    try:
        result = await delete_source(source_id)
        return result
    except Exception as e:
        logger.error("Delete failed for source %s: %s", source_id, str(e))
        raise HTTPException(status_code=500, detail=f"Failed to delete source: {str(e)}")
