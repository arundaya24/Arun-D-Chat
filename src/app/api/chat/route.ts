import { streamText } from "ai";
import { getChatModel, getAIProvider, isAIConfigured } from "@/lib/ai/provider";
import {
  retrieveRelevantMemories,
  buildAugmentedSystemPrompt,
  extractAndSaveMemories,
  generateChatTitle,
} from "@/lib/memory/service";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";

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
    const { messages, chatId, userId = "user_default_01" } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Pesan tidak boleh kosong." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage.content || "";

    const relevantMemories = await retrieveRelevantMemories(userPrompt, userId);
    const systemPrompt = buildAugmentedSystemPrompt(relevantMemories);
    const model = getChatModel();

    const result = await streamText({
      model,
      system: systemPrompt,
      messages,
      temperature: 0.7,
      async onFinish({ text }) {
        if (isSupabaseConfigured() && chatId && isValidUUID(chatId)) {
          const supabase = getSupabaseAdmin();
          if (supabase) {
            try {
              await supabase.from("messages").insert([
                { chat_id: chatId, role: "user", content: userPrompt },
                { chat_id: chatId, role: "assistant", content: text },
              ]);

              await supabase
                .from("chats")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", chatId);

              const { data: chatData } = await supabase
                .from("chats")
                .select("title")
                .eq("id", chatId)
                .maybeSingle();

              if (chatData && chatData.title === "Percakapan Baru") {
                generateChatTitle(userPrompt, chatId).catch((err) =>
                  console.warn("Gagal membuat judul obrolan:", err)
                );
              }
            } catch (dbErr) {
              console.warn("Penyimpanan riwayat chat dilewati:", dbErr);
            }
          }
        }

        if (isAIConfigured()) {
          extractAndSaveMemories(userPrompt, text, userId).catch((memErr) =>
            console.warn("Ekstraksi memori latar belakang dilewati:", memErr)
          );
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
