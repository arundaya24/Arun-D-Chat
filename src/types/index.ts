export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  conversation_id: string;
  chat_id?: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export type Conversation = ChatSession;

export interface MemoryItem {
  id: string;
  user_id: string;
  content: string;
  category: "preference" | "fact" | "profile" | "goal" | "work" | "general";
  similarity?: number;
  created_at: string;
}

export type AIProvider = "google" | "openai";

export type AccentColor = "green" | "red" | "yellow";

export interface SystemPromptOptions {
  memories?: MemoryItem[];
}

export interface ClientSystemContext {
  timeZone: string;
  formattedDateTime: string;
  dayOfWeek: string;
  isoDate: string;
  deviceOS?: string;
  browser?: string;
}
