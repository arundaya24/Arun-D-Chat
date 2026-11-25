"use client";

import React, { useState } from "react";
import {
  Brain,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  X,
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

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <>
      {isOpen && (
        <button
          type="button"
          onClick={onToggleSidebar}
          className="sidebar-backdrop"
          aria-label="Tutup navigasi"
        />
      )}

      <aside className={`sidebar${isOpen ? " is-open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand-row">
            <div className="brand-mark" aria-hidden="true">
              A
            </div>
            <span className="brand-name">Arun-D&apos;Chat</span>
            <button
              type="button"
              onClick={onToggleSidebar}
              className="sidebar-close active:scale-95"
              aria-label="Tutup navigasi"
            >
              <X size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={onNewChat}
            className="sidebar-new-chat active:scale-95"
          >
            <span className="sidebar-new-chat-label">
              <Plus size={16} />
              Percakapan baru
            </span>
            <span className="new-chat-shortcut">N</span>
          </button>
        </div>

        <div className="sidebar-history">
          <div className="sidebar-heading">
            <span>Percakapan</span>
            <span className="mono-label">
              {String(chats.length).padStart(2, "0")}
            </span>
          </div>

          <label className="history-search">
            <Search size={14} aria-hidden="true" />
            <input
              type="search"
              value={filterQuery}
              onChange={(event) => setFilterQuery(event.target.value)}
              placeholder="Cari percakapan"
              aria-label="Cari percakapan"
            />
          </label>

          {filteredChats.length === 0 ? (
            <div className="history-empty">
              {filterQuery
                ? "Tidak ada percakapan yang cocok."
                : "Percakapan yang kamu mulai akan muncul di sini."}
            </div>
          ) : (
            <div className="history-list">
              {filteredChats.map((chat) => {
                const isActive = chat.id === activeChatId;
                return (
                  <div
                    key={chat.id}
                    className={`history-entry${isActive ? " is-active" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectChat(chat.id)}
                      className="history-select"
                      aria-current={isActive ? "page" : undefined}
                    >
                      <MessageSquare size={14} aria-hidden="true" />
                      <span className="history-title">{chat.title}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteChat(chat.id)}
                      className="history-delete active:scale-95"
                      title="Hapus percakapan"
                      aria-label={`Hapus ${chat.title}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="sidebar-bottom">
          <button
            type="button"
            onClick={onOpenMemoryModal}
            className="memory-action active:scale-95"
          >
            <span className="memory-action-label">
              <Brain size={15} />
              Kelola memori
            </span>
            <span className="memory-count">{memoryCount}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
