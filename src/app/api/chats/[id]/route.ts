import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

interface RouteParams {
  params: { id: string };
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ chat: null }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ chat: null }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("chats")
    .select("id, title, user_id, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ chat: null }, { status: 404 });
  }

  return NextResponse.json({ chat: data });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = params;

  try {
    const body = await req.json().catch(() => ({}));
    const { title } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Judul chat tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from("chats")
      .update({ title: title.trim(), updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.warn("Gagal memperbarui judul chat:", error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.from("chats").delete().eq("id", id);
  if (error) {
    console.warn("Gagal menghapus chat:", error.message);
  }

  return NextResponse.json({ success: true });
}
