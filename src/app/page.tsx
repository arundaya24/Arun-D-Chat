"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useChat } from "ai/react";
import { Message } from "ai";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { ChatInput } from "@/components/ChatInput";
import { MemoryManagerModal } from "@/components/MemoryManagerModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatSession } from "@/types";
import { getClientSystemContext } from "@/lib/client-context";
import { generateFastTitle } from "@/lib/utils";
import { Brain, Menu } from "lucide-react";

const ArtisanalCanvas = dynamic(
  () => import("@/components/ArtisanalCanvas").then((mod) => mod.ArtisanalCanvas),
  { ssr: false }
);

export default function ChatPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [memoryCount, setMemoryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSubmittingRef = useRef(false);
  const activeChatIdRef = useRef<string | null>(null);
  const loadingChatIdRef = useRef<string | null>(null);
  const selectChatAbortControllerRef = useRef<AbortController | null>(null);
  const messagesCacheRef = useRef<Map<string, Message[]>>(new Map());

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    const storedTheme = localStorage.getItem("arun_theme") as "dark" | "light" | null;
    const initialTheme =
      storedTheme ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(initialTheme);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(initialTheme);
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("arun_theme", nextTheme);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(nextTheme);
  };

  const loadChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chats?userId=user_default_01");
      const data = await res.json().catch(() => ({}));
      if (data.chats && Array.isArray(data.chats)) {
        setChats(data.chats);
        try {
          localStorage.setItem("arun_chats_cache", JSON.stringify(data.chats));
        } catch {}
      }
    } catch (err) {
      console.warn("Gagal memuat daftar chat:", err);
    }
  }, []);

  const loadMemoryCount = useCallback(async () => {
    try {
      const res = await fetch("/api/memories?userId=user_default_01");
      const data = await res.json().catch(() => ({}));
      if (data.memories && Array.isArray(data.memories)) {
        setMemoryCount(data.memories.length);
      }
    } catch (err) {
      console.warn("Gagal memuat jumlah memori:", err);
    }
  }, []);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    reload,
    append,
    setMessages,
    setInput,
  } = useChat({
    api: "/api/chat",
    keepLastMessageOnError: true,
    body: {
      chatId: activeChatId,
      userId: "user_default_01",
    },
    onFinish: () => {
      setErrorMessage(null);
      loadMemoryCount();
      loadChats();
    },
    onError: (err) => {
      console.warn("Kesalahan streaming AI:", err);
      let msg = err.message || "Terjadi kesalahan saat berkomunikasi dengan AI.";
      try {
        if (
          typeof err.message === "string" &&
          err.message.trim().startsWith("{")
        ) {
          const parsed = JSON.parse(err.message);
          if (parsed.error) msg = parsed.error;
        }
      } catch {}
      setErrorMessage(msg);
    },
  });

  useEffect(() => {
    if (activeChatId && messages.length > 0) {
      messagesCacheRef.current.set(activeChatId, messages);
    }
  }, [activeChatId, messages]);

  const handleSelectChat = useCallback(
    async (chatId: string) => {
      if (chatId === activeChatIdRef.current && !isMessagesLoading) return;

      if (isLoading) {
        stop();
      }

      if (selectChatAbortControllerRef.current) {
        selectChatAbortControllerRef.current.abort();
      }

      loadingChatIdRef.current = chatId;
      setActiveChatId(chatId);
      setIsSidebarOpen(false);
      setErrorMessage(null);

      try {
        localStorage.setItem("arun_active_chat_id", chatId);
      } catch {}

      const cached = messagesCacheRef.current.get(chatId);
      if (cached && cached.length > 0) {
        setMessages(cached);
        setIsMessagesLoading(false);
      } else {
        setMessages([]);
        setIsMessagesLoading(true);
      }

      const controller = new AbortController();
      selectChatAbortControllerRef.current = controller;

      try {
        const res = await fetch(`/api/chats/${chatId}/messages`, {
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));

        if (loadingChatIdRef.current === chatId) {
          if (data.messages && Array.isArray(data.messages)) {
            const formatted: Message[] = data.messages.map(
              (m: { id: string; role: string; content: string }) => ({
                id: m.id,
                role: m.role as "user" | "assistant" | "system",
                content: m.content,
              })
            );
            messagesCacheRef.current.set(chatId, formatted);
            setMessages(formatted);
          } else {
            messagesCacheRef.current.set(chatId, []);
            setMessages([]);
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("Gagal memuat histori pesan:", err);
          if (loadingChatIdRef.current === chatId) {
            if (!cached || cached.length === 0) {
              setMessages([]);
            }
          }
        }
      } finally {
        if (loadingChatIdRef.current === chatId) {
          setIsMessagesLoading(false);
        }
      }
    },
    [isLoading, stop, setMessages, isMessagesLoading]
  );

  useEffect(() => {
    try {
      const cached = localStorage.getItem("arun_chats_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChats(parsed);
        }
      }
    } catch {}

    const init = async () => {
      await loadChats();
      await loadMemoryCount();
      try {
        const lastActiveId = localStorage.getItem("arun_active_chat_id");
        if (lastActiveId) {
          void handleSelectChat(lastActiveId);
        }
      } catch {}
    };

    init();
  }, [loadChats, loadMemoryCount, handleSelectChat]);

  const handleNewChat = useCallback(() => {
    if (isLoading) {
      stop();
    }
    if (selectChatAbortControllerRef.current) {
      selectChatAbortControllerRef.current.abort();
    }
    loadingChatIdRef.current = null;
    setIsMessagesLoading(false);
    setActiveChatId(null);
    setMessages([]);
    setInput("");
    setErrorMessage(null);
    setIsSidebarOpen(false);

    try {
      localStorage.removeItem("arun_active_chat_id");
    } catch {}
  }, [isLoading, stop, setMessages, setInput]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        (activeEl as HTMLElement)?.isContentEditable;
      if (isInput) return;

      if (
        (event.key === "n" || event.key === "N") &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        handleNewChat();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNewChat]);

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm("Hapus percakapan ini secara permanen?")) return;

    messagesCacheRef.current.delete(chatId);

    if (activeChatId === chatId) {
      handleNewChat();
    }

    try {
      await fetch(`/api/chats?id=${chatId}`, { method: "DELETE" }).catch(() => {});
      setChats((prev) => {
        const updated = prev.filter((chat) => chat.id !== chatId);
        try {
          localStorage.setItem("arun_chats_cache", JSON.stringify(updated));
        } catch {}
        return updated;
      });
    } catch (err) {
      console.warn("Gagal menghapus chat:", err);
    }
  };

  const handleSendPreset = (presetText: string) => {
    setInput(presetText);
    setErrorMessage(null);
  };

  const handleChatSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || isLoading || isSubmittingRef.current || isMessagesLoading) return;

    setErrorMessage(null);
    const clientContext = getClientSystemContext();

    if (activeChatId) {
      handleSubmit(event, {
        body: {
          chatId: activeChatId,
          userId: "user_default_01",
          clientContext,
        },
      });
      return;
    }

    setInput("");
    isSubmittingRef.current = true;

    void (async () => {
      try {
        const fastTitle = generateFastTitle(prompt);
        const res = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: fastTitle,
            userId: "user_default_01",
          }),
        });

        const data = await res.json().catch(() => ({}));
        const newChat: ChatSession = data.chat || {
          id: crypto.randomUUID(),
          title: fastTitle,
          user_id: "user_default_01",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setActiveChatId(newChat.id);
        try {
          localStorage.setItem("arun_active_chat_id", newChat.id);
        } catch {}

        setChats((prev) => [
          newChat,
          ...prev.filter((c) => c.id !== newChat.id),
        ]);

        await append(
          { role: "user", content: prompt },
          {
            body: {
              chatId: newChat.id,
              userId: "user_default_01",
              clientContext,
            },
          }
        );
      } catch (err) {
        console.error("Gagal mengirim prompt:", err);
      } finally {
        isSubmittingRef.current = false;
      }
    })();
  };

  const handleReload = () => {
    if (isLoading || !activeChatId) return;
    reload({
      body: {
        chatId: activeChatId,
        userId: "user_default_01",
        clientContext: getClientSystemContext(),
      },
    });
  };

  const activeChatTitle =
    chats.find((chat) => chat.id === activeChatId)?.title || "Percakapan baru";

  return (
    <div className="app-shell">
      <ArtisanalCanvas theme={theme} />
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        memoryCount={memoryCount}
      />

      <main className="workspace">
        <header className="workspace-header">
          <div className="workspace-title-wrap">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="mobile-menu active:scale-95"
              aria-label="Buka riwayat percakapan"
            >
              <Menu size={17} />
            </button>
            <span className="workspace-title">{activeChatTitle}</span>
          </div>
          <div className="workspace-actions">
            <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
            <button
              type="button"
              onClick={() => setIsMemoryModalOpen(true)}
              className="header-memory active:scale-95"
            >
              <Brain size={15} />
              <span>Memori</span>
              <span className="mono-label">{memoryCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsMemoryModalOpen(true)}
              className="mobile-memory active:scale-95"
              aria-label="Buka memori"
            >
              <Brain size={16} />
            </button>
          </div>
        </header>

        <ChatArea
          messages={messages}
          isLoading={isLoading}
          isMessagesLoading={isMessagesLoading}
          activeChatId={activeChatId}
          onSendPreset={handleSendPreset}
          errorMessage={errorMessage}
          onDismissError={() => setErrorMessage(null)}
          onReload={handleReload}
        />

        <footer className="workspace-footer">
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleChatSubmit}
            isLoading={isLoading}
            stop={stop}
          />
        </footer>
      </main>

      <MemoryManagerModal
        isOpen={isMemoryModalOpen}
        onClose={() => {
          setIsMemoryModalOpen(false);
          loadMemoryCount();
        }}
        userId="user_default_01"
        onMemoriesReset={loadMemoryCount}
      />
    </div>
  );
}
