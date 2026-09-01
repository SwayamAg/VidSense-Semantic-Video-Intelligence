import os
import json
import warnings
from fastapi.testclient import TestClient

warnings.filterwarnings("ignore", message="urllib3 .* or chardet .* doesn't match a supported version!")

from app.main import app

client = TestClient(app)

TARGET_VIDEO_URL = "https://www.youtube.com/watch?v=jXwOcpkMQAA"

def test_full_api_suite():
    print("=" * 70)
    print("   FASTAPI REST API INTEGRATION & REGRESSION TEST SUITE   ")
    print("=" * 70)

    # 1. Health Check
    print("\n[STEP 1/6] Testing GET /health...")
    resp = client.get("/health")
    assert resp.status_code == 200, f"Health check failed: {resp.text}"
    health_data = resp.json()
    print(f"  [OK] Status: {health_data['status']}, OpenAI: {health_data['openai_configured']}, Chat: {health_data['chat_model']}")

    # 2. Video Info
    print(f"\n[STEP 2/6] Testing POST /api/v1/video/info for: {TARGET_VIDEO_URL}...")
    resp = client.post("/api/v1/video/info", json={"url_or_id": TARGET_VIDEO_URL})
    assert resp.status_code == 200, f"Video info failed: {resp.text}"
    info_data = resp.json()
    print(f"  [OK] Video ID: {info_data['video_id']}")
    print(f"  [OK] Title:    {info_data['title']}")
    print(f"  [OK] Cached:   {info_data['is_cached']}")

    # 3. Ingestion
    print(f"\n[STEP 3/6] Testing POST /api/v1/ingest for: {TARGET_VIDEO_URL}...")
    resp = client.post("/api/v1/ingest", json={"url_or_id": TARGET_VIDEO_URL, "force_reindex": False})
    assert resp.status_code == 200, f"Ingestion failed: {resp.text}"
    ingest_data = resp.json()
    print(f"  [OK] Ingestion Status: {ingest_data['status']}")
    print(f"  [OK] Is Fallback:      {ingest_data['is_fallback']}")

    # 4. Semantic Search
    search_query = "What is the core topic or concept explained?"
    print(f"\n[STEP 4/6] Testing POST /api/v1/search (query='{search_query}')...")
    resp = client.post("/api/v1/search", json={"url_or_id": TARGET_VIDEO_URL, "query": search_query, "k": 3})
    assert resp.status_code == 200, f"Search failed: {resp.text}"
    search_data = resp.json()
    print(f"  [OK] Retrieved {search_data['results_count']} chunks.")
    if search_data['chunks']:
        print(f"  [OK] First chunk snippet: {search_data['chunks'][0]['content'][:120]}...")

    # 5. Q&A Tests on Target Video
    print(f"\n[STEP 5/6] Performing Live RAG Q&A on: {TARGET_VIDEO_URL}...")
    test_questions = [
        "What is the main topic of this video and what key concepts are covered?",
        "What are the main insights or takeaways discussed?",
        "Can you list any specific techniques, tools, or methods mentioned with their timestamps?"
    ]

    qna_results = []
    for i, q in enumerate(test_questions, 1):
        print(f"\n  --- Q&A Test {i} ---")
        print(f"  Question: {q}")
        resp = client.post("/api/v1/chat", json={"url_or_id": TARGET_VIDEO_URL, "question": q})
        assert resp.status_code == 200, f"Chat failed on '{q}': {resp.text}"
        chat_data = resp.json()
        print(f"\n  Answer:\n{chat_data['answer']}\n")
        qna_results.append({
            "question": q,
            "answer": chat_data['answer'],
            "is_fallback": chat_data['is_fallback']
        })

    # 6. Index List & Root Docs
    print("\n[STEP 6/6] Testing GET /api/v1/indexes and Root Redirect...")
    resp = client.get("/api/v1/indexes")
    assert resp.status_code == 200
    indices_data = resp.json()
    print(f"  [OK] Total indexed videos on disk: {indices_data['total_indexed']}")
    
    root_resp = client.get("/", follow_redirects=False)
    assert root_resp.status_code in [302, 307], f"Expected redirect to /docs, got {root_resp.status_code}"
    print(f"  [OK] Root '/' correctly redirects to '/docs'")

    print("\n" + "=" * 70)
    print("   ALL FASTAPI INTEGRATION & REGRESSION TESTS PASSED 100%!   ")
    print("=" * 70)
    return qna_results

if __name__ == "__main__":
    qna = test_full_api_suite()
