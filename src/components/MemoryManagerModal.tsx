"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  Trash2,
  Plus,
  Search,
  X,
  Sparkles,
  Loader2,
  Tag,
  Check,
} from "lucide-react";
import { MemoryItem } from "@/types";
import { formatTime } from "@/lib/utils";
import { useLanguage } from "./LanguageProvider";

interface MemoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onMemoriesReset?: () => void;
}

export function MemoryManagerModal({
  isOpen,
  onClose,
  userId = "user_default_01",
  onMemoriesReset,
}: MemoryManagerModalProps) {
  const { language, t } = useLanguage();
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<string>("preference");
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, onClose]);

  const loadMemories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/memories?userId=${userId}`);
      const data = await res.json().catch(() => ({}));
      if (data.memories) {
        setMemories(data.memories);
      }
      setIsSupabaseActive(data.storage === "supabase");
    } catch (err) {
      console.error("Gagal memuat memori:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setAdding(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          content: newContent.trim(),
          category: newCategory,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.memory) {
        setMemories((prev) => [data.memory, ...prev]);
        setNewContent("");
        setShowAddForm(false);
        setIsSupabaseActive(data.storage === "supabase");
        setStatusMessage(
          data.storage === "supabase"
            ? t("newFactSavedPgvector")
            : t("newFactSavedLocal")
        );
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setStatusMessage(null), 3000);
      } else {
        alert(data.error || t("saveMemoryFailed"));
      }
    } catch (err) {
      console.error("Kesalahan menyimpan memori:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!confirm(t("confirmDeleteMemory"))) return;

    try {
      const res = await fetch(`/api/memories?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
        onMemoriesReset?.();
      }
    } catch (err) {
      console.error("Gagal menghapus memori:", err);
    }
  };

  const handleResetAllMemories = async () => {
    const confirmed = confirm(
      t("confirmResetAllMemories")
    );
    if (!confirmed) return;

    setResetting(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/memories?all=true&userId=${userId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMemories([]);
        onMemoriesReset?.();
        setStatusMessage(t("memoryResetSuccess"));
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setStatusMessage(null), 3500);
      } else {
        alert(data.error || t("resetMemoryFailed"));
      }
    } catch (err) {
      console.error("Gagal mereset memori:", err);
    } finally {
      setResetting(false);
    }
  };

  if (!isOpen) return null;

  const categories = [
    { id: "all", label: t("categoryAll") },
    { id: "preference", label: t("categoryPreference") },
    { id: "fact", label: t("categoryFact") },
    { id: "profile", label: t("categoryProfile") },
    { id: "work", label: t("categoryWork") },
    { id: "goal", label: t("categoryGoal") },
  ];

  const categoryLabels: Record<string, string> = {
    preference: t("categoryPreference"),
    fact: t("categoryFact"),
    profile: t("categoryProfile"),
    work: t("categoryWork"),
    goal: t("categoryGoal"),
    general: t("categoryGeneral"),
  };

  const filteredMemories = memories.filter((m) => {
    const matchesSearch =
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || m.category === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog">
        <header className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge" aria-hidden="true">
              <Brain size={16} />
            </div>
            <div>
              <h2 className="modal-title">
                <span>{t("memoryIndexed")}</span>
                <span className="modal-tag-badge">
                  {isSupabaseActive
                    ? t("memoryBackendPgvector")
                    : t("memoryBackendLocal")}
                </span>
              </h2>
              <p className="modal-subtitle">
                {t("memorySubtitle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-button active:scale-95"
            aria-label={t("closeMemoryWindow")}
          >
            <X size={15} />
          </button>
        </header>

        {statusMessage && (
          <div className="modal-status-banner">
            <Check size={14} className="flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="modal-body">
          <div className="modal-toolbar">
            <div className="modal-search-wrap">
              <Search size={14} className="modal-search-icon" aria-hidden="true" />
              <input
                type="search"
                placeholder={t("memorySearch")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="modal-search-input"
                aria-label={t("memorySearch")}
              />
            </div>
            {memories.length > 0 && (
              <button
                type="button"
                onClick={handleResetAllMemories}
                disabled={resetting}
                className="modal-danger-btn active:scale-95"
                title={t("deleteAllMemories")}
              >
                <Trash2 size={13} />
                <span>{resetting ? t("resetting") : t("resetMemory")}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="modal-primary-btn active:scale-95"
            >
              <Plus size={14} />
              <span>{showAddForm ? t("cancel") : t("addFact")}</span>
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddMemory} className="modal-form-card">
              <div className="modal-form-title">
                <Sparkles size={14} />
                <span>{t("manualFactTitle")}</span>
              </div>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder={t("memoryExample")}
                rows={2}
                className="modal-form-textarea"
              />
              <div className="modal-form-footer">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--color-muted)] font-mono">
                    {t("category")}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="modal-form-select"
                  >
                    <option value="preference">{t("categoryPreference")}</option>
                    <option value="fact">{t("categoryFact")}</option>
                    <option value="profile">{t("categoryProfile")}</option>
                    <option value="work">{t("categoryWork")}</option>
                    <option value="goal">{t("categoryGoal")}</option>
                    <option value="general">{t("categoryGeneral")}</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={adding || !newContent.trim()}
                  className="modal-primary-btn active:scale-95 disabled:opacity-40"
                >
                  {adding ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>{t("saving")}</span>
                    </>
                  ) : (
                    <span>{t("saveToVector")}</span>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="modal-tabs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`modal-tab-btn active:scale-95${
                  activeTab === cat.id ? " is-active" : ""
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-scroll-area">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--color-muted)] gap-2">
              <Loader2 size={18} className="animate-spin text-[var(--color-accent)]" />
              <p className="text-xs font-mono">{t("loadingMemoryIndex")}</p>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-muted)]">
              <Brain size={24} className="mx-auto mb-2 text-[var(--color-subtle)]" />
              <p className="text-xs font-medium text-[var(--color-ink)]">
                {t("noMemoryTitle")}
              </p>
              <p className="text-[11px] text-[var(--color-subtle)] mt-1 max-w-sm mx-auto">
                {t("noMemoryDescription")}
              </p>
            </div>
          ) : (
            filteredMemories.map((m) => (
              <div key={m.id} className="modal-item-card">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="modal-item-badge">
                      <Tag size={10} />
                      {categoryLabels[m.category] || m.category}
                    </span>
                    <span className="modal-item-time">
                      {formatTime(
                        m.created_at,
                        language === "id" ? "id-ID" : "en-US"
                      )}
                    </span>
                  </div>
                  <p className="modal-item-text">
                    {m.content}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteMemory(m.id)}
                  className="modal-delete-btn active:scale-95"
                  title={t("deleteMemory")}
                  aria-label={t("deleteMemory")}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        <footer className="modal-footer">
          <span className="font-mono">
            {t("total")} {String(memories.length).padStart(2, "0")}{" "}
            {t("entries")}
          </span>
          <span className="modal-footer-mono">
            {isSupabaseActive
              ? t("memoryFooterPgvector")
              : t("memoryFooterLocal")}
          </span>
        </footer>
      </div>
    </div>
  );
}
