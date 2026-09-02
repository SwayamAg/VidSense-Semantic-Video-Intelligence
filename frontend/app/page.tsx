"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Sparkles, 
  Video, 
  ArrowRight, 
  CheckCircle2, 
  Circle, 
  Loader2, 
  ShieldCheck, 
  Layers, 
  Clock, 
  ExternalLink,
  Cpu
} from "lucide-react";

import { checkHealth, getVideoInfo, ingestVideo, HealthResponse, VideoInfoResponse } from "@/lib/api";

interface PipelineStep {
  id: string;
  label: string;
  status: "idle" | "running" | "done" | "error";
}

const SAMPLE_VIDEOS = [
  {
    title: "What's The Most Expensive Thing Ever?",
    url: "https://www.youtube.com/watch?v=jXwOcpkMQAA",
    tag: "Science & Value"
  },
  {
    title: "Demis Hassabis: DeepMind & Future of AI",
    url: "https://www.youtube.com/watch?v=Gfr50f6ZBvo",
    tag: "Artificial Intelligence"
  }
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [backendLoading, setBackendLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfoResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: "validate", label: "Validating Video & Resolving Metadata", status: "idle" },
    { id: "transcript", label: "Extracting Timestamped Subtitles (yt-dlp)", status: "idle" },
    { id: "chunking", label: "Recursive Character Splitting (chunk=1000, overlap=200)", status: "idle" },
    { id: "embed", label: "Generating Vectors (text-embedding-3-small)", status: "idle" },
    { id: "ready", label: "FAISS Vector Store Ready for Chat", status: "idle" },
  ]);

  // Check backend health on mount
  useEffect(() => {
    async function fetchHealth() {
      try {
        const data = await checkHealth();
        setHealth(data);
      } catch {
        setHealth(null);
      } finally {
        setBackendLoading(false);
      }
    }
    fetchHealth();
  }, []);

  const handleAnalyze = async (targetUrl?: string) => {
    const inputUrl = targetUrl || url;
    if (!inputUrl.trim()) return;

    setAnalyzing(true);
    setErrorMessage(null);
    setVideoInfo(null);

    // Reset steps
    setSteps([
      { id: "validate", label: "Validating Video & Resolving Metadata", status: "running" },
      { id: "transcript", label: "Extracting Timestamped Subtitles (yt-dlp)", status: "idle" },
      { id: "chunking", label: "Recursive Character Splitting (chunk=1000, overlap=200)", status: "idle" },
      { id: "embed", label: "Generating Vectors (text-embedding-3-small)", status: "idle" },
      { id: "ready", label: "FAISS Vector Store Ready for Chat", status: "idle" },
    ]);

    try {
      // Step 1: Video Info
      const info = await getVideoInfo(inputUrl);
      setVideoInfo(info);
      setSteps(prev => [
        { ...prev[0], status: "done" },
        { ...prev[1], status: "running" },
        ...prev.slice(2)
      ]);

      // Step 2-4: Ingest (FastAPI handles transcript, chunking, and embedding)
      const ingestRes = await ingestVideo(inputUrl);
      
      setSteps(prev => [
        { ...prev[0], status: "done" },
        { ...prev[1], status: "done" },
        { ...prev[2], status: "done" },
        { ...prev[3], status: "done" },
        { ...prev[4], status: "done" },
      ]);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze video";
      setErrorMessage(msg);
      setSteps(prev => prev.map(s => s.status === "running" ? { ...s, status: "error" } : s));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#060810] selection:bg-purple-500/20 selection:text-purple-300">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[140px]" />
        <div className="absolute top-[10%] right-[15%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[140px]" />
      </div>

      {/* Top Navigation */}
      <header className="relative z-10 border-b border-white/[0.06] bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Video className="h-5 w-5 text-white" />
            </div>

            <div className="flex flex-col">
              <span className="font-semibold tracking-tight text-white flex items-center gap-2">
                YT-RAG<span className="text-purple-400">Bot</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                  v2.0
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Backend Health Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.02] text-xs">
              <span className={`h-2 w-2 rounded-full ${health?.status === "healthy" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-slate-300">
                {backendLoading ? "Connecting..." : health?.status === "healthy" ? "FastAPI Online" : "FastAPI Disconnected"}
              </span>
            </div>

            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              Swagger Docs <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto px-6 pt-16 pb-24 flex flex-col items-center justify-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-300 text-xs font-medium mb-6 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span>Semantic Video Intelligence & Research Workspace</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white max-w-3xl leading-[1.12]">
          Turn Any YouTube Video into an{" "}
          <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
            Interactive Knowledge Base
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Ground AI responses strictly in factual video context. Extract timestamps, inspect source citations, and query video transcripts with sub-second retrieval.
        </p>

        {/* Input Bar */}
        <div className="w-full max-w-2xl mt-10">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }}
            className="glass-panel p-2 rounded-2xl flex flex-col sm:flex-row items-center gap-2 shadow-2xl shadow-purple-950/30 glow-purple"
          >
            <div className="flex items-center gap-3 px-3 w-full">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube Video URL or ID (e.g. https://www.youtube.com/watch?v=...)"
                className="w-full bg-transparent border-none text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none"
                disabled={analyzing}
              />
            </div>
            <button
              type="submit"
              disabled={analyzing || !url.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shrink-0"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Analyze</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Sample quick buttons */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span className="text-slate-500">Try an example:</span>
            {SAMPLE_VIDEOS.map((v) => (
              <button
                key={v.url}
                onClick={() => { setUrl(v.url); handleAnalyze(v.url); }}
                disabled={analyzing}
                className="px-3 py-1 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] hover:border-purple-500/40 text-slate-300 transition-all flex items-center gap-1.5"
              >
                <span>{v.title}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300">{v.tag}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline Execution Card */}
        {(analyzing || videoInfo || errorMessage) && (
          <div className="w-full max-w-2xl mt-8 glass-panel p-6 rounded-2xl border border-white/10 text-left animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-purple-400" />
                  <span>RAG Ingestion Pipeline</span>
                </h2>
                {videoInfo && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">
                    {videoInfo.title}
                  </p>
                )}
              </div>
              {videoInfo?.is_cached && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Cached in FAISS
                </span>
              )}
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Pipeline progress items */}
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-3 text-xs">
                  {step.status === "done" && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                  {step.status === "running" && (
                    <Loader2 className="h-4 w-4 text-purple-400 animate-spin shrink-0" />
                  )}
                  {step.status === "idle" && (
                    <Circle className="h-4 w-4 text-slate-600 shrink-0" />
                  )}
                  {step.status === "error" && (
                    <span className="h-4 w-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-[10px]">✕</span>
                  )}
                  <span className={`${step.status === "done" ? "text-slate-300" : step.status === "running" ? "text-purple-300 font-medium" : "text-slate-500"}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Success Action */}
            {steps[4].status === "done" && (
              <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
                <span className="text-xs text-emerald-400 font-medium">
                  ✓ Ready for conversational reasoning
                </span>
                <span className="text-xs text-purple-400 font-mono">
                  Vector Space Synchronized
                </span>
              </div>
            )}
          </div>
        )}

        {/* Feature Pill Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl mt-20 text-left">
          <div className="glass-card p-5 rounded-2xl">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Temporal Timestamp Grounding</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Captures video milliseconds and transforms them into verifiable [MM:SS] video citations.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <Layers className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Triple Ingestion Redundancy</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Automated failover between yt-dlp pro-fetch, standard scrapers, and local fallbacks.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Isolated Vector Spaces</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Persistent FAISS indices isolated by Video ID to eliminate hallucination across videos.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
