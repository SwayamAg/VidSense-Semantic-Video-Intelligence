"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Database, Play, Clock, ArrowRight, Loader2 } from "lucide-react";
import { listIndexes, IndexItem } from "@/lib/api";

interface VideoLibraryDrawerProps {
  isOpen: boolean;
  currentVideoId: string;
  onClose: () => void;
}

export default function VideoLibraryDrawer({
  isOpen,
  currentVideoId,
  onClose,
}: VideoLibraryDrawerProps) {
  const router = useRouter();
  const [indices, setIndices] = useState<IndexItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      listIndexes()
        .then((res) => {
          setIndices(res.indices || []);
        })
        .catch(() => {
          setIndices([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-sm h-full flex flex-col border-l border-white/10 shadow-2xl bg-[#090d1a]">
        {/* Drawer Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Indexed Video Library</h2>
              <p className="text-[11px] text-slate-400">{indices.length} videos stored in FAISS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Video List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="py-16 text-center text-xs text-indigo-400 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Listing cached vector spaces...</span>
            </div>
          )}

          {!loading && indices.length === 0 && (
            <div className="py-16 text-center text-xs text-slate-500">
              No cached videos found in `./faiss_index/`.
            </div>
          )}

          {!loading &&
            indices.map((idx) => {
              const isCurrent = idx.video_id === currentVideoId;
              return (
                <div
                  key={idx.video_id}
                  onClick={() => {
                    if (!isCurrent) {
                      router.push(`/workspace?v=${idx.video_id}`);
                      onClose();
                    }
                  }}
                  className={`p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer group ${
                    isCurrent
                      ? "bg-purple-600/10 border-purple-500/40"
                      : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20"
                  }`}
                >
                  <div className="relative w-16 aspect-video rounded-lg overflow-hidden border border-white/10 shrink-0 bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${idx.video_id}/mqdefault.jpg`}
                      alt={idx.video_id}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-mono font-medium text-white truncate">
                        {idx.video_id}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
                      FAISS Local Vector Space
                    </span>
                  </div>

                  {!isCurrent && (
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-white transition-colors shrink-0" />
                  )}
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-slate-950/60 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Click any video to switch workspaces</span>
          <button
            onClick={() => router.push("/")}
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
            + Add New
          </button>
        </div>
      </div>
    </div>
  );
}
