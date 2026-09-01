import os
import warnings
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

warnings.filterwarnings("ignore", message="urllib3 .* or chardet .* doesn't match a supported version!")

from app.api.routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation
    print("[API LIFESPAN] Starting YouTube RAG REST Service...")
    yield
    print("[API LIFESPAN] Shutting down YouTube RAG REST Service...")

app = FastAPI(
    title="YouTube RAG Bot API",
    description="Production-grade Semantic Video Intelligence API powered by LangChain, FAISS, and OpenAI.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Enable CORS for Streamlit / React / Web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routes
app.include_router(router)

@app.get("/", include_in_schema=False)
def root():
    """Redirect root to interactive Swagger API documentation."""
    return RedirectResponse(url="/docs")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
