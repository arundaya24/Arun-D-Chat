import { NextResponse } from "next/server";
import {
  fetchConversationById,
  updateConversationTitle,
  deleteConversationRecord,
} from "@/lib/chat/database";

interface RouteParams {
  params: { id: string };
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ chat: null }, { status: 400 });
  }

  const chat = await fetchConversationById(id);
  return NextResponse.json({ chat });
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

    await updateConversationTitle(id, title.trim());
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ success: true });
  }

  await deleteConversationRecord(id);
  return NextResponse.json({ success: true });
}
