# 📺 VidSense: Semantic Video Intelligence & RAG Assistant

> **Full-stack, containerized AI video intelligence engine turning any YouTube video into an interactive, timestamp-grounded knowledge base with Next.js App Router, FastAPI, and FAISS.**


![Python](https://img.shields.io/badge/python-3.10-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![Next.js](https://img.shields.io/badge/Next.js-16+-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/langchain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![OpenAI](https://img.shields.io/badge/openai-412991?style=for-the-badge&logo=openai&logoColor=white)
![Docker](https://img.shields.io/badge/docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![FAISS](https://img.shields.io/badge/FAISS-005571?style=for-the-badge&logo=meta&logoColor=white)

---

## 🌐 Live Demo

[![Live Demo](https://img.shields.io/badge/▶_Live_Demo-Visit_Website-7c3aed?style=for-the-badge&logo=vercel&logoColor=white)](https://yt-rag-bot-semantic-video-intelligencefinal-bdsb8pfg2.vercel.app/)

---




## 📸 Interactive Workspace Preview


```text
========================================================================================
   📺 YT-RAG BOT: 3-PANE SEMANTIC VIDEO INTELLIGENCE WORKSPACE
========================================================================================
[Left Pane: Video Player]     [Center Pane: AI Research Chat]       [Right: Knowledge]
- Responsive YouTube IFrame   - Real-Time SSE Token Streaming       - FAISS Similarity (k=4)
- Live Seek to Exact Second   - Interactive [▶ MM:SS] Pill Badges   - Full Subtitle Viewer
- One-Click Transcript Jump   - One-Click Answer Copying            - Cached Video Library
========================================================================================
```

---

## 🎯 Problem Statement
- **Long-form Video Inefficiency**: Searching for specific concepts inside 1-3 hour lectures, podcasts, and documentaries requires tedious manual scrubbing.
- **Scraper Fragility**: Standard transcript scraping APIs frequently fail due to rate limits or dynamic bot blocks.
- **LLM Hallucinations**: Generic LLMs invent facts when asked about specific long-form video details without context grounding.

---

## 💡 Solution Overview
**YT-RAG Bot** combines a robust, multi-dialect ingestion pipeline (`yt-dlp` pro-fetch → `youtube-transcript-api` fallback) supporting international English variants and Hindi with strict error handling and diagnosis. Every AI claim is grounded in verifiable timestamps; clicking any citation `[▶ MM:SS]` automatically seeks the embedded video player to that exact moment.

---

## 📈 Business & Engineering Impact
- ⚡ **95% Time Saved**: Retrieve timestamped answers from hour-long videos in sub-seconds.
- ⏱️ **Zero Waiting (SSE Streaming)**: Sub-second Time-to-First-Token (TTFT) via Server-Sent Events.
- 🌐 **Global Dialect Coverage**: Automatic recognition across `en`, `en-orig`, `en-US`, `en-GB`, `en-IN`, `en-CA`, `en-AU`, `en-IE`, `en-NZ`, `en-ZA`, and `hi`.
- 🔍 **Strict Context Integrity**: Zero silent dummy data injection. If captions are disabled or unavailable, the system diagnoses and displays precise reasoning on the UI.
- 💰 **Zero-Redundancy Compute**: Vector indices are persisted locally; previously ingested videos cost $0 in repeat embedding tokens.
- 🔌 **Full-Stack Architecture**: Clean decoupling between Next.js frontend, FastAPI backend, and persistent FAISS storage.

---

## 🚀 Key Features

- 🖥️ **3-Pane Next.js AI Workspace**: Synchronized layout with Embedded Video Player, Streaming AI Chat, and Retrieved Knowledge.
- 🎬 **Clickable Video Citations**: Clicking any `[▶ MM:SS]` badge in the chat, sources, or transcript automatically commands the YouTube player to jump and play.
- ⚡ **Real-Time Token Streaming (SSE)**: Powered by FastAPI `StreamingResponse` and LangChain `chain.stream()` for sub-second responses.
- 🌐 **Global Multi-Dialect Subtitle Support**: Deep language compatibility across international English tracks (`en`, `en-orig`, `en-US`, `en-GB`, `en-IN`, `en-CA`, etc.) and Hindi.
- 🛡️ **Intelligent Error Diagnosis**: Real-time diagnostic cards on the UI distinguishing backend connection issues from disabled/unsupported video subtitles.
- 📄 **Full Searchable Transcript Modal**: Filter and read through every spoken line of the video with instant playback jumping.
- 🗄️ **Indexed Video Library Drawer**: Switch between previously ingested video knowledge bases on disk with 1 click.
- 🐳 **Full Dockerization**: One-command deployment with Docker and Docker Compose with persistent volume mounts.


---

## 🏗 System Architecture

```mermaid
graph LR
    A["🎬 YouTube URL"] --> B["⚙️ Ingestion Engine\n(yt-dlp / Scraper)"]
    B --> C["✂️ Recursive Splitter\n(Chunk=1000, Overlap=200)"]
    C --> D["🧠 OpenAI Embeddings\n(text-embedding-3-small)"]
    D --> E[("🗄️ FAISS Vector Store\n(Persisted by Video ID)")]

    F["💻 Next.js Frontend\n(3-Pane Workspace)"] --> G["⚡ FastAPI Backend\n(/chat/stream)"]
    E --> G
    G --> H["🤖 OpenAI Chat Model\n(gpt-4o-mini)"]
    H -->|SSE Stream| F
    F -->|Seek Command| I["📺 YouTube Player\n(Jumps to [MM:SS])"]

    classDef source fill:#3b1f4a,stroke:#c678dd,color:#f0e6ff
    classDef process fill:#1a3340,stroke:#56b6c2,color:#e0f4f8
    classDef storage fill:#1a2540,stroke:#61afef,color:#ddeeff
    classDef rag fill:#2a2010,stroke:#e5c07b,color:#fff5cc
    classDef output fill:#102a1a,stroke:#98c379,color:#d4f5d4

    class A,F source
    class B,C process
    class D,E storage
    class G,H rag
    class I output
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 16 (App Router)](https://nextjs.org/) + [TypeScript](https://www.typescriptlang.org/) | Modern 3-pane research workspace with responsive UI |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) | Dark glassmorphism, glowing accents, and micro-interactions |
| **Backend API** | [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) | High-performance asynchronous REST & SSE streaming server |
| **Orchestration** | [LangChain](https://www.langchain.com/) (LCEL) | Declarative RAG chaining and prompt templates |
| **LLM & Embeddings** | [OpenAI API](https://openai.com/) | `gpt-4o-mini` & `text-embedding-3-small` (1536 dims) |
| **Vector DB** | [FAISS](https://github.com/facebookresearch/faiss) | In-memory similarity search with local disk serialization |
| **Ingestion** | `yt-dlp` + `youtube-transcript-api` | Robust automated caption & subtitle extraction |
| **Container** | [Docker](https://www.docker.com/) + Docker Compose | Containerized reproducible execution |

---

## 📁 Project Structure

```text
YT-RAG_BOT/
├── app/                              # FastAPI Service Layer
│   ├── api/
│   │   └── routes.py                 # REST & SSE Endpoints (/stream, /chat, /search, /transcript)
│   ├── models/
│   │   └── schemas.py                # Pydantic Request/Response Models
│   ├── services/
│   │   └── rag_service.py            # Business Logic & SSE Generator Layer
│   └── main.py                       # FastAPI App Entrypoint, CORS & Lifespan
├── frontend/                         # Next.js Full-Stack Workspace
│   ├── app/
│   │   ├── layout.tsx                # Inter Typography & Dark Theme Root
│   │   ├── page.tsx                  # Ingestion Landing Page & Health Indicator
│   │   └── workspace/page.tsx        # 3-Pane AI Research Workspace Route
│   ├── components/
│   │   ├── video/VideoPane.tsx       # Embedded Synced YouTube Player
│   │   ├── video/TranscriptModal.tsx # Full Searchable Transcript Viewer
│   │   ├── chat/ChatPane.tsx         # Real-Time SSE Chat with [▶ MM:SS] Pills
│   │   ├── knowledge/KnowledgePane.tsx # Raw Semantic Vector Search
│   │   └── navigation/VideoLibraryDrawer.tsx # Disk Index Library Drawer
│   └── lib/
│       ├── api.ts                    # Typed API Client & SSE Stream Consumer
│       └── utils.ts                  # Class Merging & Timestamp Parser
├── config.py                         # Central Configuration & OpenAI Factories
├── ingestion.py                      # Multi-Dialect Subtitle ETL & Vector Indexer
├── rag_chain.py                      # LCEL RAG Prompt & Pipeline Assembly

├── utils.py                          # Regex Extractors & oEmbed Helpers
├── main.py                           # Interactive Terminal CLI
├── Dockerfile                        # Production Backend Container
├── docker-compose.yml                # Multi-service Container Orchestration
├── requirements.txt                  # Pinned Python Dependencies
└── .env.example                      # Environment Variable Template
```

---

## ⚡ How to Run

### 1. Configure Environment
```bash
git clone https://github.com/SwayamAg/YT-RAG-Bot-Semantic-Video-Intelligence.git
cd YT-RAG-Bot-Semantic-Video-Intelligence
cp .env.example .env
```

Add your OpenAI key to `.env`:
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

---

### 2. Start the Backend (FastAPI)

```powershell
# Windows
.\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Linux / Mac
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```
- Swagger API Docs: **`http://localhost:8000/docs`**
- Healthcheck: **`http://localhost:8000/health`**

---

### 3. Start the Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser!

---

### 4. Or Run via Docker Compose (Local Development)
```bash
docker compose up --build
```

---


## 🌐 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health and active model configuration status |
| `POST` | `/api/v1/video/info` | Inspect video ID, title, and disk cache status |
| `POST` | `/api/v1/ingest` | Ingest and vectorize a video transcript into FAISS |
| `POST` | `/api/v1/chat` | Primary RAG Q&A generating timestamp-grounded answers |
| `POST` | `/api/v1/chat/stream` | **Real-time SSE token stream** for low-latency chat |
| `POST` | `/api/v1/search` | Raw semantic similarity search returning top-K chunks |
| `GET` | `/api/v1/video/{video_id}/transcript` | Get full timestamped transcript segments |
| `GET` | `/api/v1/indexes` | List all persisted video vector indices on disk |
| `DELETE` | `/api/v1/indexes/{video_id}` | Purge a cached vector index from disk |

---

## 💬 Verified Example Q&A Output

**Video**: *[What's The Most Expensive Thing Ever? (jXwOcpkMQAA)](https://www.youtube.com/watch?v=jXwOcpkMQAA)*

```text
OVERVIEW:
Antimatter is discussed as the most expensive substance in existence.

CORE WORKFLOW / KEY CONCEPTS:
- A single gram of antimatter releases energy equivalent to three Hiroshima nuclear bombs upon annihilation.
- Production requires particle acceleration by firing particles at high speeds into a metal rod and capturing resulting debris.

TECHNICAL HIGHLIGHTS:
- Antimatter production requires extreme vacuum conditions and particle acceleration techniques.
- CERN has generated less than 10 billionths of a gram throughout its entire operational history.

TIMESTAMPS:
- [07:37] Introduction to antimatter and energy potential.
- [07:51] Antimatter annihilation energy comparison.
- [08:10] Antimatter production mechanics and particle acceleration challenges.
```

---

## 🔮 Future Scope & Evolution Roadmap

> 📖 **Full Architectural Ideation**: For the complete technical ideation, UI design wireframes (`assistant-ui` + shadcn/ui), RAG evaluation methodology, and multi-video research roadmap, see the [Full-Stack Ideation Document](./Ideation.md).

### 🎯 V2 — Retrieval Quality & Intelligence (In Progress)
- **🔀 Hybrid Search + Late-Interaction Reranking (`Dense + BM25 + FlashRank`)**
  - *Why*: Dense vector search can overlook exact technical identifiers (e.g., model weights, specific code flags, numbers).
  - *Implementation*: Run dense FAISS embeddings alongside sparse BM25, combine candidate pools with Reciprocal Rank Fusion (RRF), and score top-20 with a FlashRank cross-encoder.
- **📊 Quantitative RAG Evaluation (Ragas Framework)**
  - *Why*: Systematically track Faithfulness, Answer Relevance, Context Precision, and Recall@K across chunk size variations (500 vs. 1000) and prompt adjustments instead of subjective testing.
- **📑 Automated Chapter & Timeline Detection**
  - *Why*: Provide an auto-generated structural outline of long lectures, allowing users to skim topics before querying.
  - *Implementation*: LLM-driven transcript segmentation clustering timestamps into thematic topic milestones.

### 🔬 V2.5 — Experimental Multimodal Video Analysis Layer (`Adversal.AI`)
- **Visual Video Intelligence (Optional Add-on)**
  - *Concept*: An optional enrichment layer running alongside the core FAISS transcript pipeline (not replacing it).
  - *Why*: Enables answering questions beyond audio transcripts, such as *"What architecture diagram is shown on screen at 12:32?"* or *"What terminal error was shown at 18:40?"*.
  - *Evaluation Guardrails*: Rigorously benchmark API latency, OCR/diagram comprehension quality, and costs before considering any core dependency status. Pure transcript RAG remains the instant default path.

### 🚀 V3 — Multi-Modal & Large-Scale Expansion
- **🎬 Native Multi-Modal Video RAG (Keyframe Vector Search with ColPali / CLIP)**
  - *Why*: Direct local embedding of video keyframes for visual similarity without third-party API dependencies.
- **🎙️ Speaker Diarization (`whisperx` / `pyannote.audio`)**
  - *Why*: In podcasts and debates, attributing statements correctly requires speaker identification tags (`[Host]` vs. `[Guest]`).
- **⚡ Google TurboQuant / TurboVec / Qdrant Enterprise Scaling**
  - *Why*: Scaling to thousands of video archives with ~8x memory compression and cloud persistence.
- **📚 Multi-Video Workspace Research**
  - *Why*: Query across playlist archives or related technical lectures simultaneously with cross-video synthesis.



---

## 👨‍💻 Author

- **Name**: Swayam Agarwal  
- **LinkedIn**: [linkedin.com/in/swayam-agarwal](https://www.linkedin.com/in/swayam-agarwal/)  
- **GitHub**: [github.com/SwayamAg](https://github.com/SwayamAg)  
- **Email**: swayamagarwal19@gmail.com

