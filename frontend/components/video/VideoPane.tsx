"use client";

import { useState, useEffect, useRef } from "react";
import { ExternalLink, Play, Clock, Sparkles, FileText } from "lucide-react";
import TranscriptModal from "@/components/video/TranscriptModal";


interface VideoPaneProps {
  videoId: string;
  videoTitle: string;
  seekTime: number | null;
  onSeekComplete?: () => void;
}

export default function VideoPane({
  videoId,
  videoTitle,
  seekTime,
  onSeekComplete,
}: VideoPaneProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);


  // Send postMessage to YouTube Iframe whenever seekTime changes
  useEffect(() => {
    if (seekTime !== null && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: "seekTo",
          args: [seekTime, true],
        }),
        "*"
      );
      // Play after seek
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: "playVideo",
          args: [],
        }),
        "*"
      );

      if (onSeekComplete) {
        onSeekComplete();
      }
    }
  }, [seekTime, onSeekComplete]);

  return (
    <div className="flex flex-col h-full bg-[#080b14]/70 border-r border-white/[0.08] overflow-y-auto">
      {/* Video Header */}
      <div className="p-4 border-b border-white/[0.08]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
            Source Video
          </span>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            YouTube <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <h2 className="text-sm font-semibold text-white leading-snug line-clamp-2" title={videoTitle}>
          {videoTitle || "Loading video..."}
        </h2>
        <span className="text-[11px] font-mono text-slate-500 mt-1 block">ID: {videoId}</span>
      </div>

      {/* Embedded YouTube Player */}
      <div className="p-4">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-slate-950">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}&rel=0`}
            title="YouTube video player"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      {/* Synchronized seeking info banner */}
      <div className="px-4 pb-4">
        <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200/90 flex items-start gap-2.5">
          <Sparkles className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-purple-300">Timestamp Sync:</span> Click on any <span className="px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200 font-mono text-[10px]">▶ MM:SS</span> citation in the chat or sources panel to seek this video automatically.
          </p>
        </div>
      </div>

      {/* Metadata & Quick Jump Cards */}
      <div className="p-4 mt-auto border-t border-white/[0.08] text-xs text-slate-400 space-y-3">
        <button
          onClick={() => setShowTranscript(true)}
          className="w-full py-2.5 px-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-purple-500/40 text-slate-200 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <FileText className="h-3.5 w-3.5 text-purple-400" />
          <span>View Full Transcript</span>
        </button>

        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>Interactive Seeking</span>
          </span>
          <span className="text-emerald-400 font-medium">Active</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            <Play className="h-3.5 w-3.5 text-slate-500" />
            <span>YouTube IFrame API</span>
          </span>
          <span className="text-slate-300">Connected</span>
        </div>
      </div>

      <TranscriptModal
        videoId={videoId}
        isOpen={showTranscript}
        onClose={() => setShowTranscript(false)}
        onSeek={(seconds) => {
          if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({
                event: "command",
                func: "seekTo",
                args: [seconds, true],
              }),
              "*"
            );
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({
                event: "command",
                func: "playVideo",
                args: [],
              }),
              "*"
            );
          }
        }}
      />
    </div>
  );
}

