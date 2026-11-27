import fs from "fs";
import path from "path";
import { MemoryItem } from "@/types";

declare global {
  var __local_memories: MemoryItem[] | undefined;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "memory_store.json");

function ensureStorageLoaded() {
  if (globalThis.__local_memories) {
    return;
  }

  globalThis.__local_memories = [];

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        globalThis.__local_memories = parsed;
      }
    }
  } catch (err) {
    globalThis.__local_memories = [];
  }
}

function persistStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const payload = JSON.stringify(
      globalThis.__local_memories || [],
      null,
      2
    );
    fs.writeFileSync(DATA_FILE, payload, "utf-8");
  } catch (err) {}
}

export const localMemoriesStore = {
  getMemories(userId: string = "user_default_01"): MemoryItem[] {
    ensureStorageLoaded();
    return (globalThis.__local_memories || [])
      .filter((m) => m.user_id === userId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  },

  addMemory(item: {
    id?: string;
    user_id: string;
    content: string;
    category: MemoryItem["category"];
  }): MemoryItem {
    ensureStorageLoaded();
    const memory: MemoryItem = {
      id: item.id || crypto.randomUUID(),
      user_id: item.user_id,
      content: item.content,
      category: item.category,
      created_at: new Date().toISOString(),
    };

    if (!globalThis.__local_memories) {
      globalThis.__local_memories = [];
    }

    const exists = globalThis.__local_memories.some(
      (m) =>
        m.user_id === item.user_id &&
        m.content.toLowerCase().trim() === item.content.toLowerCase().trim()
    );

    if (!exists) {
      globalThis.__local_memories.unshift(memory);
      persistStorage();
    }

    return memory;
  },

  deleteMemory(id: string): boolean {
    ensureStorageLoaded();
    if (!globalThis.__local_memories) return false;
    const initialLen = globalThis.__local_memories.length;
    globalThis.__local_memories = globalThis.__local_memories.filter(
      (m) => m.id !== id
    );
    if (globalThis.__local_memories.length < initialLen) {
      persistStorage();
      return true;
    }
    return false;
  },

  clearMemories(userId: string = "user_default_01"): boolean {
    ensureStorageLoaded();
    if (!globalThis.__local_memories) return false;
    globalThis.__local_memories = globalThis.__local_memories.filter(
      (m) => m.user_id !== userId
    );
    persistStorage();
    return true;
  },
};
