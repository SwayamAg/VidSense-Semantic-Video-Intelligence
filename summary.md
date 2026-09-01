# YT-RAG Bot: Technical Architecture & Methodology

## 🛠 SDE Perspective: Design Goals
As a senior developer, this project was architected with three core principles in mind:
1.  **Modularity**: Separation of concerns between configuration, data ingestion, and business logic.
2.  **Robustness**: Handling network-sensitive operations (YouTube scraping) with automated fallbacks.
3.  **Configurability**: Clean OpenAI model configuration with flexible environment variables.

---

## 🏗 System Architecture & Data Flow

```mermaid
graph TD
    subgraph "Ingestion Layer"
        A[YouTube URL / Local File] --> B(Data Ingestion Engine)
        B --> C{Source Check}
        C -->|HTTP Fetch| D[YoutubeLoader / yt-dlp]
        C -->|IO Fallback| E[Local TextLoader]
        D --> F[Raw Transcript]
        E --> F
    end

    subgraph "Vectorization Layer"
        F --> G(Recursive Character Splitting)
        G --> H[Semantic Chunks]
        H --> I(OpenAI Embedding API)
        I --> J[(FAISS Vector DB)]
    end

    subgraph "RAG Engine (LCEL)"
        K[User Query] --> L(Vector Search)
        J --> L
        L --> M[Relevant Context]
        M --> N(Prompt Augmentation)
        K --> N
        N --> O(OpenAI Chat API)
        O --> P[Semantic Response]
    end
```

---

## 🔬 Technical Deep Dive

### 1. OpenAI API Integration
The system natively communicates with OpenAI's official API using `ChatOpenAI` and `OpenAIEmbeddings` via LangChain.
- **Configurability**: Configured via `OPENAI_API_KEY`, `OPENAI_MODEL` (e.g., `gpt-4o-mini` or `gpt-4o`), and `OPENAI_EMBEDDING_MODEL` (e.g., `text-embedding-3-small`).
- **Validation**: The `validate_env()` function ensures the API key is provided before initializing the application.

### 2. Semantic Chunking (Recursive Character Splitting)
**Why it matters**: Naive splitting (e.g., every 100 words) can cut through a middle of a sentence, destroying meaning.
- **Our Approach**: We use a recursive strategy that respects natural hierarchy (`\n\n` -> `\n` -> ` `).
- **Strategy**: `chunk_size=1000` with `chunk_overlap=200`. This ensures that even if a concept spans two chunks, the shared overlap allows the retriever to capture the context effectively.

### 3. Vector Search: FAISS vs Traditional Search
- **Traditional (Keyword)**: Fails on semantic intent (e.g., user asks for "AI benefits", transcript says "advantages of machine learning").
- **FAISS (L2 Distance)**: Maps text to a high-dimensional vector space. Search is a mathematical distance calculation.
- **Persistence**: We serialize the FAISS index to disk. This is critical for performance; once a video is indexed, sub-second responses are achieved without ever calling the YouTube API or Embedding API again.

---

## 🚀 How to Run (SDE Quickstart)

### 1. Configuration (`.env`)
Populate the following variables:
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
YOUTUBE_VIDEO_ID=Gfr50f6ZBvo
```

### 2. Execution
```bash
# Setup
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# Run
python main.py
```

---

## 💬 Input/Output Examples

**Query:** *"What is the main takeaway regarding scientific discovery?"*
**Retrieved Context**: *"...Demis Hassabis notes that AI is not just a tool for optimization, but a fundamental accelerator for the scientific method itself..."*
**Response:** *"The primary takeaway is that AI acts as a fundamental catalyst for scientific breakthroughs, enabling researchers to navigate complex problem spaces (like fusion energy or protein folding) at unprecedented speeds."*

---

## 🛠 Project Components
- `config.py`: Configuration factory and validation for OpenAI.
- `utils.py`: High-performance utility functions (Regex URL extraction).
- `ingestion.py`: The ETL pipeline (Extract, Transform, Load).
- `rag_chain.py`: Declarative pipeline definition using LangChain LCEL.
- `debug_openai.py`: Diagnostic script for validating OpenAI API access.
- `main.py`: CLI orchestration and state management.

