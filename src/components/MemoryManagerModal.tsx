"use client";

import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen, userId]);

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
            ? "Fakta baru berhasil disimpan ke database vektor pgvector."
            : "Fakta baru disimpan pada memori lokal sesi aktif."
        );
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        alert(data.error || "Gagal menyimpan data memori");
      }
    } catch (err) {
      console.error("Kesalahan menyimpan memori:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!confirm("Hapus catatan memori ini secara permanen?")) return;

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
      "Apakah Anda yakin ingin menghapus seluruh data memori?\n\nTindakan ini akan menghapus semua informasi personal, fakta, dan preferensi yang diingat AI tentang Anda. Riwayat percakapan tidak akan terhapus."
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
        setStatusMessage("Seluruh data memori berhasil direset secara permanen.");
        setTimeout(() => setStatusMessage(null), 3500);
      } else {
        alert(data.error || "Gagal mereset data memori");
      }
    } catch (err) {
      console.error("Gagal mereset memori:", err);
    } finally {
      setResetting(false);
    }
  };

  if (!isOpen) return null;

  const categories = [
    { id: "all", label: "Semua" },
    { id: "preference", label: "Preferensi" },
    { id: "fact", label: "Fakta" },
    { id: "profile", label: "Profil" },
    { id: "work", label: "Pekerjaan" },
    { id: "goal", label: "Tujuan" },
  ];

  const filteredMemories = memories.filter((m) => {
    const matchesSearch =
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || m.category === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <header className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge" aria-hidden="true">
              <Brain size={16} />
            </div>
            <div>
              <h2 className="modal-title">
                <span>Memori Terindeks</span>
                <span className="modal-tag-badge">
                  {isSupabaseActive ? "pgvector RAG" : "Memori Lokal"}
                </span>
              </h2>
              <p className="modal-subtitle">
                Fakta teknis dan preferensi kerja yang diindeks secara otomatis.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-button active:scale-95"
            aria-label="Tutup jendela memori"
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
                placeholder="Saring berdasarkan kata kunci..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="modal-search-input"
                aria-label="Cari memori"
              />
            </div>
            {memories.length > 0 && (
              <button
                type="button"
                onClick={handleResetAllMemories}
                disabled={resetting}
                className="modal-danger-btn active:scale-95"
                title="Hapus semua memori"
              >
                <Trash2 size={13} />
                <span>{resetting ? "Mereset..." : "Reset Memori"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="modal-primary-btn active:scale-95"
            >
              <Plus size={14} />
              <span>{showAddForm ? "Batal" : "Tambah Fakta"}</span>
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddMemory} className="modal-form-card">
              <div className="modal-form-title">
                <Sparkles size={14} />
                <span>Input Fakta Manual</span>
              </div>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Contoh: Pengguna adalah senior engineer dengan fokus arsitektur sistem dan TypeScript."
                rows={2}
                className="modal-form-textarea"
              />
              <div className="modal-form-footer">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--color-muted)] font-mono">
                    Kategori:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="modal-form-select"
                  >
                    <option value="preference">Preferensi</option>
                    <option value="fact">Fakta</option>
                    <option value="profile">Profil</option>
                    <option value="work">Pekerjaan</option>
                    <option value="goal">Tujuan</option>
                    <option value="general">Umum</option>
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
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan ke Vektor</span>
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
              <p className="text-xs font-mono">Memuat index memori...</p>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-muted)]">
              <Brain size={24} className="mx-auto mb-2 text-[var(--color-subtle)]" />
              <p className="text-xs font-medium text-[var(--color-ink)]">
                Belum ada data memori yang tersimpan.
              </p>
              <p className="text-[11px] text-[var(--color-subtle)] mt-1 max-w-sm mx-auto">
                Fakta baru akan otomatis diekstrak saat Anda berdiskusi, atau Anda dapat menambahkannya secara manual.
              </p>
            </div>
          ) : (
            filteredMemories.map((m) => (
              <div key={m.id} className="modal-item-card">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="modal-item-badge">
                      <Tag size={10} />
                      {m.category.toUpperCase()}
                    </span>
                    <span className="modal-item-time">
                      {formatTime(m.created_at)}
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
                  title="Hapus memori"
                  aria-label="Hapus memori"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        <footer className="modal-footer">
          <span className="font-mono">
            Total: {String(memories.length).padStart(2, "0")} entri
          </span>
          <span className="modal-footer-mono">
            {isSupabaseActive
              ? "pgvector Cosine Distance Matching"
              : "Penyimpanan Memori Lokal Sesi Aktif"}
          </span>
        </footer>
      </div>
    </div>
  );
}
