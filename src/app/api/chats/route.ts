import { NextResponse } from "next/server";
import {
  fetchUserConversations,
  createNewConversation,
  deleteConversationRecord,
} from "@/lib/chat/database";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user_default_01";
    const chats = await fetchUserConversations(userId);
    return NextResponse.json({ chats: chats || [] });
  } catch (err: any) {
    return NextResponse.json({ chats: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      id,
      title = "Percakapan Baru",
      userId = "user_default_01",
    } = body;

    const chat = await createNewConversation({
      id,
      title,
      user_id: userId,
    });

    return NextResponse.json({ chat }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      {
        chat: {
          id: crypto.randomUUID(),
          title: "Percakapan Baru",
          user_id: "user_default_01",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
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

    await deleteConversationRecord(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: true });
  }
}
