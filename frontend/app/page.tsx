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
  Cpu,
  Globe,
  AlertCircle,
  BookOpen,
  FileText,
  Zap,
  Database
} from "lucide-react";




import { useRouter } from "next/navigation";
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
  const router = useRouter();
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

      // Automatically redirect to 3-Pane Workspace after 800ms
      setTimeout(() => {
        router.push(`/workspace?v=${ingestRes.video_id}`);
      }, 800);

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

      {/* Top Navigation Bar */}
      <header className="relative z-10 border-b border-white/[0.06] bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Video className="h-5 w-5 text-white" />
            </div>

            <div className="flex flex-col text-left">
              <span className="font-semibold tracking-tight text-white flex items-center gap-2 text-base">
                Vid<span className="text-purple-400">Sense</span>
              </span>
              <span className="text-[10px] text-slate-400 -mt-0.5 tracking-wide font-medium hidden sm:inline">
                Semantic Video Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#how-it-works"
              className="text-xs text-slate-400 hover:text-white transition-colors hidden sm:inline font-medium"
            >
              How It Works
            </a>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            <a
              href="https://github.com/SwayamAg/YT-RAG-Bot-Semantic-Video-Intelligence"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition-all font-medium"
            >
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            {/* Backend Health Status Badge */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.02] text-xs">
              <span className={`h-2 w-2 rounded-full ${health?.status === "healthy" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-slate-400 text-[11px] font-mono hidden md:inline">
                {backendLoading ? "Connecting..." : health?.status === "healthy" ? "API Online" : "API Offline"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto px-6 pt-14 pb-24 flex flex-col items-center justify-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-300 text-xs font-medium mb-6 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span>Semantic Video Intelligence & RAG Assistant</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white max-w-3xl leading-[1.12]">
          Turn Any YouTube Video into an{" "}
          <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
            Interactive Knowledge Base
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Ground AI responses strictly in factual video context with semantic retrieval, verified answers, and interactive timestamp citations.
        </p>



        {/* Input Bar */}
        <div className="w-full max-w-2xl mt-10">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }}
            className="glass-panel p-2 rounded-2xl flex flex-col sm:flex-row items-center gap-2 shadow-2xl shadow-purple-950/30 glow-purple"
          >
            <div className="flex items-center gap-3 px-3 w-full">
              <Search className="h-5 w-5 text-slate-400 shrink-0" aria-hidden="true" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube Video URL or ID (e.g. https://www.youtube.com/watch?v=...)"
                aria-label="YouTube Video URL or ID"
                className="w-full bg-transparent border-none text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none"
                disabled={analyzing}
              />
            </div>
            <button
              type="submit"
              disabled={analyzing || !url.trim()}
              aria-label="Analyze YouTube Video"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shrink-0 cursor-pointer"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Analyze</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08] gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {videoInfo && (
                  <div className="relative w-24 aspect-video rounded-lg overflow-hidden border border-white/10 shrink-0 bg-slate-900 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${videoInfo.video_id}/mqdefault.jpg`}
                      alt={videoInfo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-purple-400 shrink-0" />
                    <span>RAG Ingestion Pipeline</span>
                  </h2>
                  {videoInfo && (
                    <p className="text-xs text-slate-300 mt-1 truncate max-w-sm font-medium" title={videoInfo.title}>
                      {videoInfo.title}
                    </p>
                  )}
                </div>
              </div>
              {videoInfo?.is_cached && (
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0 font-medium">
                  Cached in FAISS
                </span>
              )}
            </div>


            {/* Comprehensive Structured Error Banner */}
            {errorMessage && (
              <div className="p-4 mb-5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs flex items-start gap-3 animate-in fade-in duration-200">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <div className="font-semibold text-red-300">
                    {(() => {
                      const msg = errorMessage.toLowerCase();
                      if (msg.includes("failed to fetch") || msg.includes("network") || msg.includes("connection")) return "FastAPI Backend Connection Error";
                      if (msg.includes("rate-limited") || msg.includes("429") || msg.includes("too many requests") || msg.includes("bot")) return "YouTube Cloud Rate-Limit / Bot Challenge";
                      if (msg.includes("age") || msg.includes("private") || msg.includes("sign in")) return "Video Privacy or Age Restricted";
                      if (msg.includes("not found") || msg.includes("invalid") || msg.includes("deleted")) return "Invalid / Deleted YouTube Video";
                      if (msg.includes("live")) return "Live Stream Transcript Not Finalized";
                      if (msg.includes("openai") || msg.includes("quota") || msg.includes("api key")) return "OpenAI Service / Quota Error";
                      if (msg.includes("subtitles") || msg.includes("transcript") || msg.includes("captions")) return "YouTube Transcript Access Restricted";
                      return "Ingestion Pipeline Diagnostic Alert";
                    })()}
                  </div>
                  <p className="text-red-300/90 leading-relaxed font-mono text-[11px] bg-red-950/40 px-2.5 py-1.5 rounded-lg border border-red-500/20">
                    {errorMessage}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {(() => {
                      const msg = errorMessage.toLowerCase();
                      if (msg.includes("rate-limited") || msg.includes("429") || msg.includes("bot")) return "Reason: YouTube has temporarily throttled subtitle requests from the server's cloud IP. Try again in 60 seconds or test with a video that has verified manual captions.";
                      if (msg.includes("age") || msg.includes("private") || msg.includes("sign in")) return "Reason: This video requires YouTube authentication or is restricted to viewers over 18.";
                      if (msg.includes("subtitles") || msg.includes("transcript") || msg.includes("captions")) return "Reason: The uploader has disabled closed captions, or automated transcription is not enabled for this specific upload.";
                      if (msg.includes("failed to fetch") || msg.includes("network")) return "Reason: Unable to reach the backend service. If using Render free tier, allow ~30s for container cold start.";
                      if (msg.includes("live")) return "Reason: Active YouTube live streams cannot be ingested until the broadcast ends and YouTube compiles the full subtitle file.";
                      if (msg.includes("openai") || msg.includes("quota")) return "Reason: OpenAI API rate limit reached or account quota exceeded.";
                      return "Reason: The extraction service encountered an unexpected error while resolving this video stream.";
                    })()}
                  </p>
                </div>
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
                <button
                  onClick={() => router.push(`/workspace?v=${videoInfo?.video_id}`)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <span>Open Research Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

          </div>
        )}

        {/* Key Capabilities Feature Grid */}
        <div className="w-full max-w-5xl mt-20 text-left">
          <div className="mb-6 text-center sm:text-left">
            <h2 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Key Capabilities</h2>
            <p className="text-lg font-bold text-white mt-1">Built for Accuracy & Speed</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl hover:border-purple-500/30 transition-all">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                <Clock className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Timestamp Grounding</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Answers reference exact moments with verifiable, clickable [MM:SS] video citations.
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl hover:border-indigo-500/30 transition-all">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Reliable Transcript Extraction</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Automated multi-engine extraction ensures reliable ingestion even on complex cloud servers.
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl hover:border-emerald-500/30 transition-all">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <Globe className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Global Dialect Coverage</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Universal support for all English dialects (en, en-orig, US, GB, IN, CA, AU) and Hindi.
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl hover:border-sky-500/30 transition-all">
              <div className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Isolated Vector Spaces</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Every video gets its own dedicated FAISS index on disk, eliminating cross-video hallucination.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works Architecture Section */}
        <section id="how-it-works" className="w-full max-w-5xl mt-24 text-left scroll-mt-20">
          <div className="text-center sm:text-left mb-8">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Architecture</span>
            <h2 className="text-2xl font-bold text-white mt-1">How VidSense Works</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              A genuine Retrieval-Augmented Generation pipeline connecting raw YouTube audio transcripts to factual LLM answers.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border-white/[0.08]">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
              {[
                { step: "1", title: "YouTube URL", desc: "Metadata & ID resolution" },
                { step: "2", title: "Transcript", desc: "yt-dlp & timestamp parsing" },
                { step: "3", title: "Chunking", desc: "1000 char recursive split" },
                { step: "4", title: "Embeddings", desc: "OpenAI 1536-dim vectors" },
                { step: "5", title: "FAISS Index", desc: "Sub-millisecond similarity" },
                { step: "6", title: "Context", desc: "Top-k grounded chunks" },
                { step: "7", title: "Grounded Answer", desc: "SSE streamed with [MM:SS]" },
              ].map((item, idx) => (
                <div key={item.step} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center">
                  <span className="h-6 w-6 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold flex items-center justify-center mb-2">
                    {item.step}
                  </span>
                  <span className="text-xs font-semibold text-white">{item.title}</span>
                  <span className="text-[10px] text-slate-400 mt-1 leading-tight">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="w-full max-w-5xl mt-20 text-left">
          <div className="text-center sm:text-left mb-8">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Applications</span>
            <h2 className="text-2xl font-bold text-white mt-1">Built for Deep Comprehension</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl hover:border-purple-500/30 transition-all">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                <BookOpen className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Learning</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Ask targeted questions about lectures, tutorials, and courses without scrubbing through hours of video.
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl hover:border-indigo-500/30 transition-all">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <Search className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Research</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Locate specific technical claims, statistics, and citations across long-form video archives.
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl hover:border-emerald-500/30 transition-all">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Content Analysis</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Extract core concepts, frameworks, and counter-arguments systematically from conference talks.
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl hover:border-sky-500/30 transition-all">
              <div className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3">
                <Zap className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Quick Understanding</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Get rapid, trustworthy answers when you need the core insight and don&apos;t have time to watch the full video.
              </p>
            </div>
          </div>
        </section>
      </main>


      {/* Professional Product & Portfolio Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-slate-950/60 backdrop-blur-md py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white tracking-tight text-sm">Vid<span className="text-purple-400">Sense</span></span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Semantic Video Intelligence & RAG Assistant</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Turn any YouTube video into an interactive knowledge base with grounded answers.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1.5">
            <div className="flex items-center gap-2 text-slate-300">
              <span>Built by <strong className="text-white font-medium">Swayam Agarwal</strong></span>
            </div>
            <span className="text-[11px] text-purple-400/90 font-mono">
              AI/ML Engineer | RAG • LLMs • Computer Vision
            </span>
            <div className="flex items-center gap-3 mt-1 text-slate-400">
              <a
                href="https://github.com/SwayamAg"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <span>GitHub</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-slate-700">•</span>
              <a
                href="https://www.linkedin.com/in/swayam-agarwal/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-sky-400 transition-colors flex items-center gap-1"
              >
                <span>LinkedIn</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-slate-700">•</span>
              <a
                href="https://github.com/SwayamAg/YT-RAG-Bot-Semantic-Video-Intelligence"
                target="_blank"
                rel="noreferrer"
                className="hover:text-purple-300 transition-colors flex items-center gap-1"
              >
                <span>Source Code</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 mt-6 pt-4 border-t border-white/[0.04] text-center text-[11px] text-slate-600">
          © 2026 Swayam Agarwal. All rights reserved.
        </div>
      </footer>
    </div>
  );
}


