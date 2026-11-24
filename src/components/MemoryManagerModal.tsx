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
  CheckCircle,
} from "lucide-react";
import { MemoryItem } from "@/types";
import { formatTime } from "@/lib/utils";

interface MemoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export function MemoryManagerModal({
  isOpen,
  onClose,
  userId = "user_default_01",
}: MemoryManagerModalProps) {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Form tambah memori manual
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<string>("preference");
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen, userId]);

  const loadMemories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/memories?userId=${userId}`);
      const data = await res.json();
      if (data.memories) {
        setMemories(data.memories);
      }
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
      const data = await res.json();
      if (res.ok && data.memory) {
        setMemories((prev) => [data.memory, ...prev]);
        setNewContent("");
        setShowAddForm(false);
        setStatusMessage("Memori berhasil ditambahkan dan di-embed ke vektor!");
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        alert(data.error || "Gagal menambah memori");
      }
    } catch (err) {
      console.error("Error adding memory:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!confirm("Hapus fakta/memori ini dari ingatan AI?")) return;

    try {
      const res = await fetch(`/api/memories?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error("Error deleting memory:", err);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[#1e1e1e] border border-[#3c3c3c] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-[#ececec]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2d2d] bg-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Kelola Memori Jangka Panjang
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-normal">
                  Self-Learning RAG
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Fakta dan preferensi yang dipelajari AI dari obrolanmu secara otomatis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#2d2d2d] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            {statusMessage}
          </div>
        )}

        {/* Toolbar & Filter */}
        <div className="p-6 pb-2 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari memori yang dipelajari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#2a2a2a] border border-[#3c3c3c] rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? "Tutup" : "Tambah Fakta"}</span>
            </button>
          </div>

          {/* Form Tambah Manual */}
          {showAddForm && (
            <form
              onSubmit={handleAddMemory}
              className="p-4 bg-[#262626] border border-[#3c3c3c] rounded-xl space-y-3 animate-in"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                Tambah Fakta Manual untuk Mengajari AI
              </div>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Contoh: Saya adalah senior frontend engineer dan lebih suka kode dalam TypeScript murni."
                rows={2}
                className="w-full p-3 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-neutral-400">Kategori:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
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
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  {adding ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan ke Vektor"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                  activeTab === cat.id
                    ? "bg-neutral-200 text-neutral-900 font-semibold"
                    : "bg-[#2a2a2a] text-neutral-400 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Memory List Container */}
        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-2.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <p className="text-sm">Menghubungkan ke basis data memori...</p>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-[#333] rounded-xl text-neutral-400">
              <Brain className="w-10 h-10 mx-auto mb-2 text-neutral-600" />
              <p className="text-sm font-medium text-neutral-300">
                Belum ada memori yang tersimpan.
              </p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                AI akan otomatis mengekstrak preferensi dan fakta baru seiring kamu mengobrol, atau kamu bisa menambahkannya secara manual.
              </p>
            </div>
          ) : (
            filteredMemories.map((m) => (
              <div
                key={m.id}
                className="group flex items-start justify-between gap-3 p-3.5 bg-[#252525] hover:bg-[#2a2a2a] border border-[#333] rounded-xl transition"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#1e1e1e] border border-[#3c3c3c] text-emerald-400">
                      <Tag className="w-3 h-3" />
                      {m.category.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      {formatTime(m.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-200 leading-relaxed font-sans">
                    {m.content}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteMemory(m.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  title="Hapus memori ini"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3.5 bg-[#171717] border-t border-[#2d2d2d] flex items-center justify-between text-xs text-neutral-400">
          <span>Total Memori: {memories.length} fakta</span>
          <span className="text-[11px] text-neutral-500">
            pgvector Cosine Distance Retrieval
          </span>
        </div>
      </div>
    </div>
  );
}
