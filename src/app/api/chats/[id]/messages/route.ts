import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id;
    if (!chatId || !isSupabaseConfigured()) {
      return NextResponse.json({ messages: [] });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ messages: [] });
    }

    const { data, error } = await supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Gagal mengambil histori pesan dari Supabase:", error.message);
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({ messages: data || [] });
  } catch (err: any) {
    console.warn("Peringatan pada GET /api/chats/[id]/messages:", err.message);
    return NextResponse.json({ messages: [] });
  }
}
