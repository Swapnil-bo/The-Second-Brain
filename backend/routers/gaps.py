# Description: Gap detection router — POST /api/gaps triggers LLM-powered analysis of the
# knowledge graph to identify missing concepts and surprising connections. Uses module-level
# cache to avoid burning Groq free-tier quota.

import logging

from fastapi import APIRouter

from models.schemas import GapAnalysisRequest, GapAnalysisResponse
from services.gap_detector import detect_gaps

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["gaps"])


@router.post("/gaps", response_model=GapAnalysisResponse)
async def analyze_gaps(request: GapAnalysisRequest):
    """
    Run gap detection over the full knowledge graph.
    Returns cached result if graph hasn't changed since last analysis.
    """
    result = await detect_gaps(focus_query=request.focus_query)
    return result
