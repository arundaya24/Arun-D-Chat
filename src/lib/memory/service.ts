import { generateText } from "ai";
import { getFastModel, generateEmbedding, isAIConfigured } from "@/lib/ai/provider";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { MemoryItem } from "@/types";

export const BASE_SYSTEM_PROMPT =
  "Kamu adalah asisten AI tingkat lanjut yang cerdas, logis, objektif, dan langsung ke inti permasalahan (to-the-point). Hindari basa-basi yang tidak perlu, jangan berhalusinasi, dan jika sebuah informasi tidak pasti atau di luar pengetahuanmu, katakan dengan jujur. Selalu gunakan penalaran terstruktur sebelum menjawab pertanyaan kompleks.";

export function buildAugmentedSystemPrompt(memories: MemoryItem[]): string {
  if (!memories || memories.length === 0) {
    return BASE_SYSTEM_PROMPT;
  }

  const memoryList = memories
    .map((m) => `- [${m.category.toUpperCase()}] ${m.content}`)
    .join("\n");

  return `${BASE_SYSTEM_PROMPT}

[MEMORI JANGKA PANJANG TENTANG PENGGUNA]:
Berikut adalah fakta, preferensi, dan profil tentang pengguna yang telah kamu pelajari dari percakapan sebelumnya:
${memoryList}

Gunakan memori di atas secara alami untuk menyesuaikan jawabanmu agar relevan, personal, dan konsisten tanpa perlu secara eksplisit mengatakan 'berdasarkan database memoriku' atau sejenisnya.`;
}

export async function retrieveRelevantMemories(
  query: string,
  userId: string = "user_default_01",
  threshold: number = 0.55,
  limit: number = 5
): Promise<MemoryItem[]> {
  if (!isSupabaseConfigured() || !isAIConfigured()) return [];
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  try {
    const embedding = await generateEmbedding(query);

    const { data, error } = await supabase.rpc("match_memories", {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      p_user_id: userId,
    });

    if (error) {
      console.warn("Pencarian memori Supabase dilewati:", error.message);
      return [];
    }

    return (data as MemoryItem[]) || [];
  } catch (err) {
    console.warn("Kesalahan pada retrieveRelevantMemories:", err);
    return [];
  }
}

export async function extractAndSaveMemories(
  userMessage: string,
  assistantResponse: string,
  userId: string = "user_default_01"
): Promise<void> {
  if (!isSupabaseConfigured() || !isAIConfigured()) return;
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    const fastModel = getFastModel();

    const prompt = `Analisis percakapan berikut antara Pengguna (User) dan Asisten (Assistant).
Tentukan apakah ada fakta permanen baru, preferensi, kebiasaan, pekerjaan, nama, atau tujuan jangka panjang yang diungkapkan oleh PENGGUNA.

Pedoman:
1. Hanya ekstrak hal yang bernilai untuk diingat di sesi-sesi mendatang (contoh: "User adalah software engineer yang suka Next.js", "User tinggal di Jakarta", "User lebih suka penjelasan teknis tanpa analogi anak kecil").
2. JANGAN simpan percakapan biasa, keluhan sementara, atau pertanyaan sesaat (contoh: "user bertanya cara instal docker" -> BUKAN memori).
3. Kembalikan format JSON murni:
[
  { "content": "teks fakta yang jelas", "category": "preference" | "fact" | "profile" | "goal" | "work" }
]
Jika TIDAK ADA fakta baru yang perlu disimpan, kembalikan array kosong [].

Percakapan:
User: "${userMessage}"
Assistant: "${assistantResponse}"

Hasil JSON:`;

    const result = await generateText({
      model: fastModel,
      prompt,
      temperature: 0.1,
    });

    const responseText = result.text.trim();
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return;

    const extracted: Array<{ content: string; category: string }> = JSON.parse(
      jsonMatch[0]
    );

    for (const item of extracted) {
      if (!item.content || item.content.length < 5) continue;

      const newEmbedding = await generateEmbedding(item.content);

      const { data: existingSimilar } = await supabase.rpc("match_memories", {
        query_embedding: newEmbedding,
        match_threshold: 0.85,
        match_count: 1,
        p_user_id: userId,
      });

      if (existingSimilar && existingSimilar.length > 0) {
        continue;
      }

      const category = ["preference", "fact", "profile", "goal", "work"].includes(
        item.category
      )
        ? item.category
        : "general";

      await supabase.from("memories").insert({
        user_id: userId,
        content: item.content,
        category: category,
        embedding: newEmbedding,
      });
    }
  } catch (err) {
    console.warn("Latar belakang ekstraksi memori dilewati:", err);
  }
}

export async function generateChatTitle(
  firstMessage: string,
  chatId: string
): Promise<string> {
  if (!isSupabaseConfigured() || !isAIConfigured()) return "Percakapan Baru";
  const supabase = getSupabaseAdmin();
  if (!supabase) return "Percakapan Baru";

  try {
    const fastModel = getFastModel();
    const { text } = await generateText({
      model: fastModel,
      prompt: `Buat judul singkat (3 sampai 5 kata dalam Bahasa Indonesia) yang merefleksikan topik dari pesan pengguna berikut. Jangan sertakan tanda petik, tanda baca berlebih, atau kata pengantar apapun.
Pesan Pengguna: "${firstMessage}"
Judul:`,
      temperature: 0.3,
    });

    const title =
      text.replace(/["'\n\r]/g, "").trim().slice(0, 40) || "Percakapan Baru";

    await supabase
      .from("chats")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", chatId);

    return title;
  } catch (err) {
    console.warn("Latar belakang judul chat dilewati:", err);
    return "Percakapan Baru";
  }
}
