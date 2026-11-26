"use client";

import React, { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Message } from "ai";
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

const MarkdownRenderer = dynamic(
  () => import("./MarkdownRenderer").then((mod) => mod.MarkdownRenderer),
  {
    ssr: false,
    loading: () => <div className="text-sm text-neutral-400">Memuat format...</div>,
  }
);

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendPreset: (text: string) => void;
  onReload: () => void;
  errorMessage?: string | null;
  onDismissError?: () => void;
}

export function ChatArea({
  messages,
  isLoading,
  onSendPreset,
  onReload,
  errorMessage,
  onDismissError,
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, errorMessage]);

  return (
    <div className="chat-scroll">
      {errorMessage && (
        <div
          role="alert"
          style={{
            maxWidth: "850px",
            margin: "0 auto 16px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(228, 134, 123, 0.12)",
            border: "1px solid rgba(228, 134, 123, 0.3)",
            color: "#fca5a5",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <span>{errorMessage}</span>
          {onDismissError && (
            <button
              type="button"
              onClick={onDismissError}
              style={{
                background: "transparent",
                border: "none",
                color: "#fca5a5",
                cursor: "pointer",
                fontSize: "12px",
                textDecoration: "underline",
                flexShrink: 0,
              }}
            >
              Tutup
            </button>
          )}
        </div>
      )}

      {messages.length === 0 ? (
        <EmptyStateScreen onSendPreset={onSendPreset} />
      ) : (
        <div className="message-stack">
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            const isLastAssistant =
              !isUser && index === messages.length - 1;

            return (
              <div
                key={message.id || index}
                className={`message-row${isUser ? " is-user" : " is-assistant"}`}
              >
                <div className={`message-mark${isUser ? "" : " is-assistant"}`}>
                  {isUser ? <User size={15} /> : <Sparkles size={15} />}
                </div>

                <div className="message-main">
                  <div className="message-author">
                    <span>{isUser ? "Anda" : "Arun-D'Chat"}</span>
                  </div>

                  <div className={`message-content${isUser ? " is-user" : ""}`}>
                    {isUser ? (
                      message.content
                    ) : (
                      <MarkdownRenderer content={message.content} />
                    )}
                  </div>

                  {!isUser && (
                    <div className="message-actions">
                      <CopyMessageButton content={message.content} />
                      {isLastAssistant && !isLoading && (
                        <button
                          type="button"
                          onClick={onReload}
                          className="regenerate-button"
                          title="Regenerasi respon"
                          aria-label="Regenerasi respon"
                        >
                          <RotateCcw size={13} />
                          <span>Regenerasi</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="message-row is-assistant">
              <div className="message-mark is-assistant">
                <Sparkles size={15} />
              </div>
              <div className="message-main">
                <div className="message-author">
                  <span>Arun-D'Chat</span>
                </div>
                <div className="typing-indicator">
                  <div className="typing-bars" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span>Sedang memproses respon...</span>
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
      console.error("Gagal menyalin pesan:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="copy-message-button"
      title="Salin pesan"
      aria-label="Salin pesan"
    >
      {copied ? (
        <>
          <Check size={13} />
          <span>Tersalin</span>
        </>
      ) : (
        <>
          <Copy size={13} />
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
      title: "Arsitektur Full-Stack",
      desc: "Bandingkan arsitektur monolithic modular vs microservices untuk aplikasi skala menengah.",
      icon: <BrainCircuit size={16} className="suggestion-icon" />,
      prompt:
        "Bandingkan arsitektur monolithic modular vs microservices untuk aplikasi skala menengah dengan penalaran terstruktur.",
    },
    {
      title: "Optimasi & Error Handling",
      desc: "Best practice error handling dan streaming response pada Next.js 14 App Router.",
      icon: <Code2 size={16} className="suggestion-icon" />,
      prompt:
        "Tunjukkan best practice error handling dan streaming response pada Next.js 14 App Router API route.",
    },
    {
      title: "Memori & Preferensi",
      desc: "Uji fitur self-learning RAG dengan memberikan preferensi kerja atau profil Anda.",
      icon: <Zap size={16} className="suggestion-icon" />,
      prompt:
        "Saya adalah software engineer yang fokus pada TypeScript dan Clean Architecture. Ingat ini untuk referensi berikutnya.",
    },
    {
      title: "Analisis Database Vektor",
      desc: "Bandingkan pgvector (PostgreSQL) vs Pinecone untuk AI memory.",
      icon: <ShieldCheck size={16} className="suggestion-icon" />,
      prompt:
        "Analisis komparatif yang objektif antara pgvector (Supabase/PostgreSQL) vs Pinecone untuk AI application memory.",
    },
  ];

  return (
    <div className="empty-state">
      <div className="empty-mark" aria-hidden="true">
        <Sparkles size={18} />
      </div>

      <h1 className="empty-heading">
        Apa yang ingin Anda selesaikan hari ini?
      </h1>
      <p className="empty-description">
        Didukung penalaran logis terstruktur, streaming teks real-time, dan sistem memori jangka panjang otomatis.
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
              <span className="suggestion-title">{item.title}</span>
              {item.icon}
            </div>
            <p className="suggestion-description">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
