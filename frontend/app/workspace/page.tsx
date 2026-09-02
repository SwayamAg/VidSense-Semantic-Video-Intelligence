"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Video, ExternalLink, Loader2, Database } from "lucide-react";
import VideoPane from "@/components/video/VideoPane";
import ChatPane from "@/components/chat/ChatPane";
import KnowledgePane from "@/components/knowledge/KnowledgePane";
import VideoLibraryDrawer from "@/components/navigation/VideoLibraryDrawer";
import { getVideoInfo } from "@/lib/api";

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoParam = searchParams.get("v") || "";

  const [videoTitle, setVideoTitle] = useState<string>("Loading video details...");
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);


  // Load video title metadata
  useEffect(() => {
    if (!videoParam) {
      router.push("/");
      return;
    }

    async function loadMeta() {
      try {
        const info = await getVideoInfo(videoParam);
        setVideoTitle(info.title);
      } catch {
        setVideoTitle(`Video ID: ${videoParam}`);
      } finally {
        setLoading(false);
      }
    }

    loadMeta();
  }, [videoParam, router]);

  const handleTimestampClick = (seconds: number) => {
    setSeekTime(seconds);
  };

  if (!videoParam) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-[#060810] text-slate-100 overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 border-b border-white/[0.08] bg-slate-950/60 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>New Video</span>
          </Link>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-md">
              <Video className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-white tracking-tight hidden sm:inline">
              Vid<span className="text-purple-400">Sense</span>
            </span>

          </div>

          <span className="text-xs text-slate-400 max-w-sm truncate hidden md:inline" title={videoTitle}>
            / {loading ? "Resolving..." : videoTitle}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLibrary(true)}
            className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all font-medium"
          >
            <Database className="h-3.5 w-3.5" />
            <span>Library</span>
          </button>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />


          <a
            href="https://github.com/SwayamAg"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-white transition-colors hidden sm:flex items-center gap-1"
          >
            GitHub <ExternalLink className="h-3 w-3" />
          </a>

          <a
            href="https://www.linkedin.com/in/swayam-agarwal/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-sky-400 transition-colors hidden sm:flex items-center gap-1"
          >
            LinkedIn <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </header>


      <VideoLibraryDrawer
        isOpen={showLibrary}
        currentVideoId={videoParam}
        onClose={() => setShowLibrary(false)}
      />


      {/* 3-Pane Grid Workspace */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Pane: Video Player (3 cols on large screen) */}
        <section className="lg:col-span-3 h-full overflow-hidden border-b lg:border-b-0">
          <VideoPane
            videoId={videoParam}
            videoTitle={videoTitle}
            seekTime={seekTime}
            onSeekComplete={() => setSeekTime(null)}
          />
        </section>

        {/* Center Pane: AI Research Chat (6 cols on large screen) */}
        <section className="lg:col-span-6 h-full overflow-hidden border-b lg:border-b-0">
          <ChatPane videoId={videoParam} onTimestampClick={handleTimestampClick} />
        </section>

        {/* Right Pane: Retrieved Knowledge & Citations (3 cols on large screen) */}
        <section className="lg:col-span-3 h-full overflow-hidden">
          <KnowledgePane videoId={videoParam} onTimestampClick={handleTimestampClick} />
        </section>
      </main>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-[#060810] text-purple-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <WorkspaceContent />
    </Suspense>
  );
}
