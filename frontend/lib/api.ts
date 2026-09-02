/**
 * Typed client connecting Next.js to the FastAPI backend (http://localhost:8000)
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface HealthResponse {
  status: string;
  openai_configured: boolean;
  chat_model: string;
  embedding_model: string;
}

export interface VideoInfoResponse {
  video_id: string;
  title: string;
  is_cached: boolean;
}

export interface IngestResponse {
  video_id: string;
  title: string;
  status: string;
  is_fallback: boolean;
  message: string;
}

export interface ChatResponse {
  video_id: string;
  video_title: string;
  question: string;
  answer: string;
  is_fallback: boolean;
}

export interface SearchChunk {
  chunk_index: number;
  content: string;
}

export interface SearchResponse {
  video_id: string;
  query: string;
  results_count: number;
  chunks: SearchChunk[];
}

export interface IndexItem {
  video_id: string;
  index_path: string;
}

export interface IndexListResponse {
  total_indexed: number;
  indices: IndexItem[];
}

export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Health check failed with status: ${res.status}`);
  return res.json();
}

export async function getVideoInfo(urlOrId: string): Promise<VideoInfoResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/video/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url_or_id: urlOrId }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Failed to fetch video info" }));
    throw new Error(errorData.detail || "Failed to fetch video info");
  }
  return res.json();
}

export async function ingestVideo(urlOrId: string, forceReindex: boolean = false): Promise<IngestResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url_or_id: urlOrId, force_reindex: forceReindex }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Ingestion failed" }));
    throw new Error(errorData.detail || "Ingestion failed");
  }
  return res.json();
}

export async function chatWithVideo(urlOrId: string, question: string): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url_or_id: urlOrId, question }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Chat request failed" }));
    throw new Error(errorData.detail || "Chat request failed");
  }
  return res.json();
}

/**
 * Streams tokens using Server-Sent Events (SSE) from the FastAPI backend.
 */
export async function streamChatWithVideo(
  urlOrId: string,
  question: string,
  onToken: (token: string) => void,
  onDone?: () => void,
  onError?: (err: Error) => void
): Promise<void> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url_or_id: urlOrId, question }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: "Streaming chat failed" }));
      throw new Error(errorData.detail || "Streaming chat failed");
    }

    if (!res.body) {
      throw new Error("No response body available for streaming");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data:")) {
          const dataStr = trimmed.replace("data:", "").trim();
          if (dataStr === "[DONE]") {
            if (onDone) onDone();
            return;
          }
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.token) {
              onToken(parsed.token);
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch {
            // Ignore non-json or malformed chunks
          }
        }
      }
    }

    if (onDone) onDone();
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    if (onError) onError(error);
    else throw error;
  }
}


export async function searchVideo(urlOrId: string, query: string, k: number = 4): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url_or_id: urlOrId, query, k }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Semantic search failed" }));
    throw new Error(errorData.detail || "Semantic search failed");
  }
  return res.json();
}

export async function listIndexes(): Promise<IndexListResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/indexes`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to list cached indices");
  return res.json();
}

export interface TranscriptSegment {
  timestamp: string;
  time_str: string;
  text: string;
}

export interface TranscriptResponse {
  video_id: string;
  title: string;
  total_segments: number;
  segments: TranscriptSegment[];
}

export async function getTranscript(videoId: string): Promise<TranscriptResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/video/${videoId}/transcript`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch video transcript");
  return res.json();
}

