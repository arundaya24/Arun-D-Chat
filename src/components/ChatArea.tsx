"use client";

import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
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
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  isMessagesLoading?: boolean;
  activeChatId?: string | null;
  onSendPreset: (text: string) => void;
  onReload: () => void;
  errorMessage?: string | null;
  onDismissError?: () => void;
}

export function ChatArea({
  messages,
  isLoading,
  isMessagesLoading,
  activeChatId,
  onSendPreset,
  onReload,
  errorMessage,
  onDismissError,
}: ChatAreaProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevMessagesLengthRef = useRef(messages.length);
  const prevActiveChatIdRef = useRef<string | null>(activeChatId || null);
  const isSwitchingChatRef = useRef(false);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
  };

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const chatChanged = activeChatId !== prevActiveChatIdRef.current;
    if (chatChanged) {
      prevActiveChatIdRef.current = activeChatId || null;
      isSwitchingChatRef.current = true;
    }

    if (isMessagesLoading) {
      return;
    }

    if (chatChanged || isSwitchingChatRef.current) {
      container.scrollTop = container.scrollHeight;
      prevMessagesLengthRef.current = messages.length;
      isNearBottomRef.current = true;

      const rafId = requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
        isSwitchingChatRef.current = false;
      });

      return () => cancelAnimationFrame(rafId);
    }
  }, [activeChatId, isMessagesLoading, messages.length]);

  useEffect(() => {
    if (isMessagesLoading || isSwitchingChatRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const isNewMessage = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (isNewMessage) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (isLoading && isNearBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isLoading, isMessagesLoading]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const stack = container.querySelector(".message-stack");
    if (!stack) return;

    const observer = new ResizeObserver(() => {
      if (isSwitchingChatRef.current || (isNearBottomRef.current && isLoading)) {
        container.scrollTop = container.scrollHeight;
      }
    });

    observer.observe(stack);
    return () => observer.disconnect();
  }, [activeChatId, isMessagesLoading, isLoading]);

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="chat-scroll"
    >
      {errorMessage && (
        <div role="alert" className="chat-error-banner">
          <span>{errorMessage}</span>
          {onDismissError && (
            <button
              type="button"
              onClick={onDismissError}
              className="chat-error-dismiss active:scale-95"
            >
              Tutup
            </button>
          )}
        </div>
      )}

      {messages.length === 0 && isMessagesLoading ? (
        <div className="chat-loading-placeholder">
          <div className="chat-loading-spinner" />
          <span className="chat-loading-text">Memuat percakapan...</span>
        </div>
      ) : messages.length === 0 ? (
        <EmptyStateScreen onSendPreset={onSendPreset} />
      ) : (
        <div className="message-stack">
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            const isLastAssistant =
              !isUser && index === messages.length - 1;

            return (
              <div
                key={message.id ? `${message.id}` : `${activeChatId}-${index}-${message.role}`}
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
                          className="regenerate-button active:scale-95"
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
                  <span className="font-mono text-[11px]">Memproses respon...</span>
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
      className="copy-message-button active:scale-95"
      title={copied ? "Tersalin" : "Salin teks pesan"}
      aria-label={copied ? "Tersalin" : "Salin teks pesan"}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
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
      title: "Arsitektur Next.js 14",
      desc: "Eksplorasi App Router, Server Actions, streaming SSR, dan pattern optimasi data fetching.",
      icon: <Code2 size={15} className="suggestion-icon" />,
      prompt:
        "Tunjukkan best practice error handling dan streaming response pada Next.js 14 App Router API route.",
    },
    {
      title: "Konteks & Preferensi",
      desc: "Simpan profil teknologi dan batasan implementasi ke dalam memori vektor terindeks.",
      icon: <Zap size={15} className="suggestion-icon" />,
      prompt:
        "Saya adalah software engineer yang fokus pada TypeScript dan Clean Architecture. Ingat ini untuk referensi berikutnya.",
    },
    {
      title: "Evaluasi pgvector vs Pinecone",
      desc: "Analisis teknis efisiensi index HNSW PostgreSQL dibanding solusi managed vector database.",
      icon: <ShieldCheck size={15} className="suggestion-icon" />,
      prompt:
        "Analisis komparatif yang objektif antara pgvector (Supabase/PostgreSQL) vs Pinecone untuk AI application memory.",
    },
  ];

  return (
    <div className="empty-state">
      <div className="empty-mark" aria-hidden="true">
        <Sparkles size={16} />
      </div>

      <h1 className="empty-heading">
        Apa yang ingin Anda selesaikan hari ini?
      </h1>
      <p className="empty-description">
        Ruang kerja penalaran terstruktur dengan streaming respons real-time dan sistem memori jangka panjang terindeks.
      </p>

      <div className="suggestion-grid">
        {presets.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSendPreset(item.prompt)}
            className="suggestion-card active:scale-[0.98]"
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
