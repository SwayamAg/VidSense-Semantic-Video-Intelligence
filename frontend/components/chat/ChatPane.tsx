"use client";

import React, { useState } from "react";
import { Send, Bot, User, Sparkles, Loader2, RotateCcw, Play } from "lucide-react";
import { chatWithVideo } from "@/lib/api";
import { parseTimestampToSeconds } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isFallback?: boolean;
}

interface ChatPaneProps {
  videoId: string;
  onTimestampClick: (seconds: number) => void;
}

const STARTER_PROMPTS = [
  "What is the main topic of this video and key concepts covered?",
  "What are the main insights or takeaways discussed?",
  "Can you list any specific techniques or methods mentioned with their timestamps?"
];

export default function ChatPane({ videoId, onTimestampClick }: ChatPaneProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (questionToSend?: string) => {
    const q = questionToSend || input;
    if (!q.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: q.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await chatWithVideo(videoId, q.trim());
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer,
        isFallback: response.is_fallback,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error receiving AI answer.";
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `[ERROR] Failed to query video: ${errorMsg}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Parses text and converts [MM:SS] or [HH:MM:SS] into interactive timestamp buttons
   */
  const renderFormattedContent = (content: string) => {
    // Regex for matching timestamps like [07:37], [1:48:01], [16:23]
    const timestampRegex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = timestampRegex.exec(content)) !== null) {
      // Text before match
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      const timestampStr = match[1];
      const seconds = parseTimestampToSeconds(timestampStr);

      parts.push(
        <button
          key={match.index}
          onClick={() => onTimestampClick(seconds)}
          className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 text-xs font-mono transition-colors shadow-sm cursor-pointer"
          title={`Click to jump to ${timestampStr} in video`}
        >
          <Play className="h-2.5 w-2.5 fill-purple-300 text-purple-300" />
          <span>{timestampStr}</span>
        </button>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed text-sm text-slate-200 font-sans">
        {parts.map((p, idx) => (
          <React.Fragment key={idx}>{p}</React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#060810]/90 relative">
      {/* Chat Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">AI Research Chat</h2>
            <p className="text-[11px] text-slate-400">Grounded in video transcript & citations</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg border border-white/10 hover:border-white/20 transition-all flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto py-12">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-4 shadow-xl">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Ready to query this video</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Ask questions to extract key insights, processes, and timestamp-backed facts directly from the transcript.
            </p>

            {/* Starter Prompts */}
            <div className="w-full space-y-2">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block text-left mb-1">
                Suggested Starter Prompts:
              </span>
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="w-full text-left p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-purple-500/30 text-xs text-slate-300 transition-all flex items-center justify-between group"
                >
                  <span className="line-clamp-1">{prompt}</span>
                  <Sparkles className="h-3.5 w-3.5 text-slate-500 group-hover:text-purple-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 max-w-3xl ${m.role === "user" ? "ml-auto justify-end" : "mr-auto justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="h-7 w-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 mt-1">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`p-4 rounded-2xl ${
                m.role === "user"
                  ? "bg-purple-600 text-white rounded-br-none shadow-md shadow-purple-950/20"
                  : "glass-card border-white/[0.08] text-slate-200 rounded-tl-none shadow-lg"
              }`}
            >
              {m.role === "user" ? (
                <p className="text-sm">{m.content}</p>
              ) : (
                <div>
                  {renderFormattedContent(m.content)}
                  {m.isFallback && (
                    <div className="mt-3 pt-2 border-t border-white/[0.08] text-[11px] text-amber-400 font-mono">
                      [Notice: Default local knowledge base used as live transcript was unavailable]
                    </div>
                  )}
                </div>
              )}
            </div>

            {m.role === "user" && (
              <div className="h-7 w-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 mt-1">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-3xl mr-auto">
            <div className="h-7 w-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-purple-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Retrieving relevant video chunks & reasoning...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-white/[0.08] bg-slate-950/60 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="glass-panel p-1.5 rounded-2xl flex items-center gap-2 border-white/10"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about this video (e.g., 'What are the technical highlights?')"
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shrink-0"
          >
            <span>Send</span>
            <Send className="h-3 w-3" />
          </button>
        </form>
      </div>
    </div>
  );
}
