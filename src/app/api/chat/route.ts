import { streamText } from "ai";
import { getChatModel, getAIProvider, isAIConfigured } from "@/lib/ai/provider";
import {
  retrieveRelevantMemories,
  buildAugmentedSystemPrompt,
  extractAndSaveMemories,
  generateChatTitle,
} from "@/lib/memory/service";
import { getClientSystemContext } from "@/lib/client-context";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  persistChatMessagesPair,
  fetchConversationById,
  updateConversationTitle,
} from "@/lib/chat/database";
import { generateFastTitle } from "@/lib/utils";

export const maxDuration = 60;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export async function GET() {
  return new Response(
    JSON.stringify({
      status: "active",
      message: "API endpoint Arun-D'Chat aktif. Kirim permintaan POST dengan payload pesan.",
      aiConfigured: isAIConfigured(),
      supabaseConfigured: isSupabaseConfigured(),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous_client";
    const rateCheck = checkRateLimit(ip, 30, 60 * 1000);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({
          error:
            "Terlalu banyak permintaan (Rate limit exceeded). Silakan tunggu sebentar.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!isAIConfigured()) {
      const provider = getAIProvider();
      const keyName =
        provider === "openai"
          ? "OPENAI_API_KEY"
          : "GOOGLE_GENERATIVE_AI_API_KEY";
      return new Response(
        JSON.stringify({
          error: `API Key belum dikonfigurasi. Silakan tambahkan ${keyName} di file .env.local untuk mulai mengobrol.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      messages,
      chatId,
      userId = "user_default_01",
      clientContext,
    } = body;

    const rawMessages = Array.isArray(messages) ? messages : [];
    const validMessages = rawMessages
      .filter((m) => m && (m.role === "user" || m.role === "assistant"))
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: String(m.content || "").trim(),
      }))
      .filter((m) => m.content.length > 0);

    if (validMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Pesan tidak boleh kosong." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const boundedMessages = validMessages.slice(-14);
    const lastUserMessage = [...boundedMessages]
      .reverse()
      .find((m) => m.role === "user");
    const userPrompt = lastUserMessage?.content || "";

    const userAgentHeader = req.headers.get("user-agent") || undefined;
    const effectiveContext =
      clientContext || getClientSystemContext(userAgentHeader);

    const relevantMemories = await retrieveRelevantMemories(userPrompt, userId);
    const systemPrompt = buildAugmentedSystemPrompt(
      relevantMemories,
      effectiveContext
    );
    const model = getChatModel();

    const result = await streamText({
      model,
      system: systemPrompt,
      messages: boundedMessages,
      temperature: 0.7,
      async onFinish({ text }) {
        const effectiveChatId = chatId || body.conversationId;
        const validText = typeof text === "string" ? text.trim() : "";
        if (effectiveChatId && validText.length > 0) {
          try {
            await persistChatMessagesPair(
              effectiveChatId,
              userPrompt,
              validText
            );

            const chatData = await fetchConversationById(effectiveChatId);
            if (chatData && (chatData.title === "Percakapan Baru" || !chatData.title)) {
              const fastTitle = generateFastTitle(userPrompt);
              await updateConversationTitle(effectiveChatId, fastTitle);
            }
          } catch (dbErr) {}
        }

        if (isAIConfigured() && validText.length > 0) {
          extractAndSaveMemories(userPrompt, validText, userId).catch(() => {});
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("Error pada /api/chat:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Terjadi kesalahan internal pada server AI.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
