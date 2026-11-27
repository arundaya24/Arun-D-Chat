import { MemoryItem } from "@/types";

declare global {
  // eslint-disable-next-line no-var
  var __local_memories: MemoryItem[] | undefined;
}

if (!globalThis.__local_memories) {
  globalThis.__local_memories = [];
}

export const localMemoriesStore = {
  getMemories(userId: string = "user_default_01"): MemoryItem[] {
    return (globalThis.__local_memories || []).filter(
      (m) => m.user_id === userId
    );
  },

  addMemory(item: {
    user_id: string;
    content: string;
    category: MemoryItem["category"];
  }): MemoryItem {
    const memory: MemoryItem = {
      id: crypto.randomUUID(),
      user_id: item.user_id,
      content: item.content,
      category: item.category,
      created_at: new Date().toISOString(),
    };

    if (!globalThis.__local_memories) {
      globalThis.__local_memories = [];
    }

    // Hindari duplikasi konten yang sama persis
    const exists = globalThis.__local_memories.some(
      (m) =>
        m.user_id === item.user_id &&
        m.content.toLowerCase().trim() === item.content.toLowerCase().trim()
    );

    if (!exists) {
      globalThis.__local_memories.unshift(memory);
    }

    return memory;
  },

  deleteMemory(id: string): boolean {
    if (!globalThis.__local_memories) return false;
    const initialLen = globalThis.__local_memories.length;
    globalThis.__local_memories = globalThis.__local_memories.filter(
      (m) => m.id !== id
    );
    return globalThis.__local_memories.length < initialLen;
  },
};
