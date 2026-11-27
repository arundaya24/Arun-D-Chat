import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { generateEmbedding, isAIConfigured } from "@/lib/ai/provider";
import { localMemoriesStore } from "@/lib/memory/store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user_default_01";

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        memories: localMemoriesStore.getMemories(userId),
        storage: "local",
      });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        memories: localMemoriesStore.getMemories(userId),
        storage: "local",
      });
    }

    const { data, error } = await supabase
      .from("memories")
      .select("id, user_id, content, category, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Gagal membaca memori dari Supabase, beralih ke lokal:", error.message);
      return NextResponse.json({
        memories: localMemoriesStore.getMemories(userId),
        storage: "local",
      });
    }

    return NextResponse.json({ memories: data || [], storage: "supabase" });
  } catch (err: any) {
    console.warn("Peringatan pada GET /api/memories:", err.message);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user_default_01";
    return NextResponse.json({
      memories: localMemoriesStore.getMemories(userId),
      storage: "local",
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, category = "general", userId = "user_default_01" } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Konten memori tidak boleh kosong." },
        { status: 400 }
      );
    }

    const validCategories = ["preference", "fact", "profile", "goal", "work", "general"] as const;
    const resolvedCategory = validCategories.includes(category as any) ? category : "general";

    // Mode Supabase terhubung
    if (isSupabaseConfigured() && isAIConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const embedding = await generateEmbedding(content.trim());

          const { data, error } = await supabase
            .from("memories")
            .insert({
              user_id: userId,
              content: content.trim(),
              category: resolvedCategory,
              embedding,
            })
            .select()
            .single();

          if (!error && data) {
            return NextResponse.json({ memory: data, storage: "supabase" }, { status: 201 });
          }
          console.warn("Gagal menyimpan ke Supabase, menyimpan ke fallback lokal:", error?.message);
        } catch (dbErr: any) {
          console.warn("Error saat embedding/insert Supabase:", dbErr.message);
        }
      }
    }

    // Fallback mode lokal (in-memory) saat Supabase belum dikonfigurasi
    const localMemory = localMemoriesStore.addMemory({
      user_id: userId,
      content: content.trim(),
      category: resolvedCategory,
    });

    return NextResponse.json(
      {
        memory: localMemory,
        storage: "local",
        message: "Memori disimpan pada penyimpanan lokal sementara.",
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Parameter ID memori wajib disertakan." },
        { status: 400 }
      );
    }

    localMemoriesStore.deleteMemory(id);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { error } = await supabase.from("memories").delete().eq("id", id);
        if (error) {
          console.warn("Gagal menghapus memori dari database:", error.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Memori berhasil dihapus.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
