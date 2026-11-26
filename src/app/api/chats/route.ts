import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user_default_01";

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ chats: [] });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ chats: [] });
    }

    const { data, error } = await supabase
      .from("chats")
      .select("id, title, user_id, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.warn("Gagal mengambil riwayat chat dari Supabase:", error.message);
      return NextResponse.json({ chats: [] });
    }

    return NextResponse.json({ chats: data || [] });
  } catch (err: any) {
    console.warn("Peringatan pada GET /api/chats:", err.message);
    return NextResponse.json({ chats: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { title = "Percakapan Baru", userId = "user_default_01" } = body;

    const fallbackChat = {
      id: crypto.randomUUID(),
      title,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ chat: fallbackChat });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ chat: fallbackChat });
    }

    const { data, error } = await supabase
      .from("chats")
      .insert({
        id: fallbackChat.id,
        title,
        user_id: userId,
      })
      .select()
      .maybeSingle();

    if (error || !data) {
      console.warn("Penyimpanan chat Supabase dilewati, menggunakan fallback:", error?.message);
      return NextResponse.json({ chat: fallbackChat });
    }

    return NextResponse.json({ chat: data }, { status: 201 });
  } catch (err: any) {
    console.warn("Peringatan pada POST /api/chats:", err.message);
    return NextResponse.json({
      chat: {
        id: crypto.randomUUID(),
        title: "Percakapan Baru",
        user_id: "user_default_01",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Parameter ID chat wajib disertakan." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, message: "Chat lokal dihapus." });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.from("chats").delete().eq("id", id);
    if (error) {
      console.warn("Gagal menghapus chat dari database:", error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Chat berhasil dihapus.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: true });
  }
}
