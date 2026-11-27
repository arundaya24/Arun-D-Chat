import fs from "fs";
import path from "path";
import { ChatMessage, ChatSession } from "@/types";

declare global {
  var __local_conversations: ChatSession[] | undefined;
  var __local_messages: ChatMessage[] | undefined;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "chat_store.json");

function ensureStorageLoaded() {
  if (globalThis.__local_conversations && globalThis.__local_messages) {
    return;
  }

  globalThis.__local_conversations = [];
  globalThis.__local_messages = [];

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.conversations)) {
        globalThis.__local_conversations = parsed.conversations;
      }
      if (Array.isArray(parsed.messages)) {
        globalThis.__local_messages = parsed.messages;
      }
    }
  } catch (err) {
    globalThis.__local_conversations = [];
    globalThis.__local_messages = [];
  }
}

function persistStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const payload = JSON.stringify(
      {
        conversations: globalThis.__local_conversations || [],
        messages: globalThis.__local_messages || [],
      },
      null,
      2
    );
    fs.writeFileSync(DATA_FILE, payload, "utf-8");
  } catch (err) {}
}

export const localChatsStore = {
  getConversations(userId: string = "user_default_01"): ChatSession[] {
    ensureStorageLoaded();
    const list = globalThis.__local_conversations || [];
    return list
      .filter((c) => c.user_id === userId)
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  },

  getConversation(id: string): ChatSession | null {
    ensureStorageLoaded();
    const list = globalThis.__local_conversations || [];
    return list.find((c) => c.id === id) || null;
  },

  createConversation(item: {
    id?: string;
    user_id: string;
    title: string;
  }): ChatSession {
    ensureStorageLoaded();
    const now = new Date().toISOString();
    const session: ChatSession = {
      id: item.id || crypto.randomUUID(),
      user_id: item.user_id,
      title: item.title || "Percakapan Baru",
      created_at: now,
      updated_at: now,
    };

    if (!globalThis.__local_conversations) {
      globalThis.__local_conversations = [];
    }

    const index = globalThis.__local_conversations.findIndex(
      (c) => c.id === session.id
    );
    if (index >= 0) {
      globalThis.__local_conversations[index] = session;
    } else {
      globalThis.__local_conversations.unshift(session);
    }

    persistStorage();
    return session;
  },

  updateConversation(
    id: string,
    updates: { title?: string; updated_at?: string }
  ): ChatSession | null {
    ensureStorageLoaded();
    if (!globalThis.__local_conversations) return null;
    const item = globalThis.__local_conversations.find((c) => c.id === id);
    if (!item) return null;

    if (updates.title) item.title = updates.title;
    item.updated_at = updates.updated_at || new Date().toISOString();

    persistStorage();
    return item;
  },

  deleteConversation(id: string): boolean {
    ensureStorageLoaded();
    if (!globalThis.__local_conversations) return false;
    globalThis.__local_conversations = globalThis.__local_conversations.filter(
      (c) => c.id !== id
    );
    if (globalThis.__local_messages) {
      globalThis.__local_messages = globalThis.__local_messages.filter(
        (m) => m.conversation_id !== id && m.chat_id !== id
      );
    }
    persistStorage();
    return true;
  },

  getMessages(conversationId: string): ChatMessage[] {
    ensureStorageLoaded();
    const list = globalThis.__local_messages || [];
    return list
      .filter(
        (m) =>
          m.conversation_id === conversationId || m.chat_id === conversationId
      )
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
  },

  addMessage(item: {
    id?: string;
    conversation_id: string;
    role: "user" | "assistant" | "system";
    content: string;
    created_at?: string;
  }): ChatMessage {
    ensureStorageLoaded();
    const now = item.created_at || new Date().toISOString();
    const message: ChatMessage = {
      id: item.id || crypto.randomUUID(),
      conversation_id: item.conversation_id,
      chat_id: item.conversation_id,
      role: item.role,
      content: item.content,
      created_at: now,
    };

    if (!globalThis.__local_messages) {
      globalThis.__local_messages = [];
    }

    globalThis.__local_messages.push(message);

    if (globalThis.__local_conversations) {
      const conv = globalThis.__local_conversations.find(
        (c) => c.id === item.conversation_id
      );
      if (conv) {
        conv.updated_at = now;
      }
    }

    persistStorage();
    return message;
  },
};
