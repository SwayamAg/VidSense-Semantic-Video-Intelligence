import os
from fastapi import APIRouter, HTTPException, status

from app.models.schemas import (
    HealthResponse,
    VideoInfoRequest,
    VideoInfoResponse,
    IngestRequest,
    IngestResponse,
    ChatRequest,
    ChatResponse,
    SearchRequest,
    SearchResponse,
    IndexListResponse
)
from app.services.rag_service import RAGService
from config import validate_env, DEFAULT_OPENAI_MODEL, DEFAULT_EMBEDDING_MODEL

router = APIRouter()

@router.get("/health", response_model=HealthResponse, tags=["System"])
def health_check():
    """Returns the operational status and active OpenAI model configurations."""
    api_key = os.getenv("OPENAI_API_KEY")
    is_configured = bool(api_key and api_key != "your_openai_api_key_here")
    return HealthResponse(
        status="healthy" if is_configured else "unconfigured",
        openai_configured=is_configured,
        chat_model=os.getenv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL),
        embedding_model=os.getenv("OPENAI_EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL)
    )

@router.post("/api/v1/video/info", response_model=VideoInfoResponse, tags=["Video"])
def get_video_info(payload: VideoInfoRequest):
    """Extracts Video ID, fetches metadata title, and checks local cache state."""
    try:
        data = RAGService.get_video_info(payload.url_or_id)
        return VideoInfoResponse(**data)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/api/v1/ingest", response_model=IngestResponse, tags=["Ingestion"])
def ingest_video(payload: IngestRequest):
    """Ingests a YouTube video transcript and builds the FAISS vector index."""
    try:
        result = RAGService.ingest_video(payload.url_or_id, force_reindex=payload.force_reindex)
        return IngestResponse(**result)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/api/v1/chat", response_model=ChatResponse, tags=["RAG Chat"])
def chat_with_video(payload: ChatRequest):
    """Performs full RAG retrieval and answers user questions grounded in video facts."""
    try:
        result = RAGService.chat_with_video(payload.url_or_id, payload.question)
        return ChatResponse(**result)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/api/v1/search", response_model=SearchResponse, tags=["Search"])
def semantic_search(payload: SearchRequest):
    """Retrieves top matching transcript chunks with timestamps without calling LLM."""
    try:
        result = RAGService.semantic_search(payload.url_or_id, payload.query, k=payload.k)
        return SearchResponse(**result)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/api/v1/indexes", response_model=IndexListResponse, tags=["Index Management"])
def list_indexes():
    """Lists all stored vector indices on disk."""
    data = RAGService.list_indices()
    return IndexListResponse(**data)

@router.delete("/api/v1/indexes/{video_id}", tags=["Index Management"])
def delete_index(video_id: str):
    """Deletes a stored vector index for the specified video ID."""
    deleted = RAGService.delete_index(video_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No index found for Video ID '{video_id}'.")
    return {"status": "success", "message": f"Index for '{video_id}' deleted successfully."}
