"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useChat } from "ai/react";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { ChatInput } from "@/components/ChatInput";
import { MemoryManagerModal } from "@/components/MemoryManagerModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatSession } from "@/types";
import { getClientSystemContext } from "@/lib/client-context";
import { Brain, Menu } from "lucide-react";

const ArtisanalCanvas = dynamic(
  () => import("@/components/ArtisanalCanvas").then((mod) => mod.ArtisanalCanvas),
  { ssr: false }
);

export default function ChatPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [memoryCount, setMemoryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("arun_theme") as "dark" | "light" | null;
    const initialTheme = storedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
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
        if (typeof err.message === "string" && err.message.trim().startsWith("{")) {
          const parsed = JSON.parse(err.message);
          if (parsed.error) msg = parsed.error;
        }
      } catch {}
      setErrorMessage(msg);
    },
  });

  const loadChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chats?userId=user_default_01");
      const data = await res.json().catch(() => ({}));
      if (data.chats && Array.isArray(data.chats)) {
        setChats(data.chats);
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

  useEffect(() => {
    loadChats();
    loadMemoryCount();
  }, [loadChats, loadMemoryCount]);

  const handleNewChat = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Percakapan Baru",
          userId: "user_default_01",
        }),
      });
      const data = await res.json().catch(() => ({}));
      const newChat: ChatSession = data.chat || {
        id: crypto.randomUUID(),
        title: "Percakapan Baru",
        user_id: "user_default_01",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setChats((prev) => [newChat, ...prev.filter((c) => c.id !== newChat.id)]);
      setActiveChatId(newChat.id);
      setMessages([]);
      setErrorMessage(null);
      return newChat.id;
    } catch (err) {
      console.warn("Membuat chat baru dengan fallback lokal:", err);
      const localId = crypto.randomUUID();
      const localChat: ChatSession = {
        id: localId,
        title: "Percakapan Baru",
        user_id: "user_default_01",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setChats((prev) => [localChat, ...prev]);
      setActiveChatId(localId);
      setMessages([]);
      setErrorMessage(null);
      return localId;
    }
  };

  const handleSelectChat = async (chatId: string) => {
    if (chatId === activeChatId) return;
    setActiveChatId(chatId);
    setIsSidebarOpen(false);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      const data = await res.json().catch(() => ({}));
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(
          data.messages.map((m: { id: string; role: string; content: string }) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          }))
        );
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.warn("Gagal memuat histori pesan:", err);
      setMessages([]);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm("Hapus percakapan ini secara permanen?")) return;

    try {
      await fetch(`/api/chats?id=${chatId}`, { method: "DELETE" }).catch(() => {});
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setMessages([]);
      }
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
    if (!prompt || isLoading || isSubmittingRef.current) return;

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
        const chatId = await handleNewChat();
        const currentChatId = chatId || crypto.randomUUID();
        await append(
          { role: "user", content: prompt },
          {
            body: {
              chatId: currentChatId,
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
          onSendPreset={handleSendPreset}
          onReload={handleReload}
          errorMessage={errorMessage}
          onDismissError={() => setErrorMessage(null)}
        />

        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleChatSubmit}
          isLoading={isLoading}
          stop={stop}
        />
      </main>

      <MemoryManagerModal
        isOpen={isMemoryModalOpen}
        onClose={() => {
          setIsMemoryModalOpen(false);
          loadMemoryCount();
        }}
        userId="user_default_01"
      />
    </div>
  );
}
