"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  Brain,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { ChatSession } from "@/types";

interface SidebarProps {
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onOpenMemoryModal: () => void;
  isOpen: boolean;
  onToggleSidebar: () => void;
  memoryCount: number;
}

export function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onOpenMemoryModal,
  isOpen,
  onToggleSidebar,
  memoryCount,
}: SidebarProps) {
  const [filterQuery, setFilterQuery] = useState("");

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggleSidebar}
          className="fixed inset-0 z-30 bg-black/60 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col w-64 bg-[#171717] border-r border-[#2d2d2d] transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Header / Branding & New Chat */}
        <div className="p-3 border-b border-[#2d2d2d] space-y-2">
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-950/40">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm tracking-wide text-white">
                Arun-D&apos;Chat
              </span>
            </div>
            <button
              onClick={onToggleSidebar}
              className="p-1 rounded text-neutral-400 hover:text-white md:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#212121] hover:bg-[#2a2a2a] border border-[#333] text-sm font-medium text-white transition-all shadow-sm group"
          >
            <span className="flex items-center gap-2.5">
              <Plus className="w-4 h-4 text-emerald-400 group-hover:rotate-90 transition-transform duration-200" />
              Obrolan Baru
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">⌘N</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Riwayat Obrolan
          </div>

          {filteredChats.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-neutral-500">
              Belum ada riwayat percakapan.
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              return (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                    isActive
                      ? "bg-[#212121] text-white font-medium shadow-sm"
                      : "text-neutral-300 hover:bg-[#202123] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate flex-1">
                    <MessageSquare
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? "text-emerald-400" : "text-neutral-500"
                      }`}
                    />
                    <span className="truncate text-xs">{chat.title}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition"
                    title="Hapus obrolan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Actions: Kelola Memori & Model Info */}
        <div className="p-3 border-t border-[#2d2d2d] space-y-2 bg-[#141414]">
          <button
            onClick={onOpenMemoryModal}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#212121] hover:bg-[#2a2a2a] border border-[#333] text-xs font-medium text-neutral-200 hover:text-white transition group"
          >
            <span className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              Kelola Memori AI
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
              {memoryCount}
            </span>
          </button>

          <div className="px-3 py-2 rounded-xl bg-[#1b1b1b] border border-[#2a2a2a] flex items-center gap-2 text-[11px] text-neutral-400">
            <Cpu className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
            <div className="truncate">
              <span className="text-neutral-300 font-medium">Provider:</span>{" "}
              {process.env.NEXT_PUBLIC_AI_PROVIDER || "Gemini / OpenAI"}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
