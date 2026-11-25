"use client";

import React, { useRef, useEffect, useState } from "react";
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
    <div className="chat-scroll">
      {messages.length === 0 ? (
        <EmptyStateScreen onSendPreset={onSendPreset} />
      ) : (
        <div className="message-stack">
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            const isLastAssistant =
              !isUser && index === messages.length - 1;

            return (
              <div key={message.id || index} className="message-row">
                <div className={`message-mark${isUser ? "" : " is-assistant"}`}>
                  {isUser ? <User size={15} /> : <Sparkles size={15} />}
                </div>
                <div className="message-main">
                  <div className="message-author">
                    {isUser ? "Anda" : "Arun-D'Chat"}
                  </div>
                  {isUser ? (
                    <div className="message-content is-user">
                      {message.content}
                    </div>
                  ) : (
                    <div className="message-content">
                      <MarkdownRenderer content={message.content} />
                      <div className="message-actions">
                        <CopyMessageButton content={message.content} />
                        {isLastAssistant && !isLoading && (
                          <button
                            type="button"
                            onClick={onReload}
                            className="regenerate-button"
                            title="Regenerate respon"
                          >
                            <RotateCcw size={14} />
                            <span>Regenerasi</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="message-row">
              <div className="message-mark is-assistant">
                <Sparkles size={15} />
              </div>
              <div className="message-main">
                <div className="message-author">Arun-D'Chat</div>
                <div className="typing-indicator">
                  <span className="typing-bars">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span>Menganalisis memori &amp; menyusun penalaran...</span>
                </div>
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
      type="button"
      onClick={handleCopy}
      className="copy-message-button"
      title="Salin seluruh pesan"
    >
      {copied ? (
        <>
          <Check size={14} />
          <span>Tersalin</span>
        </>
      ) : (
        <>
          <Copy size={14} />
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
    <div className="empty-state">
      <div className="empty-mark">
        <Sparkles size={19} />
      </div>

      <h1 className="empty-heading">
        Bagaimana saya bisa membantu Anda hari ini?
      </h1>
      <p className="empty-description">
        Dilengkapi dengan penalaran objektif, Vercel AI SDK, serta memori jangka panjang cerdas (pgvector RAG) yang terus belajar.
      </p>

      <div className="suggestion-grid">
        {presets.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSendPreset(item.prompt)}
            className="suggestion-card"
          >
            <div className="suggestion-topline">
              <span className="suggestion-icon">{item.icon}</span>
              <span className="suggestion-title">{item.title}</span>
            </div>
            <p className="suggestion-description">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
