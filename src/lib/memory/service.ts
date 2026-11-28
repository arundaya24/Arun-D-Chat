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

  let memoryBlock = "";
  if (memories && memories.length > 0) {
    const profiles = memories.filter((m) => m.category === "profile");
    const preferences = memories.filter((m) => m.category === "preference");
    const otherContext = memories.filter(
      (m) => m.category !== "profile" && m.category !== "preference"
    );

    const sections: string[] = [];

    if (profiles.length > 0) {
      sections.push(
        `[IDENTITAS & PROFIL PENGGUNA]:\n` +
          profiles.map((m) => `- ${m.content}`).join("\n")
      );
    }

    if (preferences.length > 0) {
      sections.push(
        `[PENGATURAN KEPRIBADIAN & GAYA KOMUNIKASI WAJIB]:\n` +
          preferences.map((m) => `- ${m.content}`).join("\n")
      );
    }

    if (otherContext.length > 0) {
      sections.push(
        `[TUJUAN, PEKERJAAN & FAKTA TERKAIT]:\n` +
          otherContext
            .map((m) => `- [${m.category.toUpperCase()}] ${m.content}`)
            .join("\n")
      );
    }

    memoryBlock = `\n\n[MEMORI GLOBAL PERSISTEN TENTANG PENGGUNA]:
Informasi berikut tersimpan permanen lintas seluruh sesi percakapan (diurutkan dari pembaruan terbaru ke paling lama):
${sections.join("\n\n")}

Instruksi Persistensi Memori & Kepribadian:
1. Kamu WAJIB menerapkan identitas, gaya komunikasi, nada bicara, sapaan/kata ganti, dan kepribadian yang tertulis pada [PENGATURAN KEPRIBADIAN & GAYA KOMUNIKASI WAJIB] di atas SEJAK PESAN PERTAMA pada percakapan baru ini maupun percakapan lanjutan.
2. Prioritaskan gaya bahasa dan kepribadian yang ditetapkan pengguna dibanding nada formal standar. Jika terdapat pembaruan preferensi, ikuti entri yang berada di urutan paling atas (terbaru).
3. Kamu sudah mengenal pengguna dari [IDENTITAS & PROFIL PENGGUNA]. Jangan pernah bersikap seolah baru pertama kali bertemu atau meminta pengguna memperkenalkan ulang dirinya.
4. Gunakan memori di atas secara alami tanpa menyebut frasa kaku seperti 'berdasarkan database memoriku' kecuali memang ditanyakan oleh pengguna.`;
  }

  return `${BASE_SYSTEM_PROMPT}

${temporalBlock}${memoryBlock}`;
}

export async function retrieveRelevantMemories(
  query: string,
  userId: string = "user_default_01",
  threshold: number = 0.55,
  limit: number = 12
): Promise<MemoryItem[]> {
  let allUserMemories: MemoryItem[] = [];
  let vectorMatched: MemoryItem[] = [];

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data: coreData } = await supabase
          .from("memories")
          .select("id, user_id, content, category, created_at")
          .eq("user_id", userId)
          .in("category", ["profile", "preference"])
          .order("created_at", { ascending: false });

        if (coreData && coreData.length > 0) {
          allUserMemories = coreData as MemoryItem[];
        }

        if (isAIConfigured() && query.trim().length > 0) {
          const embedding = await generateEmbedding(query);
          const { data: rpcData } = await supabase.rpc("match_memories", {
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: limit,
            p_user_id: userId,
          });
          if (rpcData && Array.isArray(rpcData)) {
            vectorMatched = rpcData as MemoryItem[];
          }
        }

        if (allUserMemories.length === 0 && vectorMatched.length === 0) {
          const { data: recentData } = await supabase
            .from("memories")
            .select("id, user_id, content, category, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(limit);
          if (recentData) {
            allUserMemories = recentData as MemoryItem[];
          }
        }
      } catch (err) {
        console.warn("Kesalahan pada retrieveRelevantMemories Supabase:", err);
      }
    }
  }

  const localMemories = localMemoriesStore.getMemories(userId);
  const sourceMemories =
    allUserMemories.length > 0 ? allUserMemories : localMemories;

  if (sourceMemories.length === 0 && vectorMatched.length === 0) {
    return [];
  }

  const coreProfileAndPreferences = sourceMemories.filter(
    (m) => m.category === "profile" || m.category === "preference"
  );

  const contextualPool = (
    localMemories.length > 0 ? localMemories : sourceMemories
  ).filter((m) => m.category !== "profile" && m.category !== "preference");

  const queryTokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  let keywordMatched: MemoryItem[] = [];
  if (queryTokens.length > 0) {
    keywordMatched = contextualPool
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
      .map((entry) => entry.item);
  }

  const combinedContextual = [...vectorMatched, ...keywordMatched];
  const uniqueContextual = new Map<string, MemoryItem>();
  for (const item of combinedContextual) {
    if (
      item.category !== "profile" &&
      item.category !== "preference" &&
      !uniqueContextual.has(item.id)
    ) {
      uniqueContextual.set(item.id, item);
    }
  }

  const matchedContextualList = Array.from(uniqueContextual.values());
  if (matchedContextualList.length < 4) {
    for (const item of contextualPool) {
      if (!uniqueContextual.has(item.id)) {
        matchedContextualList.push(item);
        uniqueContextual.set(item.id, item);
      }
      if (matchedContextualList.length >= 4) break;
    }
  }

  const finalMap = new Map<string, MemoryItem>();
  for (const item of [
    ...coreProfileAndPreferences.slice(0, 12),
    ...matchedContextualList.slice(0, 6),
  ]) {
    if (!finalMap.has(item.id)) {
      finalMap.set(item.id, item);
    }
  }

  return Array.from(finalMap.values());
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
Tentukan apakah ada fakta permanen baru, preferensi komunikasi, pengaturan kepribadian/persona AI, sapaan/kata ganti, pekerjaan, nama, profil, atau tujuan jangka panjang yang diungkapkan oleh PENGGUNA.

Pedoman:
1. Ekstrak seluruh informasi yang bernilai persisten lintas sesi, termasuk identitas diri (nama, sekolah, lokasi, keahlian), tujuan, maupun pengaturan gaya bicara/kepribadian AI yang diminta pengguna (contoh: "User lebih suka gaya komunikasi santai/tegas dengan kata ganti gw/lu", "User bernama Budi dan berprofesi sebagai backend engineer").
2. JANGAN simpan pertanyaan teknis sesaat atau percakapan umum tanpa informasi personal/preferensi (contoh: "user bertanya cara instal docker" -> BUKAN memori).
3. Kembalikan format JSON murni:
[
  { "content": "teks fakta atau preferensi yang jelas", "category": "preference" | "fact" | "profile" | "goal" | "work" }
]
Jika TIDAK ADA fakta baru atau preferensi baru yang perlu disimpan, kembalikan array kosong [].

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

      localMemoriesStore.addMemory({
        user_id: userId,
        content: item.content,
        category,
      });

      if (!isSupabaseConfigured()) {
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
