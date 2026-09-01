# YT-RAG Bot: Technical Architecture & Methodology

## 🛠 SDE Perspective: Design Goals
As a senior developer, this project was architected with core engineering principles in mind:
1.  **Modularity & Decoupling**: Clean layer separation between Core RAG Engine, REST API Controllers (`app/api`), Business Logic (`app/services`), and Data Models (`app/models`).
2.  **Robustness**: Triple-redundancy ingestion handling network-sensitive operations (YouTube scraping) with automated fallbacks.
3.  **Extensibility**: Decoupled FastAPI backend ready to serve any frontend (Streamlit, Gradio, React, or Mobile) via REST contracts.
4.  **Containerization**: Production-ready Docker container with persistent vector store volume mapping.

---

## 🏗 System Architecture & Data Flow

```mermaid
graph TD
    subgraph "Clients"
        CLI[Terminal CLI]
        Web[Streamlit / React / Swagger UI]
    end

    subgraph "FastAPI Layer (app/)"
        Routes[API Routes: /info, /ingest, /chat, /search]
        Service[RAG Service Layer]
        Routes --> Service
    end

    subgraph "Core Ingestion Engine"
        A[YouTube URL / Local File] --> B(Data Ingestion Engine)
        B --> C{Source Priority}
        C -->|1. yt-dlp| D[Timestamped Subtitles]
        C -->|2. Scraper API| D
        C -->|3. IO Fallback| E[Local transcript.txt]
        D --> F[Raw Transcript]
        E --> F
    end

    subgraph "Vectorization Layer"
        F --> G(Recursive Character Splitting)
        G --> H[Semantic Chunks with [MM:SS]]
        H --> I(OpenAI Embedding API)
        I --> J[(FAISS Vector Store Disk Storage)]
    end

    subgraph "RAG Engine (LCEL)"
        K[User Question] --> L(Vector Similarity Search k=4)
        J --> L
        L --> M[Relevant Context Chunks]
        M --> N(Structured Prompt Augmentation)
        K --> N
        N --> O(OpenAI Chat API: gpt-4o-mini)
        O --> P[Structured Answer with Citations]
    end

    CLI --> Service
    Web --> Routes
    Service --> Core
```

---

## 🔬 Technical Deep Dive

### 1. Decoupled Service Layer
The API layer (`app/api/routes.py`) does not interact directly with low-level LangChain objects. Instead, `app/services/rag_service.py` encapsulates all vector store handling, error catching, and disk synchronization. This ensures business logic can be tested independently of HTTP transports.

### 2. Temporal Grounding & Citation Strategy
Standard RAG loses time awareness. Our pipeline extracts milliseconds (`tStartMs`) from subtitle track events, converts them to `[HH:MM:SS]` or `[MM:SS]` formats, and injects them directly into chunk tokens. When `ChatOpenAI` generates responses, it extracts these exact timestamps into the structured `TIMESTAMPS:` section.

### 3. Docker Volume Persistence
FAISS indices are persisted in `/app/faiss_index` inside the container. By mapping `./faiss_index:/app/faiss_index` in `docker-compose.yml`, vector stores generated inside the container survive container rebuilds and image updates.

---

## 🚀 How to Run

### 1. Docker Deployment
```bash
docker compose up --build
```
Access interactive documentation at `http://localhost:8000/docs`.

### 2. Local Execution
```bash
# Setup
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# Run FastAPI API
uvicorn app.main:app --reload --port 8000

# Run CLI
python main.py
```


