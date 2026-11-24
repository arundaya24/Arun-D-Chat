import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/chats?userId=...
 * Mengambil daftar riwayat sesi obrolan
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user_default_01";

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ chats: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/chats
 * Membuat sesi obrolan baru
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { title = "Percakapan Baru", userId = "user_default_01" } = body;

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      // Mock fallback jika database belum di-connect
      return NextResponse.json({
        chat: {
          id: "local_" + Date.now(),
          title,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    }

    const { data, error } = await supabase
      .from("chats")
      .insert({
        title,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ chat: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/chats?id=...
 * Menghapus sesi obrolan beserta pesan-pesannya
 */
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

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.from("chats").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Chat berhasil dihapus." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
