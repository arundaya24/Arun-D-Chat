import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { generateEmbedding, isAIConfigured } from "@/lib/ai/provider";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user_default_01";

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ memories: [] });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ memories: [] });
    }

    const { data, error } = await supabase
      .from("memories")
      .select("id, user_id, content, category, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Gagal membaca memori dari Supabase:", error.message);
      return NextResponse.json({ memories: [] });
    }

    return NextResponse.json({ memories: data || [] });
  } catch (err: any) {
    console.warn("Peringatan pada GET /api/memories:", err.message);
    return NextResponse.json({ memories: [] });
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

    if (!isSupabaseConfigured() || !isAIConfigured()) {
      return NextResponse.json(
        {
          error:
            "Database Supabase atau AI API Key belum dikonfigurasi di .env.local untuk menyimpan memori permanen.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Koneksi database tidak tersedia." },
        { status: 503 }
      );
    }

    const embedding = await generateEmbedding(content.trim());

    const { data, error } = await supabase
      .from("memories")
      .insert({
        user_id: userId,
        content: content.trim(),
        category,
        embedding,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ memory: data }, { status: 201 });
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

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: "Memori berhasil dihapus.",
      });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.from("memories").delete().eq("id", id);
    if (error) {
      console.warn("Gagal menghapus memori dari database:", error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Memori berhasil dihapus.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
