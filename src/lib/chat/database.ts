import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { localChatsStore } from "@/lib/chat/store";
import { ChatMessage, ChatSession } from "@/types";

export async function fetchUserConversations(
  userId: string = "user_default_01"
): Promise<ChatSession[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data: convData, error: convErr } = await supabase
          .from("conversations")
          .select("id, user_id, title, created_at, updated_at")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false });

        if (!convErr && convData) {
          return convData;
        }

        const { data: chatData, error: chatErr } = await supabase
          .from("chats")
          .select("id, user_id, title, created_at, updated_at")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false });

        if (!chatErr && chatData) {
          return chatData;
        }
      } catch (err) {}
    }
  }

  return localChatsStore.getConversations(userId);
}

export async function createNewConversation(payload: {
  id?: string;
  user_id: string;
  title: string;
}): Promise<ChatSession> {
  const local = localChatsStore.createConversation(payload);

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("conversations")
          .insert({
            id: local.id,
            user_id: local.user_id,
            title: local.title,
            created_at: local.created_at,
            updated_at: local.updated_at,
          })
          .select()
          .maybeSingle();

        if (!error && data) {
          return data;
        }

        const { data: fallbackData } = await supabase
          .from("chats")
          .insert({
            id: local.id,
            user_id: local.user_id,
            title: local.title,
            created_at: local.created_at,
            updated_at: local.updated_at,
          })
          .select()
          .maybeSingle();

        if (fallbackData) {
          return fallbackData;
        }
      } catch (err) {}
    }
  }

  return local;
}

export async function fetchConversationById(
  id: string
): Promise<ChatSession | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data: convData, error: convErr } = await supabase
          .from("conversations")
          .select("id, user_id, title, created_at, updated_at")
          .eq("id", id)
          .maybeSingle();

        if (!convErr && convData) return convData;

        const { data: chatData, error: chatErr } = await supabase
          .from("chats")
          .select("id, user_id, title, created_at, updated_at")
          .eq("id", id)
          .maybeSingle();

        if (!chatErr && chatData) return chatData;
      } catch (err) {}
    }
  }

  return localChatsStore.getConversation(id);
}

export async function updateConversationTitle(
  id: string,
  title: string
): Promise<boolean> {
  localChatsStore.updateConversation(id, { title });

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const now = new Date().toISOString();
      try {
        const { error: convErr } = await supabase
          .from("conversations")
          .update({ title, updated_at: now })
          .eq("id", id);

        if (convErr) {
          await supabase
            .from("chats")
            .update({ title, updated_at: now })
            .eq("id", id);
        }
        return true;
      } catch (err) {}
    }
  }

  return true;
}

export async function deleteConversationRecord(id: string): Promise<boolean> {
  localChatsStore.deleteConversation(id);

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase.from("conversations").delete().eq("id", id);
        await supabase.from("chats").delete().eq("id", id);
        await supabase.from("messages").delete().eq("conversation_id", id);
        await supabase.from("messages").delete().eq("chat_id", id);
      } catch (err) {}
    }
  }

  return true;
}

export async function fetchConversationMessages(
  conversationId: string
): Promise<ChatMessage[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data: msgData, error: msgErr } = await supabase
          .from("messages")
          .select("id, role, content, created_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (!msgErr && msgData && msgData.length > 0) {
          return msgData.map((m) => ({
            id: m.id,
            conversation_id: conversationId,
            role: m.role,
            content: m.content,
            created_at: m.created_at,
          }));
        }

        const { data: legacyData, error: legacyErr } = await supabase
          .from("messages")
          .select("id, role, content, created_at")
          .eq("chat_id", conversationId)
          .order("created_at", { ascending: true });

        if (!legacyErr && legacyData && legacyData.length > 0) {
          return legacyData.map((m) => ({
            id: m.id,
            conversation_id: conversationId,
            role: m.role,
            content: m.content,
            created_at: m.created_at,
          }));
        }
      } catch (err) {}
    }
  }

  return localChatsStore.getMessages(conversationId);
}

export async function persistChatMessagesPair(
  conversationId: string,
  userContent: string,
  assistantContent: string
): Promise<void> {
  localChatsStore.addMessage({
    conversation_id: conversationId,
    role: "user",
    content: userContent,
  });

  localChatsStore.addMessage({
    conversation_id: conversationId,
    role: "assistant",
    content: assistantContent,
  });

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const now = new Date().toISOString();
      try {
        const { error: msgErr } = await supabase.from("messages").insert([
          {
            conversation_id: conversationId,
            role: "user",
            content: userContent,
          },
          {
            conversation_id: conversationId,
            role: "assistant",
            content: assistantContent,
          },
        ]);

        if (msgErr) {
          await supabase.from("messages").insert([
            {
              chat_id: conversationId,
              role: "user",
              content: userContent,
            },
            {
              chat_id: conversationId,
              role: "assistant",
              content: assistantContent,
            },
          ]);
        }

        await supabase
          .from("conversations")
          .update({ updated_at: now })
          .eq("id", conversationId);

        await supabase
          .from("chats")
          .update({ updated_at: now })
          .eq("id", conversationId);
      } catch (err) {}
    }
  }
}
