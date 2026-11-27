"use client";

import React, { useState, useMemo, useEffect } from "react";
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

interface ChatGroup {
  title: string;
  chats: ChatSession[];
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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onToggleSidebar();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onToggleSidebar]);

  const filteredChats = useMemo(() => {
    if (!filterQuery.trim()) return chats;
    const q = filterQuery.toLowerCase();
    return chats.filter((chat) => chat.title.toLowerCase().includes(q));
  }, [chats, filterQuery]);

  const groupedChats = useMemo<ChatGroup[]>(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOf7Days = startOfToday - 7 * 24 * 60 * 60 * 1000;

    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const previous7Days: ChatSession[] = [];
    const older: ChatSession[] = [];

    for (const chat of filteredChats) {
      const time = new Date(chat.updated_at || chat.created_at).getTime();
      if (time >= startOfToday) {
        today.push(chat);
      } else if (time >= startOfYesterday) {
        yesterday.push(chat);
      } else if (time >= startOf7Days) {
        previous7Days.push(chat);
      } else {
        older.push(chat);
      }
    }

    const groups: ChatGroup[] = [];
    if (today.length > 0) groups.push({ title: "Hari Ini", chats: today });
    if (yesterday.length > 0) groups.push({ title: "Kemarin", chats: yesterday });
    if (previous7Days.length > 0)
      groups.push({ title: "7 Hari Terakhir", chats: previous7Days });
    if (older.length > 0) groups.push({ title: "Lebih Lama", chats: older });

    return groups;
  }, [filteredChats]);

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

          {groupedChats.length === 0 ? (
            <div className="history-empty">
              {filterQuery
                ? "Tidak ada percakapan yang cocok."
                : "Percakapan yang kamu mulai akan muncul di sini."}
            </div>
          ) : (
            <div className="history-list">
              {groupedChats.map((group) => (
                <div key={group.title} className="history-group">
                  <div className="history-group-title">{group.title}</div>
                  {group.chats.map((chat) => {
                    const isActive = chat.id === activeChatId;
                    return (
                      <div
                        key={chat.id}
                        className={`history-entry${isActive ? " is-active" : ""}`}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectChat(chat.id)}
                          className="history-select active:scale-[0.99]"
                          aria-current={isActive ? "page" : undefined}
                        >
                          <MessageSquare size={14} aria-hidden="true" />
                          <span className="history-title">{chat.title}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                          }}
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
              ))}
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
