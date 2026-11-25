"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useChat } from "ai/react";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { ChatInput } from "@/components/ChatInput";
import { MemoryManagerModal } from "@/components/MemoryManagerModal";
import { ChatSession } from "@/types";
import { Brain, Menu } from "lucide-react";

export default function ChatPage() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [memoryCount, setMemoryCount] = useState(0);
  const isSubmittingRef = useRef(false);

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
    body: {
      chatId: activeChatId,
      userId: "user_default_01",
    },
    onFinish: () => {
      loadMemoryCount();
      loadChats();
    },
    onError: (err) => {
      console.error("Kesalahan streaming AI:", err);
      alert("Terjadi kesalahan saat berkomunikasi dengan AI: " + err.message);
    },
  });

  const loadChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chats?userId=user_default_01");
      const data = await res.json();
      if (data.chats) {
        setChats(data.chats);
      }
    } catch (err) {
      console.error("Gagal memuat daftar chat:", err);
    }
  }, []);

  const loadMemoryCount = useCallback(async () => {
    try {
      const res = await fetch("/api/memories?userId=user_default_01");
      const data = await res.json();
      if (data.memories) {
        setMemoryCount(data.memories.length);
      }
    } catch (err) {
      console.error("Gagal memuat jumlah memori:", err);
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
      const data = await res.json();
      if (data.chat) {
        setChats((prev) => [data.chat, ...prev]);
        setActiveChatId(data.chat.id);
        setMessages([]);
        return data.chat.id;
      }
      return null;
    } catch (err) {
      console.error("Gagal membuat chat baru:", err);
      setActiveChatId(null);
      setMessages([]);
      return null;
    }
  };

  const handleSelectChat = async (chatId: string) => {
    if (chatId === activeChatId) return;
    setActiveChatId(chatId);
    setIsSidebarOpen(false);

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      const data = await res.json();
      if (data.messages) {
        setMessages(
          data.messages.map((message: { id: string; role: string; content: string }) => ({
            id: message.id,
            role: message.role,
            content: message.content,
          }))
        );
      }
    } catch (err) {
      console.error("Gagal memuat histori pesan:", err);
      setMessages([]);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm("Hapus percakapan ini secara permanen?")) return;

    try {
      await fetch(`/api/chats?id=${chatId}`, { method: "DELETE" });
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Gagal menghapus chat:", err);
    }
  };

  const handleSendPreset = (presetText: string) => {
    setInput(presetText);
  };

  const handleChatSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isLoading || isSubmittingRef.current) return;

    if (activeChatId) {
      handleSubmit(event);
      return;
    }

    const prompt = input;
    isSubmittingRef.current = true;
    void (async () => {
      try {
        const chatId = await handleNewChat();
        if (!chatId) {
          alert("Gagal membuat percakapan baru. Silakan coba lagi.");
          return;
        }

        const response = append(
          { role: "user", content: prompt },
          { body: { chatId, userId: "user_default_01" } }
        );
        setInput((currentInput) =>
          currentInput === prompt ? "" : currentInput
        );
        await response;
      } catch (err) {
        console.error("Gagal mengirim pesan:", err);
        alert("Pesan gagal dikirim. Silakan coba lagi.");
      } finally {
        isSubmittingRef.current = false;
      }
    })();
  };

  const activeChatTitle =
    chats.find((chat) => chat.id === activeChatId)?.title || "Percakapan baru";

  return (
    <div className="app-shell">
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
          onReload={reload}
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
