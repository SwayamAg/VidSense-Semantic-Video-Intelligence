import os
import sys
import warnings
from dotenv import load_dotenv

# Suppress known urllib3/requests version mismatch warnings
warnings.filterwarnings("ignore", message="urllib3 .* or chardet .* doesn't match a supported version!")

from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from utils import extract_video_id

# Load environment variables
load_dotenv()

# --- Project Constants ---
_raw_url_or_id = os.getenv("YOUTUBE_URL") or os.getenv("YOUTUBE_VIDEO_ID", "Gfr50f6ZBvo")
YOUTUBE_VIDEO_ID = extract_video_id(_raw_url_or_id)

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
FAISS_INDEX_PATH = "faiss_index"
LOCAL_TRANSCRIPT_PATH = "transcript.txt"

# Retriever settings
RETRIEVAL_K = 4
SEARCH_TYPE = "similarity"

# OpenAI Model settings
DEFAULT_OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
DEFAULT_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

def validate_env():
    """Validates that all necessary OpenAI environment variables are set."""
    required = [
        "OPENAI_API_KEY"
    ]
    missing = [var for var in required if not os.getenv(var)]
    if missing:
        print(f"[ERROR] Missing environment variables: {', '.join(missing)}")
        print("Please check your .env file and ensure OPENAI_API_KEY is set.")
        return False
    return True

def get_llm():
    """Initializes and returns the OpenAI Chat model."""
    if not validate_env():
        sys.exit(1)
        
    kwargs = {
        "model": os.getenv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL),
        "api_key": os.getenv("OPENAI_API_KEY"),
        "temperature": 0.2,
    }
    base_url = os.getenv("OPENAI_BASE_URL")
    if base_url:
        kwargs["base_url"] = base_url

    return ChatOpenAI(**kwargs)

def get_embeddings():
    """Initializes and returns the OpenAI Embeddings model."""
    if not validate_env():
        sys.exit(1)
        
    kwargs = {
        "model": os.getenv("OPENAI_EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL),
        "api_key": os.getenv("OPENAI_API_KEY"),
    }
    base_url = os.getenv("OPENAI_BASE_URL")
    if base_url:
        kwargs["base_url"] = base_url

    return OpenAIEmbeddings(**kwargs)

