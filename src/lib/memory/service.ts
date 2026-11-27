import { generateText } from "ai";
import { getFastModel, generateEmbedding, isAIConfigured } from "@/lib/ai/provider";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { localMemoriesStore } from "@/lib/memory/store";
import { MemoryItem, ClientSystemContext } from "@/types";
import { getClientSystemContext } from "@/lib/client-context";
import { updateConversationTitle } from "@/lib/chat/database";

export const BASE_SYSTEM_PROMPT =
  "Kamu adalah asisten AI tingkat lanjut yang cerdas, logis, objektif, dan langsung ke inti permasalahan (to-the-point). Hindari basa-basi yang tidak perlu, jangan berhalusinasi, dan jika sebuah informasi tidak pasti atau di luar pengetahuanmu, katakan dengan jujur. Selalu gunakan penalaran terstruktur sebelum menjawab pertanyaan kompleks.";

export function buildAugmentedSystemPrompt(
  memories: MemoryItem[],
  context?: ClientSystemContext
): string {
  const temporal = context || getClientSystemContext();

  const temporalBlock = `[KONTEKS SISTEM & WAKTU NYATA]:
- Hari saat ini: ${temporal.dayOfWeek}
- Waktu & Tanggal Lokal: ${temporal.formattedDateTime}
- Zona Waktu: ${temporal.timeZone}
- Sistem Operasi / Perangkat: ${temporal.deviceOS || "Perangkat Pengguna"}
- Klien Browser: ${temporal.browser || "Web"}
- Timestamp ISO: ${temporal.isoDate}

Instruksi Waktu & Sistem:
1. Kamu memiliki akses real-time langsung ke tanggal, hari, jam, dan zona waktu lokal pengguna saat ini.
2. Jika pengguna menanyakan hari apa hari ini, tanggal berapa sekarang, waktu saat ini, atau relasi waktu seperti kemarin, besok, lusa, atau minggu depan, gunakan informasi waktu lokal di atas secara akurat dan tegas tanpa ragu.
3. JANGAN PERNAH menyatakan bahwa kamu tidak memiliki akses waktu nyata atau terbatas pada knowledge cutoff ketika ditanya mengenai hari, tanggal, atau waktu saat ini.`;

  const memoryBlock =
    memories && memories.length > 0
      ? `\n\n[MEMORI JANGKA PANJANG TENTANG PENGGUNA]:
Berikut adalah fakta, preferensi, dan profil tentang pengguna yang telah kamu pelajari dari percakapan sebelumnya:
${memories.map((m) => `- [${m.category.toUpperCase()}] ${m.content}`).join("\n")}

Gunakan memori di atas secara alami untuk menyesuaikan jawabanmu agar relevan, personal, dan konsisten tanpa perlu secara eksplisit mengatakan 'berdasarkan database memoriku' atau sejenisnya.`
      : "";

  return `${BASE_SYSTEM_PROMPT}

${temporalBlock}${memoryBlock}`;
}

export async function retrieveRelevantMemories(
  query: string,
  userId: string = "user_default_01",
  threshold: number = 0.55,
  limit: number = 5
): Promise<MemoryItem[]> {
  if (!isAIConfigured()) return [];

  if (!isSupabaseConfigured()) {
    const local = localMemoriesStore.getMemories(userId);
    if (local.length === 0) return [];

    const queryTokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);

    if (queryTokens.length === 0) return local.slice(0, limit);

    return local
      .map((m) => {
        const contentLower = m.content.toLowerCase();
        const score = queryTokens.reduce(
          (acc, token) => (contentLower.includes(token) ? acc + 1 : acc),
          0
        );
        return { item: m, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => entry.item);
  }

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
  if (!isAIConfigured()) return;

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

      const category = ["preference", "fact", "profile", "goal", "work"].includes(
        item.category
      )
        ? (item.category as any)
        : "general";

      if (!isSupabaseConfigured()) {
        localMemoriesStore.addMemory({
          user_id: userId,
          content: item.content,
          category,
        });
        continue;
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) continue;

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

      await supabase.from("memories").insert({
        user_id: userId,
        content: item.content,
        category,
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
  const cleanExcerpt =
    firstMessage
      .replace(/["'\n\r]/g, " ")
      .trim()
      .slice(0, 32) || "Percakapan Baru";

  if (!isAIConfigured()) {
    await updateConversationTitle(chatId, cleanExcerpt);
    return cleanExcerpt;
  }

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
      text.replace(/["'\n\r]/g, "").trim().slice(0, 40) || cleanExcerpt;

    await updateConversationTitle(chatId, title);
    return title;
  } catch (err) {
    await updateConversationTitle(chatId, cleanExcerpt);
    return cleanExcerpt;
  }
}
