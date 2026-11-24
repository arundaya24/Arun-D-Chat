export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  created_at?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryItem {
  id: string;
  user_id: string;
  content: string;
  category: 'preference' | 'fact' | 'profile' | 'goal' | 'work' | 'general';
  similarity?: number;
  created_at: string;
}

export type AIProvider = 'google' | 'openai';

export interface SystemPromptOptions {
  memories?: MemoryItem[];
}
