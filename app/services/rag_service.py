import os
import shutil
from typing import Tuple, List, Dict, Any, Optional

from config import FAISS_INDEX_PATH
from utils import extract_video_id, get_video_title
from ingestion import get_or_create_vector_store
from rag_chain import get_rag_chain

class RAGService:
    @staticmethod
    def resolve_video_id(url_or_id: str) -> str:
        """Extracts and validates video ID."""
        vid = extract_video_id(url_or_id)
        if not vid:
            raise ValueError(f"Invalid YouTube URL or video ID: '{url_or_id}'")
        return vid

    @classmethod
    def get_video_info(cls, url_or_id: str) -> Dict[str, Any]:
        """Resolves video ID, title, and local cache status."""
        video_id = cls.resolve_video_id(url_or_id)
        title = get_video_title(video_id)
        index_dir = os.path.join(FAISS_INDEX_PATH, video_id)
        is_cached = os.path.exists(index_dir)
        return {
            "video_id": video_id,
            "title": title,
            "is_cached": is_cached
        }

    @classmethod
    def ingest_video(cls, url_or_id: str, force_reindex: bool = False) -> Dict[str, Any]:
        """Ingests a YouTube video transcript and builds/loads the FAISS index."""
        video_id = cls.resolve_video_id(url_or_id)
        title = get_video_title(video_id)
        index_dir = os.path.join(FAISS_INDEX_PATH, video_id)

        if force_reindex and os.path.exists(index_dir):
            shutil.rmtree(index_dir, ignore_errors=True)

        vector_store, is_fallback = get_or_create_vector_store(video_id)
        if not vector_store:
            raise RuntimeError("Failed to build or retrieve vector store for this video.")

        return {
            "video_id": video_id,
            "title": title,
            "status": "success",
            "is_fallback": is_fallback,
            "message": "Video successfully indexed and ready for querying."
        }

    @classmethod
    def chat_with_video(cls, url_or_id: str, question: str) -> Dict[str, Any]:
        """Executes a full RAG query against the specified video."""
        video_id = cls.resolve_video_id(url_or_id)
        title = get_video_title(video_id)
        
        chain, is_fallback = get_rag_chain(video_id)
        if not chain:
            raise RuntimeError(f"Could not initialize RAG chain for video ID '{video_id}'.")

        answer = chain.invoke(question)
        return {
            "video_id": video_id,
            "video_title": title,
            "question": question,
            "answer": answer,
            "is_fallback": is_fallback
        }

    @classmethod
    def stream_chat_with_video(cls, url_or_id: str, question: str):
        """Streams tokens from the RAG chain as Server-Sent Events (SSE)."""
        import json
        video_id = cls.resolve_video_id(url_or_id)
        chain, is_fallback = get_rag_chain(video_id)
        if not chain:
            yield f"data: {json.dumps({'error': 'Failed to initialize RAG chain'})}\n\n"
            return

        try:
            for chunk in chain.stream(question):
                if chunk:
                    yield f"data: {json.dumps({'token': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"


    @classmethod
    def semantic_search(cls, url_or_id: str, query: str, k: int = 4) -> Dict[str, Any]:
        """Performs raw similarity search on the video vector store without calling LLM."""
        video_id = cls.resolve_video_id(url_or_id)
        vector_store, _ = get_or_create_vector_store(video_id)
        if not vector_store:
            raise RuntimeError(f"No vector store available for video ID '{video_id}'.")

        docs = vector_store.similarity_search(query, k=k)
        chunks = [
            {"chunk_index": i + 1, "content": doc.page_content}
            for i, doc in enumerate(docs)
        ]
        return {
            "video_id": video_id,
            "query": query,
            "results_count": len(chunks),
            "chunks": chunks
        }

    @staticmethod
    def list_indices() -> Dict[str, Any]:
        """Returns all indexed video IDs present on disk."""
        if not os.path.exists(FAISS_INDEX_PATH):
            return {"total_indexed": 0, "indices": []}

        indices = []
        for item in os.listdir(FAISS_INDEX_PATH):
            full_path = os.path.join(FAISS_INDEX_PATH, item)
            if os.path.isdir(full_path):
                indices.append({
                    "video_id": item,
                    "index_path": full_path
                })

        return {
            "total_indexed": len(indices),
            "indices": indices
        }

    @staticmethod
    def delete_index(video_id: str) -> bool:
        """Deletes the persistent FAISS index directory for a video ID."""
        target = os.path.join(FAISS_INDEX_PATH, video_id)
        if os.path.exists(target) and os.path.isdir(target):
            shutil.rmtree(target, ignore_errors=True)
            return True
        return False
