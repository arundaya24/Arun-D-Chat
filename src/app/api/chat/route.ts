import { streamText } from "ai";
import { getChatModel } from "@/lib/ai/provider";
import {
  retrieveRelevantMemories,
  buildAugmentedSystemPrompt,
  extractAndSaveMemories,
  generateChatTitle,
} from "@/lib/memory/service";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";

// Izinkan streaming response hingga 60 detik pada serverless
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Protection (30 request per menit per IP)
    const ip = req.headers.get("x-forwarded-for") || "anonymous_client";
    const rateCheck = checkRateLimit(ip, 30, 60 * 1000);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "Terlalu banyak permintaan (Rate limit exceeded). Silakan tunggu sebentar.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
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

    // 2. Context Retrieval (RAG): Ambil memori jangka panjang yang relevan
    const relevantMemories = await retrieveRelevantMemories(userPrompt, userId);

    // 3. Gabungkan System Prompt Anti-Plenger dengan Memori Terambil
    const systemPrompt = buildAugmentedSystemPrompt(relevantMemories);

    // 4. Inisialisasi Model AI dari Provider (.env.local)
    const model = getChatModel();

    // 5. Stream Text Response
    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      temperature: 0.7,
      async onFinish({ text }) {
        // Background Process: Simpan pesan & ekstraksi memori tanpa memblokir stream
        const supabase = getSupabaseAdmin();
        if (supabase && chatId) {
          try {
            // A. Simpan pesan user dan assistant ke database
            await supabase.from("messages").insert([
              { chat_id: chatId, role: "user", content: userPrompt },
              { chat_id: chatId, role: "assistant", content: text },
            ]);

            // B. Update waktu aktif chat
            await supabase
              .from("chats")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", chatId);

            // C. Cek apakah judul chat perlu di-generate otomatis
            const { data: chatData } = await supabase
              .from("chats")
              .select("title")
              .eq("id", chatId)
              .single();

            if (chatData && chatData.title === "Percakapan Baru") {
              generateChatTitle(userPrompt, chatId).catch((err) =>
                console.error("Gagal generate title di background:", err)
              );
            }
          } catch (dbErr) {
            console.error("Gagal menyimpan pesan ke database:", dbErr);
          }
        }

        // D. Self-Learning Memory Extraction Pipeline
        // Ekstrak fakta baru dari interaksi user dan simpan ke pgvector
        extractAndSaveMemories(userPrompt, text, userId).catch((memErr) =>
          console.error("Gagal ekstraksi memori di background:", memErr)
        );
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
