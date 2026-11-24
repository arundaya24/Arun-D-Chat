"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useChat } from "ai/react";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { ChatInput } from "@/components/ChatInput";
import { MemoryManagerModal } from "@/components/MemoryManagerModal";
import { ChatSession } from "@/types";
import { Menu, Plus } from "lucide-react";

export default function ChatPage() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [memoryCount, setMemoryCount] = useState(0);

  // Vercel AI SDK useChat Hook
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    reload,
    setMessages,
    setInput,
  } = useChat({
    api: "/api/chat",
    body: {
      chatId: activeChatId,
      userId: "user_default_01",
    },
    onFinish: () => {
      // Refresh memory count and chat list after assistant answers
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

  // Buat sesi chat baru
  const handleNewChat = async () => {
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
      }
    } catch (err) {
      console.error("Gagal membuat chat baru:", err);
      setActiveChatId(null);
      setMessages([]);
    }
  };

  // Pilih sesi chat dari sidebar
  const handleSelectChat = async (chatId: string) => {
    if (chatId === activeChatId) return;
    setActiveChatId(chatId);
    setIsSidebarOpen(false);

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      const data = await res.json();
      if (data.messages) {
        setMessages(
          data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          }))
        );
      }
    } catch (err) {
      console.error("Gagal memuat histori pesan:", err);
      setMessages([]);
    }
  };

  // Hapus sesi chat
  const handleDeleteChat = async (chatId: string) => {
    if (!confirm("Hapus percakapan ini secara permanen?")) return;

    try {
      await fetch(`/api/chats?id=${chatId}`, { method: "DELETE" });
      setChats((prev) => prev.filter((c) => c.id !== chatId));
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#212121] text-[#ececec]">
      {/* Sidebar Kiri */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        memoryCount={memoryCount}
      />

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Top Header Mobile / Nav */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d2d2d] bg-[#212121] md:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#2f2f2f] transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-white truncate max-w-[200px]">
            {chats.find((c) => c.id === activeChatId)?.title || "Arun-D'Chat"}
          </span>
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#2f2f2f] transition"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Message View Area */}
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          onSendPreset={handleSendPreset}
          onReload={reload}
        />

        {/* Sticky Input Bar at Bottom */}
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={(e) => {
            // Jika belum ada chat yang aktif saat mengirim pesan pertama, buat chat baru
            if (!activeChatId) {
              handleNewChat().then(() => {
                handleSubmit(e);
              });
            } else {
              handleSubmit(e);
            }
          }}
          isLoading={isLoading}
          stop={stop}
        />
      </main>

      {/* Modal Kelola Memori Jangka Panjang */}
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
