"use client";

import { useState } from "react";
import { Search, Layers, Play, Clock, Sparkles, Loader2, Database } from "lucide-react";
import { searchVideo, SearchChunk } from "@/lib/api";
import { parseTimestampToSeconds } from "@/lib/utils";

interface KnowledgePaneProps {
  videoId: string;
  onTimestampClick: (seconds: number) => void;
}

export default function KnowledgePane({ videoId, onTimestampClick }: KnowledgePaneProps) {
  const [query, setQuery] = useState("");
  const [chunks, setChunks] = useState<SearchChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await searchVideo(videoId, query.trim(), 4);
      setChunks(res.chunks || []);
    } catch {
      setChunks([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Helper to extract the first [MM:SS] timestamp from the chunk text
   */
  const extractFirstTimestamp = (text: string): { timestampStr: string; seconds: number } | null => {
    const match = text.match(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/);
    if (match) {
      return {
        timestampStr: match[1],
        seconds: parseTimestampToSeconds(match[1]),
      };
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-[#080b14]/70 border-l border-white/[0.08] overflow-y-auto">
      {/* Pane Header */}
      <div className="p-4 border-b border-white/[0.08] bg-slate-950/40">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Database className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-white">Retrieved Knowledge</h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            FAISS L2
          </span>
        </div>
        <p className="text-[11px] text-slate-400">Direct semantic search into video embeddings</p>
      </div>

      {/* Semantic Search Box */}
      <div className="p-4 border-b border-white/[0.08]">
        <form onSubmit={handleSearch} className="glass-panel p-1 rounded-xl flex items-center gap-1.5 border-white/10">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search raw chunks (e.g. 'antimatter')..."
            className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          </button>
        </form>
      </div>

      {/* Chunks List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {!hasSearched && (
          <div className="text-center py-10 px-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 mx-auto mb-3">
              <Layers className="h-5 w-5" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Query vector embeddings directly to preview matching transcript segments and jump to exact timestamps.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {["overview", "highlights", "process"].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term);
                    // auto trigger
                    setTimeout(() => {
                      searchVideo(videoId, term, 4).then((res) => {
                        setChunks(res.chunks || []);
                        setHasSearched(true);
                      });
                    }, 50);
                  }}
                  className="px-2.5 py-1 rounded-md border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-[11px] text-slate-300 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasSearched && chunks.length === 0 && !loading && (
          <div className="text-center py-8 text-xs text-slate-500">
            No matching chunks found for &quot;{query}&quot;.
          </div>
        )}

        {chunks.map((chunk) => {
          const ts = extractFirstTimestamp(chunk.content);
          return (
            <div
              key={chunk.chunk_index}
              className="glass-card p-3.5 rounded-xl border-white/[0.06] hover:border-indigo-500/30 transition-all text-left group"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  Chunk #{chunk.chunk_index}
                </span>

                {ts && (
                  <button
                    onClick={() => onTimestampClick(ts.seconds)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 transition-colors cursor-pointer"
                    title={`Jump to ${ts.timestampStr}`}
                  >
                    <Play className="h-2.5 w-2.5 fill-purple-300 text-purple-300" />
                    <span>{ts.timestampStr}</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-4 group-hover:line-clamp-none transition-all">
                {chunk.content}
              </p>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/[0.08] text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>k=4 chunks per query</span>
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-purple-400" />
          <span>Exact Grounding</span>
        </span>
      </div>
    </div>
  );
}
