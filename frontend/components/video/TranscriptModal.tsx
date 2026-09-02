"use client";

import { useState, useEffect } from "react";
import { X, Search, Play, FileText, Loader2, Clock } from "lucide-react";
import { getTranscript, TranscriptSegment } from "@/lib/api";
import { parseTimestampToSeconds } from "@/lib/utils";

interface TranscriptModalProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  onSeek: (seconds: number) => void;
}

export default function TranscriptModal({
  videoId,
  isOpen,
  onClose,
  onSeek,
}: TranscriptModalProps) {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (isOpen && videoId) {
      setLoading(true);
      getTranscript(videoId)
        .then((res) => {
          setSegments(res.segments || []);
        })
        .catch(() => {
          setSegments([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, videoId]);

  if (!isOpen) return null;

  const filtered = segments.filter((seg) =>
    seg.text.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-3xl max-h-[85vh] rounded-2xl flex flex-col border border-white/10 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Full Video Transcript</h2>
              <p className="text-[11px] text-slate-400">
                {segments.length > 0 ? `${segments.length} timestamped lines` : "Loading segments..."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Input */}
        <div className="p-3 border-b border-white/[0.08] bg-slate-950/30">
          <div className="glass-panel px-3 py-2 rounded-xl flex items-center gap-2 border-white/10">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search transcript lines (e.g., 'price', 'carbon', 'formula')..."
              className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
            />
            {filter && (
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                {filtered.length} matches
              </span>
            )}
          </div>
        </div>

        {/* Transcript Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && (
            <div className="py-16 text-center text-xs text-purple-400 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading full subtitle transcript...</span>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center text-xs text-slate-500">
              {filter ? "No matching transcript lines found." : "No transcript lines available for this video."}
            </div>
          )}

          {!loading &&
            filtered.map((seg, idx) => {
              const seconds = parseTimestampToSeconds(seg.time_str);
              return (
                <div
                  key={idx}
                  onClick={() => {
                    onSeek(seconds);
                    onClose();
                  }}
                  className="p-2.5 rounded-xl hover:bg-white/[0.04] transition-all flex items-start gap-3 cursor-pointer group border border-transparent hover:border-white/[0.06]"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeek(seconds);
                      onClose();
                    }}
                    className="shrink-0 px-2 py-0.5 rounded-md bg-purple-600/20 group-hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-[11px] font-mono flex items-center gap-1 transition-colors"
                    title={`Jump to ${seg.time_str}`}
                  >
                    <Play className="h-2.5 w-2.5 fill-purple-300" />
                    <span>{seg.time_str}</span>
                  </button>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans group-hover:text-white transition-colors">
                    {seg.text}
                  </p>
                </div>
              );
            })}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Click any timestamp or line to jump directly in the player</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg border border-white/10 hover:bg-white/[0.06] text-slate-300 text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
