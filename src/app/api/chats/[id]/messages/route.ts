import { NextResponse } from "next/server";
import { fetchConversationMessages } from "@/lib/chat/database";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id;
    if (!chatId) {
      return NextResponse.json({ messages: [] });
    }

    const messages = await fetchConversationMessages(chatId);
    return NextResponse.json({ messages: messages || [] });
  } catch (err: any) {
    return NextResponse.json({ messages: [] });
  }
}
