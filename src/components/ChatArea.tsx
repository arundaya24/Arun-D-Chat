"use client";

import React, { useRef, useEffect } from "react";
import { Message } from "ai";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  Sparkles,
  User,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Code2,
  BrainCircuit,
  ShieldCheck,
} from "lucide-react";

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendPreset: (text: string) => void;
  onReload: () => void;
}

export function ChatArea({
  messages,
  isLoading,
  onSendPreset,
  onReload,
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
      {messages.length === 0 ? (
        <EmptyStateScreen onSendPreset={onSendPreset} />
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            const isLastAssistant =
              !isUser && index === messages.length - 1;

            return (
              <div
                key={message.id || index}
                className={`flex gap-4 ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 text-emerald-400 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`group relative max-w-[85%] rounded-2xl px-4 py-3.5 transition-all shadow-sm ${
                    isUser
                      ? "bg-[#2f2f2f] text-white border border-[#3e3e3e]"
                      : "bg-[#212121] text-[#ececec] border border-transparent w-full"
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                      {message.content}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <MarkdownRenderer content={message.content} />
                      <div className="flex items-center gap-2 pt-2 text-xs text-neutral-400 border-t border-[#2e2e2e]">
                        <CopyMessageButton content={message.content} />
                        {isLastAssistant && !isLoading && (
                          <button
                            onClick={onReload}
                            className="flex items-center gap-1 hover:text-white transition"
                            title="Regenerate respon"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Regenerasi</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0 text-neutral-300 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 text-emerald-400 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-[#212121] rounded-2xl px-4 py-3 text-sm text-neutral-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-neutral-400 ml-1">
                  Menganalisis memori &amp; menyusun penalaran...
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

function CopyMessageButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 hover:text-white transition"
      title="Salin seluruh pesan"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400">Tersalin</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Salin</span>
        </>
      )}
    </button>
  );
}

function EmptyStateScreen({
  onSendPreset,
}: {
  onSendPreset: (text: string) => void;
}) {
  const presets = [
    {
      title: "Arsitektur Full-Stack Modern",
      desc: "Jelaskan strategi microservices vs monolith untuk startup.",
      icon: <BrainCircuit className="w-5 h-5 text-emerald-400" />,
      prompt:
        "Bandingkan arsitektur monolithic modular vs microservices untuk aplikasi skala menengah dengan penalaran terstruktur.",
    },
    {
      title: "Debugging & Refactoring Kode",
      desc: "Optimalkan fungsi async & penanganan error pada Next.js API.",
      icon: <Code2 className="w-5 h-5 text-teal-400" />,
      prompt:
        "Tunjukkan best practice error handling dan streaming response pada Next.js 14 App Router API route.",
    },
    {
      title: "Uji Memori Jangka Panjang",
      desc: "Beri tahu preferensi kerjamu untuk diingat AI secara permanen.",
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      prompt:
        "Perkenalkan dirimu dan beri tahu AI: 'Saya adalah Senior Developer yang fokus pada TypeScript dan Clean Architecture. Ingat ini untuk sesi-sesi berikutnya.'",
    },
    {
      title: "Penalaran Kritis & Logika",
      desc: "Analisis trade-off teknologi database vektor (pgvector vs Pinecone).",
      icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
      prompt:
        "Analisis komparatif yang objektif antara pgvector (Supabase/PostgreSQL) vs Pinecone untuk AI application memory.",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-2xl mx-auto text-center">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 mb-4">
        <Sparkles className="w-6 h-6 text-white" />
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">
        Bagaimana saya bisa membantu Anda hari ini?
      </h1>
      <p className="text-sm text-neutral-400 mb-8 max-w-md">
        Dilengkapi dengan penalaran objektif, Vercel AI SDK, serta memori jangka panjang cerdas (pgvector RAG) yang terus belajar.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full text-left">
        {presets.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSendPreset(item.prompt)}
            className="p-4 rounded-xl bg-[#2a2a2a]/60 hover:bg-[#2f2f2f] border border-[#3c3c3c] transition-all hover:border-neutral-500 flex flex-col justify-between group"
          >
            <div className="flex items-center gap-2 mb-1.5">
              {item.icon}
              <span className="text-sm font-medium text-white group-hover:text-emerald-300 transition">
                {item.title}
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {item.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
